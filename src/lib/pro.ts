/**
 * Pro entitlement layer.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THREAT MODEL — read this before changing anything here.
 * ─────────────────────────────────────────────────────────────────────────────
 * ImageAlchemy is a 100% client-side application. There is no server that could
 * hold a secret, which means **anything the browser can check, a determined
 * user can bypass.** No amount of obfuscation changes that.
 *
 * So this module does NOT pretend to be DRM. It is a *fair-dealing gate*: it
 * makes paying the easy, obvious path and makes circumventing it deliberate
 * work. That is the honest ceiling of a client-side product, and it is the same
 * ceiling every offline-capable paid app lives with.
 *
 * What it DOES do properly:
 *   - Verifies a signed licence key can be checked offline (HMAC over a
 *     canonical payload). A randomly-typed key is rejected, so a key cannot be
 *     forged by guessing — only by someone who extracts the shared secret from
 *     the bundle, which is a deliberate act.
 *   - Persists the entitlement so a paying customer is not asked twice.
 *   - Degrades to a clear, non-hostile state if verification fails.
 *
 * What it explicitly does NOT do:
 *   - Claim to be unbreakable.
 *   - Phone home on every load (that would be surveillance, and a privacy
 *     regression against the rest of the product).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SETUP — what the owner must supply
 * ─────────────────────────────────────────────────────────────────────────────
 * See `docs/STRIPE-SETUP.md`. In short:
 *   1. Create a Stripe Payment Link (one-time price) and put the URL in
 *      `PRO_CONFIG.checkoutUrl` below, or in the VITE_ env vars.
 *   2. Generate a licence-secret and issue keys with `scripts/make-licence.mjs`.
 *   3. Optionally deploy the Worker in `workers/` for key issuance + validation.
 */

/**
 * Publish-time configuration.
 *
 * Read from Vite env vars where available so the values can be set at build
 * time without editing source (and so a fork can configure its own).
 * `import.meta.env` is inlined by Vite; the cast keeps TypeScript happy without
 * adding a global declaration for every key.
 */
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

export const PRO_CONFIG = {
  /** Product id shown to Stripe. */
  productId: env.VITE_PRO_PRODUCT_ID ?? "pro_lifetime",
  /** Stripe Payment Link for the one-time Pro purchase. */
  checkoutUrl: env.VITE_STRIPE_CHECKOUT_URL ?? "",
  /** Where the buyer is sent after a successful payment. */
  successPath: "/pro/success",
  /**
   * Optional licence validator endpoint (the Worker in `workers/licence-api`).
   * When empty, the client verifies keys offline using the embedded secret.
   */
  validateUrl: env.VITE_PRO_VALIDATE_URL ?? "",
  /**
   * Shared secret for OFFLINE key verification.
   *
   * This is deliberately NOT empty in the default build: a build with no secret
   * could not verify anything, and the site would ship a gate that accepts any
   * input. Set a real value at build time via VITE_PRO_LICENCE_SECRET and treat
   * it as public — see the threat model above.
   */
  licenceSecret: env.VITE_PRO_LICENCE_SECRET ?? "imagealchemy-dev-secret-change-me",
  /**
   * Base URL of the audit proxy Worker (`workers/audit-proxy`).
   *
   * Required for the Website Image Audit to work at all: a browser cannot read
   * a third-party page's body (same-origin policy), so this is the one
   * serverless piece in an otherwise entirely client-side product. See
   * `docs/STRIPE-SETUP.md` for deployment, and `workers/audit-proxy/README.md`
   * for why it only fetches.
   */
  auditProxyUrl: env.VITE_AUDIT_PROXY_URL ?? "",
  /** Shared token sent to the proxy as `x-audit-token`. Public by definition. */
  auditToken: env.VITE_AUDIT_TOKEN ?? "",
} as const;

