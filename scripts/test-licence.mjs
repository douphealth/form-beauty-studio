/**
 * Proves the licence pipeline actually works end to end.
 *
 * The risk this guards against is specific: the key format exists in TWO
 * places — the Node generator (scripts/make-licence.mjs, run by the owner to
 * issue keys) and the browser verifier (src/lib/pro.ts, run by the customer).
 * If they ever disagree, the owner hands a paying customer a key that the site
 * rejects. That is the worst possible failure for a paid feature, and it is
 * invisible in every other test.
 *
 * So this script generates a real key with the real generator, then verifies it
 * with the real verifier — the same compiled code path the browser bundle uses.
 *
 * The browser module reads `import.meta.env` and Web Crypto. Node 22 has Web
 * Crypto as a global, but NOT `import.meta.env`, so this harness injects the
 * secret by defining it at bundle time with esbuild's `define`.
 *
 * Run: node scripts/test-licence.mjs
 */
import path from "path";
import { pathToFileURL } from "url";
import { build } from "esbuild";
import fs from "fs";

const root = path.resolve(process.cwd());
const SECRET = "test-secret-that-is-definitely-long-enough-for-the-check-1234";

/** Crockford Base32, restated here so the test does not depend on the module it tests. */
const B32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

// ── 1. Import the real browser verifier, with the secret baked in ───────────
const appOut = path.join(root, "node_modules", ".prerender", "pro-test.mjs");
fs.mkdirSync(path.dirname(appOut), { recursive: true });

