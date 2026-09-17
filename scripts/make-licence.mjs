/**
 * Issue an ImageAlchemy Pro licence key.
 *
 *   node scripts/make-licence.mjs --secret <your-secret> [--tier pro] [--count 1]
 *
 * The key format and the checksum algorithm here MUST stay byte-identical to
 * `verifyLicenceKey` in src/lib/pro.ts, or issued keys will be rejected. This
 * script deliberately re-implements the algorithm in Node rather than importing
 * the browser module, because the browser module reads `import.meta.env` and
 * Web Crypto's global `crypto` — neither of which exists in a plain Node
 * script. The duplication is small and pinned by `scripts/test-licence.mjs`,
 * which generates a key with this script and verifies it with the same code
 * path the browser uses.
 *
 * The secret is read from the CLI, from $VITE_PRO_LICENCE_SECRET, or from a
 * prompt. It is never written to disk by this script.
 */
import crypto from "node:crypto";
import readline from "node:readline";

// Crockford Base32 — I, L, O and U are omitted so a key read off a receipt
// cannot be mistyped into a different valid character.
const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * The key prefix.
 *
 * MUST contain only Crockford-legal characters. The verifier normalises user
 * input by rewriting I→1, L→1 and O→0 and dropping anything outside [0-9A-Z];
 * a prefix containing I or L would be rewritten by that step and then fail its
 * own prefix check. See the note in src/lib/pro.ts — this bug was real, shipped
 * once in a draft, and is now pinned by scripts/test-licence.mjs.
 */
const KEY_PREFIX = "ACHM";

export function base32Encode(bytes) {
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

/** HMAC-SHA256 over the payload, truncated to 4 base32 chars (20 bits). */
export function checksum(payload, secret) {
  const sig = crypto.createHmac("sha256", secret).update(payload).digest();
  return base32Encode(new Uint8Array(sig)).slice(0, 4);
}

/** Encode a date as 7 base32 characters of days-since-epoch (fits until year 5765). */
function encodeDay(date) {
  let day = Math.floor(date.getTime() / 86400000);
  let out = "";
  for (let i = 0; i < 7; i++) {
    out = B32[day % 32] + out;
    day = Math.floor(day / 32);
  }
  return out;
}

/** Encode a 3-character tier tag as a 3-char base32 suffix. */
function encodeTier(tier) {
  const tag = (tier || "pro").toLowerCase().slice(0, 3).padEnd(3, "x");
  return tag
    .split("")
    .map((c) => {
      const idx = B32.indexOf(c.toUpperCase());
      // Map any out-of-alphabet character deterministically rather than
      // failing, so an unusual tier name still produces a usable key.
      return B32[idx === -1 ? c.charCodeAt(0) % 32 : idx];
    })
    .join("");
}

export function makeKey({ secret, tier = "pro", date = new Date() }) {
  // Guard against the exact regression that was caught by test-licence.mjs:
  // a prefix that its own normaliser rewrites. Checked on every call because it
  // costs nothing and the failure mode (every issued key is rejected) is the
  // most expensive bug this codebase could ship.
  const normalisedPrefix = KEY_PREFIX.toUpperCase()
    .replace(/O/g, "0").replace(/[IL]/g, "1").replace(/U/g, "V");
  if (normalisedPrefix !== KEY_PREFIX) {
    throw new Error(
      `KEY_PREFIX "${KEY_PREFIX}" does not survive normalisation (becomes "${normalisedPrefix}"). ` +
        `Use only characters from ${B32}.`,
    );
  }
  for (const ch of KEY_PREFIX) {
    if (!B32.includes(ch)) throw new Error(`KEY_PREFIX contains "${ch}", which is not in the Crockford alphabet.`);
  }

  const payload = encodeDay(date) + encodeTier(tier);
  const check = checksum(payload, secret);
  const body = payload + check;
  // Group for human transcription: ACHM-XXXXX-XXXXX-XX
  return `${KEY_PREFIX}-${body.slice(0, 5)}-${body.slice(5, 10)}-${body.slice(10)}`;
}

/** Verify, mirroring the browser implementation exactly. */
export function verifyKey(key, secret) {
  const normalised = key
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
    .replace(/U/g, "V");

  if (!normalised.startsWith(KEY_PREFIX)) return { valid: false, reason: "bad prefix" };
  const body = normalised.slice(KEY_PREFIX.length);
  if (body.length !== 14) return { valid: false, reason: `bad length (${body.length}, expected 14)` };

  const payload = body.slice(0, 10);
  const provided = body.slice(10, 14);
  const expected = checksum(payload, secret);
  if (expected !== provided) return { valid: false, reason: "checksum mismatch" };

  let epochDay = 0;
  for (const ch of payload.slice(0, 7)) {
    const idx = B32.indexOf(ch);
    if (idx === -1) return { valid: false, reason: "bad character" };
    epochDay = epochDay * 32 + idx;
  }
  return {
    valid: true,
    issuedOn: new Date(epochDay * 86400000).toISOString().slice(0, 10),
    tier: payload.slice(7),
  };
}

// ── CLI ──────────────────────────────────────────────────────────────────────
async function main() {
  const argv = process.argv.slice(2);
  const arg = (name, fallback = null) => {
    const i = argv.indexOf(`--${name}`);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
  };

  let secret = arg("secret") || process.env.VITE_PRO_LICENCE_SECRET || "";
  const tier = arg("tier", "pro");
  const count = Math.max(1, Math.min(500, Number(arg("count", "1")) || 1));

  // A short secret is the whole security of the offline check. Refuse it rather
  // than silently issuing keys anyone could forge.
  if (secret && secret.length < 24) {
    console.error(
      `\nRefusing to use that secret: it is ${secret.length} characters.\n` +
        `The secret is the only thing standing between a key and a forgery, and it\n` +
        `ships inside the public bundle. Use at least 24 characters:\n\n` +
        `  openssl rand -base64 32\n`,
    );
    process.exit(1);
  }

  if (!secret) {
    if (!process.stdin.isTTY) {
      console.error("No secret. Pass --secret <value> or set VITE_PRO_LICENCE_SECRET.");
      process.exit(1);
    }
    secret = await new Promise((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question("Licence secret (input is visible; prefer --secret): ", (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
    if (secret.length < 24) {
      console.error("Secret too short (minimum 24 characters).");
      process.exit(1);
    }
  }

  console.log("");
  for (let i = 0; i < count; i++) {
    // Small random date jitter would be wrong here — the issue date is real
    // information the customer can check against their receipt.
    const key = makeKey({ secret, tier, date: new Date() });
    const check = verifyKey(key, secret);
    if (!check.valid) {
      // Self-check: never hand out a key this build cannot verify.
      console.error(`\nFATAL: generated key failed self-verification (${check.reason}). This is a bug.`);
      process.exit(1);
    }
    console.log(key);
  }
  console.log(`\nTier: ${tier} · issued ${new Date().toISOString().slice(0, 10)}`);
  console.log("Give one key to each customer. It verifies offline and never expires.\n");
}

// Only run the CLI when invoked directly, so the module can be imported by tests.
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` || process.argv[1]?.endsWith("make-licence.mjs")) {
  main();
}