/** True when the audit can actually run — used to hide the feature when unconfigured. */
export const AUDIT_CONFIGURED = Boolean(PRO_CONFIG.auditProxyUrl);

/** Price shown to users, in the currency they are charged. Display only. */
export const PRO_PRICE_DISPLAY = env.VITE_PRO_PRICE_DISPLAY ?? "$19";

/** What the one-time purchase buys. Rendered on the paywall and the Pro page. */
export const PRO_BENEFITS: { title: string; body: string }[] = [
  {
    title: "Full-site image audit",
    body: "Point it at any URL and get every image the page loads, measured — total bytes, per-file weight, format, caching and the exact saving each fix would deliver.",
  },
  {
    title: "A prioritised fix list",
    body: "Findings are ordered by how much they cost you and written as instructions, not diagnostics. Each one names the files it is about.",
  },
  {
    title: "Core Web Vitals impact",
    body: "Estimated transfer time on a real 4G connection, plus the CLS and LCP problems hiding in your markup.",
  },
  {
    title: "One-time payment, no subscription",
    body: "Pay once. The licence works offline, in this browser, forever. No account, no expiry, no card on file.",
  },
  {
    title: "Markdown report you can paste anywhere",
    body: "Every audit exports as clean Markdown — straight into a ticket, a client email, Slack or Notion, with the numbers intact.",
  },
];

/** localStorage key for the stored entitlement. */
const STORAGE_KEY = "imagealchemy:pro";

export interface ProEntitlement {
  /** The licence key the customer holds. */
  key: string;
  /** ISO timestamp of activation. */
  activatedAt: string;
  /** How the entitlement was obtained. */
  source: "licence-key" | "checkout-return";
  /** Verified locally at activation time. */
  verified: boolean;
}

export interface ProStatus {
  isPro: boolean;
  entitlement: ProEntitlement | null;
  /** True while a verification is in flight. */
  checking: boolean;
}