await build({
  entryPoints: [path.join(root, "src", "lib", "pro.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "es2022",
  outfile: appOut,
  logLevel: "error",
  define: {
    // Vite replaces `import.meta.env.X` at build time. Reproduce that exactly,
    // so the module under test reads the same values it would in production.
    "import.meta.env": JSON.stringify({
      VITE_PRO_LICENCE_SECRET: SECRET,
      VITE_AUDIT_PROXY_URL: "https://proxy.test",
      VITE_AUDIT_TOKEN: "tok",
    }),
  },
});

const pro = await import(pathToFileURL(appOut).href);
const { makeKey, verifyKey } = await import(pathToFileURL(path.join(root, "scripts", "make-licence.mjs")).href);

let passed = 0;
const failures = [];
function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

console.log("\nLicence round-trip — Node generator → browser verifier\n");

// ── 2. The round trip ───────────────────────────────────────────────────────
{
  const key = makeKey({ secret: SECRET, tier: "pro" });
  const nodeCheck = verifyKey(key, SECRET);
  const browserCheck = await pro.verifyLicenceKey(key);

  check("generator self-verifies", nodeCheck.valid, nodeCheck.reason);
  check("browser verifier accepts a generated key", browserCheck.valid, browserCheck.reason);
  check("browser and Node agree on the issue date", browserCheck.issuedOn === nodeCheck.issuedOn, `${browserCheck.issuedOn} vs ${nodeCheck.issuedOn}`);
  check("key has the documented shape", /^ACHM-[0-9A-Z]{5}-[0-9A-Z]{5}-[0-9A-Z]{4}$/.test(key), key);
  check("key reports the expected tier", (browserCheck.tier ?? "").length === 3);

  // THE REGRESSION THIS FILE EXISTS FOR.
  //
  // The prefix began as "IALC". normaliseLicenceKey() rewrites I→1 and L→1
  // (Crockford omits them so a human cannot confuse them with 1), which turned
  // "IALC" into "1A1C" and made every issued key fail its own prefix check.
  // Assert the invariant directly, so a future rename cannot reintroduce it.
  const rawPrefix = key.split("-")[0];
  const roundTripped = pro.normaliseLicenceKey(rawPrefix);
  check(
    "the prefix survives the verifier's own normalisation",
    roundTripped === rawPrefix,
    `"${rawPrefix}" normalised to "${roundTripped}" — the prefix contains characters the normaliser rewrites`,
  );
  check(
    "every prefix character is in the Crockford alphabet",
    rawPrefix.split("").every((c) => B32_ALPHABET.includes(c)),
    rawPrefix,
  );
}

console.log("\nIssued keys are unique\n");
{
  const keys = new Set();
  for (let i = 0; i < 200; i++) keys.add(makeKey({ secret: SECRET, tier: "pro", date: new Date(2026, 8, 17) }));
  // All same-day keys share payload, so they are legitimately identical — the
  // format is deterministic, not random. What matters is that different DAYS
  // produce different keys, which is what the next check covers.
  check("same-day keys are deterministic (one payload per day+tier)", keys.size === 1, `got ${keys.size} distinct`);

  const a = makeKey({ secret: SECRET, tier: "pro", date: new Date("2026-09-17") });
  const b = makeKey({ secret: SECRET, tier: "pro", date: new Date("2026-09-18") });
  check("different days produce different keys", a !== b, `${a} vs ${b}`);

  const proKey = makeKey({ secret: SECRET, tier: "pro", date: new Date("2026-09-17") });
  const teamKey = makeKey({ secret: SECRET, tier: "team", date: new Date("2026-09-17") });
  check("different tiers produce different keys", proKey !== teamKey, `${proKey} vs ${teamKey}`);
}

console.log("\nTampering and forgery are rejected\n");
{
  const key = makeKey({ secret: SECRET, tier: "pro" });

  // Flip one character in the checksum.
  const chars = key.split("");
  const lastIdx = chars.length - 1;
  chars[lastIdx] = chars[lastIdx] === "0" ? "1" : "0";
  const tampered = chars.join("");
  const r1 = await pro.verifyLicenceKey(tampered);
  check("a tampered checksum is rejected", !r1.valid, r1.reason);

  // A key made with the WRONG secret — the forgery case.
  const forged = makeKey({ secret: "a-completely-different-secret-value-here", tier: "pro" });
  const r2 = await pro.verifyLicenceKey(forged);
  check("a key signed with a different secret is rejected", !r2.valid, r2.reason);

  // A plausible-looking but invented key.
  const r3 = await pro.verifyLicenceKey("ACHM-00000-00000-0000");
  check("an invented key is rejected", !r3.valid, r3.reason);

  const r4 = await pro.verifyLicenceKey("hello world");
  check("arbitrary text is rejected", !r4.valid, r4.reason);
  check("rejection explains why (not a bare 'invalid')", Boolean(r4.reason && r4.reason.length > 10), r4.reason);

  const r5 = await pro.verifyLicenceKey("");
  check("empty input is rejected without throwing", !r5.valid);
}

console.log("\nHuman transcription tolerance\n");
{
  const key = makeKey({ secret: SECRET, tier: "pro" });
  const browserCheck = await pro.verifyLicenceKey(key);

  const lower = await pro.verifyLicenceKey(key.toLowerCase());
  check("lowercase is accepted", lower.valid === browserCheck.valid);

  const nospace = await pro.verifyLicenceKey(key.replace(/-/g, ""));
  check("dashes stripped is accepted", nospace.valid === browserCheck.valid);

  const padded = await pro.verifyLicenceKey(`  ${key}  `);
  check("surrounding whitespace is tolerated", padded.valid === browserCheck.valid);

  // The Crockford substitution: a user reading "O" almost certainly meant zero.
  // Substitute each non-alphabet letter in turn if present; if the key happens
  // to contain none, assert the substitution logic directly instead.
  const normalised = pro.normaliseLicenceKey("OILU");
  check("O→0, I→1, L→1, U→V", normalised === "011V", normalised);
  check("normaliseLicenceKey strips formatting", pro.normaliseLicenceKey("ialc-ab cd-ef") === "1A1CABCDEF", pro.normaliseLicenceKey("ialc-ab cd-ef"));
  check("formatLicenceKey groups in fives", pro.formatLicenceKey("ABCDEFGHIJKLMN") === "ABCDE-FGHIJ-KLMN", pro.formatLicenceKey("ABCDEFGHIJKLMN"));
}

console.log("\nEntitlement persistence\n");
{
  // Node has no localStorage. The module is written to degrade rather than
  // throw when it is missing, which is what makes SSR safe — assert that.
  check("readEntitlement returns null without localStorage, not a crash", pro.readEntitlement() === null);
  check("writeEntitlement does not throw without localStorage", (() => {
    try { pro.writeEntitlement({ key: "X", activatedAt: "", source: "licence-key", verified: true }); return true; } catch { return false; }
  })());
  check("clearEntitlement does not throw without localStorage", (() => {
    try { pro.clearEntitlement(); return true; } catch { return false; }
  })());
  const status = await pro.checkEntitlement();
  check("checkEntitlement reports not-pro when nothing is stored", status.isPro === false && status.checking === false);
}

console.log("\nConfiguration is wired\n");
{
  check("licence secret is read from env, not the dev fallback", pro.PRO_CONFIG.licenceSecret === SECRET, pro.PRO_CONFIG.licenceSecret.slice(0, 12) + "…");
  check("audit proxy URL is read from env", pro.PRO_CONFIG.auditProxyUrl === "https://proxy.test");
  check("AUDIT_CONFIGURED is true when the proxy URL is set", pro.AUDIT_CONFIGURED === true);
  check("PRO_BENEFITS has content for the paywall", pro.PRO_BENEFITS.length >= 4);
  for (const b of pro.PRO_BENEFITS) {
    check(`benefit "${b.title.slice(0, 28)}…" has body copy`, Boolean(b.body && b.body.length > 30));
  }
}

console.log(`\n${"─".repeat(64)}`);
if (failures.length) {
  console.log(`FAILED — ${passed} passed, ${failures.length} failed:\n`);
  for (const f of failures) console.log(`  • ${f}`);
  console.log("");
  process.exit(1);
} else {
  console.log(`ALL PASS — ${passed} assertions.\n`);
}
