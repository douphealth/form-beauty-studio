/**
 * ImageAlchemy Pro entitlement client.
 *
 * Security boundary:
 * - The browser never receives a Stripe secret, signing secret, or licence secret.
 * - Checkout Sessions are created by the Cloudflare Worker.
 * - A checkout return is NOT trusted. The Worker retrieves the Checkout Session
 *   from Stripe, requires payment_status=paid, and verifies the exact Stripe
 *   Price ID before issuing a signed entitlement token.
 * - Premium audit requests carry that token as a Bearer credential. The Worker
 *   verifies the HMAC before it fetches any page.
 *
 * The free compressor remains entirely client-side and needs no entitlement.
 */

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

function cleanBase(value: string | undefined): string {
  return (value ?? "").trim().replace(/\/$/, "");
}

export const PRO_CONFIG = {
  productId: env.VITE_PRO_PRODUCT_ID ?? "pro_lifetime",
  apiUrl: cleanBase(env.VITE_PRO_API_URL ?? env.VITE_AUDIT_PROXY_URL),
  auditProxyUrl: cleanBase(env.VITE_AUDIT_PROXY_URL ?? env.VITE_PRO_API_URL),
  successPath: "/pro",
} as const;

export const AUDIT_CONFIGURED = Boolean(PRO_CONFIG.auditProxyUrl && PRO_CONFIG.apiUrl);
export const PRO_PRICE_DISPLAY = env.VITE_PRO_PRICE_DISPLAY ?? "$19";

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
    body: "Pay once. Stripe verifies the purchase and Pro unlocks automatically in this browser. No recurring billing.",
  },
  {
    title: "Markdown report you can paste anywhere",
    body: "Every audit exports as clean Markdown — straight into a ticket, a client email, Slack or Notion, with the numbers intact.",
  },
];

const STORAGE_KEY = "imagealchemy:pro:v2";

export interface ProEntitlement {
  token: string;
  activatedAt: string;
  source: "stripe-checkout" | "legacy-licence";
  productId: string;
}

export interface ProStatus {
  isPro: boolean;
  entitlement: ProEntitlement | null;
  checking: boolean;
}

interface ApiErrorBody {
  error?: string;
  message?: string;
}

interface EntitlementResponse {
  ok?: boolean;
  token?: string;
  productId?: string;
  source?: ProEntitlement["source"];
  error?: string;
}

function apiUrl(path: string): string {
  if (!PRO_CONFIG.apiUrl) return "";
  return `${PRO_CONFIG.apiUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return body.error || body.message || fallback;
  } catch {
    return fallback;
  }
}

function bearer(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export function readEntitlement(): ProEntitlement | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProEntitlement;
    if (
      !parsed ||
      typeof parsed.token !== "string" ||
      parsed.token.length < 32 ||
      typeof parsed.activatedAt !== "string" ||
      (parsed.source !== "stripe-checkout" && parsed.source !== "legacy-licence")
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeEntitlement(entitlement: ProEntitlement): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entitlement));
  } catch {
    // Storage can be unavailable in strict/private browser modes. The user can
    // redeem their Stripe session or legacy key again without being charged.
  }
}

export function clearEntitlement(): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* non-fatal */
  }
}

/**
 * Verify the stored token at the enforcement boundary.
 * A hand-edited localStorage record cannot unlock the audit Worker.
 */
export async function checkEntitlement(): Promise<ProStatus> {
  const entitlement = readEntitlement();
  if (!entitlement) return { isPro: false, entitlement: null, checking: false };
  const endpoint = apiUrl("/api/entitlement/status");
  if (!endpoint) return { isPro: false, entitlement: null, checking: false };

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/json", ...bearer(entitlement.token) },
      cache: "no-store",
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) clearEntitlement();
      return { isPro: false, entitlement: response.status >= 500 ? entitlement : null, checking: false };
    }
    const body = (await response.json()) as { ok?: boolean; productId?: string };
    if (!body.ok || (body.productId && body.productId !== PRO_CONFIG.productId)) {
      clearEntitlement();
      return { isPro: false, entitlement: null, checking: false };
    }
    return { isPro: true, entitlement, checking: false };
  } catch {
    // The paid feature itself needs the Worker, so an offline browser cannot run
    // an audit anyway. Keep the token for recovery but don't claim Pro is usable.
    return { isPro: false, entitlement, checking: false };
  }
}

/** Ask the Worker to create a real Stripe Checkout Session. */
export async function createCheckoutSession(): Promise<{ url: string } | { error: string }> {
  const endpoint = apiUrl("/api/checkout");
  if (!endpoint) return { error: "Checkout is not configured on this deployment." };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ productId: PRO_CONFIG.productId }),
    });
    if (!response.ok) {
      return { error: await readApiError(response, "Could not start checkout. Please try again.") };
    }
    const body = (await response.json()) as { url?: string };
    if (!body.url || !body.url.startsWith("https://")) {
      return { error: "Checkout returned an invalid payment URL." };
    }
    return { url: body.url };
  } catch {
    return { error: "Could not reach checkout. Check your connection and try again." };
  }
}

async function storeIssuedEntitlement(
  response: Response,
  source: ProEntitlement["source"],
): Promise<string | null> {
  if (!response.ok) return readApiError(response, "Pro could not be activated.");
  const body = (await response.json()) as EntitlementResponse;
  if (!body.ok || !body.token || body.token.length < 32) {
    return body.error || "The entitlement response was incomplete.";
  }
  const entitlement: ProEntitlement = {
    token: body.token,
    activatedAt: new Date().toISOString(),
    source: body.source ?? source,
    productId: body.productId ?? PRO_CONFIG.productId,
  };
  writeEntitlement(entitlement);
  return null;
}

/**
 * Exchange a Stripe Checkout Session ID for a signed Pro entitlement.
 * The Worker independently verifies the session with Stripe and checks the
 * exact configured Price ID before it returns a token.
 */
export async function redeemCheckoutSession(sessionId: string): Promise<string | null> {
  const endpoint = apiUrl("/api/entitlement/redeem");
  if (!endpoint) return "The Pro activation service is not configured.";
  const clean = sessionId.trim();
  if (!clean.startsWith("cs_") || clean.length < 12) return "That checkout session ID is invalid.";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ sessionId: clean, productId: PRO_CONFIG.productId }),
    });
    return await storeIssuedEntitlement(response, "stripe-checkout");
  } catch {
    return "Could not verify the payment with Stripe. Check your connection and try again.";
  }
}

/**
 * Backward-compatible migration path for old ACHM licence keys.
 * Verification happens only on the Worker; no signing secret is shipped to the browser.
 */
export async function exchangeLegacyLicence(rawKey: string): Promise<string | null> {
  const endpoint = apiUrl("/api/entitlement/legacy");
  if (!endpoint) return "The Pro activation service is not configured.";
  const key = rawKey.trim();
  if (key.length < 8) return "That licence key looks too short.";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ key, productId: PRO_CONFIG.productId }),
    });
    return await storeIssuedEntitlement(response, "legacy-licence");
  } catch {
    return "Could not verify that licence key. Check your connection and try again.";
  }
}

/** Human-friendly normalisation retained for legacy-key input only. */
export function normaliseLicenceKey(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
    .replace(/U/g, "V");
}

export function formatLicenceKey(normalised: string): string {
  return normalised.replace(/(.{5})/g, "$1-").replace(/-$/, "");
}