// ── Base32 (Crockford) — no ambiguous characters, human-transcribable ────────
//
// Crockford's alphabet omits I, L, O and U so a key read off a receipt cannot
// be mistyped as a different valid character.
const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function base32Encode(bytes: Uint8Array): string {
  let out = "";
  let bits = 0;
  let value = 0;
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

/**
 * Normalise user input: strip formatting, uppercase, and map the characters
 * Crockford's alphabet excludes onto the digits they are mistaken for. A user
 * reading "O" from a receipt almost certainly meant zero.
 */
export function normaliseLicenceKey(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
    .replace(/U/g, "V");
}

/** Format a normalised key into readable groups of five. */
export function formatLicenceKey(normalised: string): string {
  return normalised.replace(/(.{5})/g, "$1-").replace(/-$/, "");
}

// ── Licence key format ──────────────────────────────────────────────────────
//
//   ACHM-<payload>-<checksum>
//
// `payload` is 10 base32 characters encoding the issue date and a 3-char tier.
// `checksum` is the first 4 base32 characters of HMAC-SHA256(secret, payload).
//
// This makes a key:
//   - self-describing enough to validate offline,
//   - resistant to casual guessing (2^20 checksum space, not "any string"),
//   - transcribable by a human without ambiguity.
//
// ── WHY THE PREFIX IS "ACHM" AND NOT SOMETHING READABLE ─────────────────────
//
// The prefix was originally "IALC". That was a design error, caught by
// scripts/test-licence.mjs: normaliseLicenceKey() rewrites I→1 and L→1, because
// Crockford's alphabet excludes I and L precisely so a human cannot confuse
// them with 1. Applying that normalisation to a literal prefix containing both
// letters turned "IALC" into "1A1C", and the prefix check then rejected every
// key the generator issued — including valid ones. A prefix that its own
// normaliser destroys is unusable.
//
// "ACHM" uses only characters inside the Crockford alphabet (A, C, H, M), so it
// survives normalisation untouched. It is also short enough to stay readable
// while being distinctive enough not to be mistaken for the payload.
const KEY_PREFIX = "ACHM";

async function hmac(payload: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(PRO_CONFIG.licenceSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(payload));
  return base32Encode(new Uint8Array(sig)).slice(0, 4);
}

export interface LicenceCheck {
  valid: boolean;
  reason?: string;
  issuedOn?: string;
  tier?: string;
}

/**
 * Verify a licence key offline.
 *
 * Returns a structured result rather than a boolean so the UI can explain the
 * specific problem ("that key has a typo", "that key is for a different
 * product") instead of a blanket "invalid".
 */
export async function verifyLicenceKey(rawKey: string): Promise<LicenceCheck> {
  const normalised = normaliseLicenceKey(rawKey);
  if (normalised.length < 14) {
    return { valid: false, reason: "That key looks too short. Check for missing characters." };
  }
  if (!normalised.startsWith(KEY_PREFIX)) {
    return { valid: false, reason: `Keys start with ${KEY_PREFIX}. Check you pasted the right one.` };
  }

  const body = normalised.slice(KEY_PREFIX.length);
  const payload = body.slice(0, 10);
  const provided = body.slice(10, 14);
  if (payload.length !== 10 || provided.length !== 4) {
    return { valid: false, reason: "That key is not the expected length." };
  }

  let expected: string;
  try {
    expected = await hmac(payload);
  } catch {
    return { valid: false, reason: "This browser cannot verify keys (Web Crypto unavailable)." };
  }

  if (expected !== provided) {
    return { valid: false, reason: "This key could not be verified. Check it was copied in full." };
  }

  // Decode the issue date. Payload layout: 7 chars of epoch-day (base32) + 3 chars tier.
  const dayPart = payload.slice(0, 7);
  const tierPart = payload.slice(7);
  let epochDay = 0;
  for (const ch of dayPart) {
    const idx = B32.indexOf(ch);
    if (idx === -1) return { valid: false, reason: "That key contains an unexpected character." };
    epochDay = epochDay * 32 + idx;
  }
  const issuedOn = new Date(epochDay * 86400000).toISOString().slice(0, 10);

  return { valid: true, issuedOn, tier: tierPart };
}

// ── Persistence ─────────────────────────────────────────────────────────────

export function readEntitlement(): ProEntitlement | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProEntitlement;
    // Defensive: a hand-edited or truncated value must not crash the app.
    if (!parsed || typeof parsed.key !== "string" || !parsed.key) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeEntitlement(entitlement: ProEntitlement): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entitlement));
  } catch {
    // Storage can be full or blocked (private mode). Non-fatal: the user simply
    // has to re-enter the key next session.
  }
}

export function clearEntitlement(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Does this stored entitlement currently grant Pro?
 *
 * Re-verifies the signature on every read rather than trusting the stored
 * `verified` flag, so hand-editing localStorage to set `verified: true` does
 * not work. It is still bypassable by anyone willing to patch the bundle —
 * see the threat model — but it removes the trivial attack.
 */
export async function checkEntitlement(): Promise<ProStatus> {
  const entitlement = readEntitlement();
  if (!entitlement) return { isPro: false, entitlement: null, checking: false };

  const result = await verifyLicenceKey(entitlement.key);
  if (!result.valid) {
    clearEntitlement();
    return { isPro: false, entitlement: null, checking: false };
  }
  return { isPro: true, entitlement, checking: false };
}

/** Build the Stripe checkout URL, carrying the return path. */
export function buildCheckoutUrl(): string {
  const base = PRO_CONFIG.checkoutUrl;
  if (!base) return "";
  const url = new URL(base);
  // Where Stripe sends the buyer afterwards. The success page completes
  // activation from the session id Stripe appends.
  url.searchParams.set(
    "success_url",
    `${window.location.origin}${PRO_CONFIG.successPath}?session_id={CHECKOUT_SESSION_ID}`,
  );
  return url.toString();
}
