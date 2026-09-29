/**
 * ImageAlchemy Pro payment-security regression test.
 *
 * These checks intentionally pin the architecture rather than mock Stripe:
 * Stripe secrets and signing keys must stay server-side, a checkout return must
 * be redeemed through the Worker, the Worker must verify payment_status + the
 * exact configured Price ID, and premium audit requests must carry a signed
 * entitlement.
 */
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const client = read("src/lib/pro.ts");
const hook = read("src/hooks/usePro.ts");
const proPage = read("src/pages/Pro.tsx");
const audit = read("src/lib/audit.ts");
const worker = read("workers/audit-proxy/src/index.ts");
const env = read(".env.example");
const app = read("src/App.tsx");

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

console.log("\nPro payment + entitlement security contract\n");

check(
  "browser env contains no licence signing secret",
  !env.includes("VITE_PRO_LICENCE_SECRET") && !client.includes("VITE_PRO_LICENCE_SECRET"),
);
check(
  "browser env contains no Stripe secret key",
  !env.includes("STRIPE_SECRET_KEY") && !client.includes("STRIPE_SECRET_KEY"),
);
check(
  "checkout is created through the Worker",
  client.includes('apiUrl("/api/checkout")') && worker.includes('url.pathname === "/api/checkout"'),
);
check(
  "checkout success returns to an existing /pro route",
  worker.includes('/pro?session_id={CHECKOUT_SESSION_ID}') &&
    app.includes('path={route.path} element={<Pro />}'),
);
check(
  "client never treats session_id itself as proof of payment",
  proPage.includes("redeemCheckout(sessionId)") &&
    !proPage.includes("Payment received — one last step."),
);
check(
  "Worker retrieves the Checkout Session from Stripe",
  worker.includes("/checkout/sessions/") && worker.includes("STRIPE_SECRET_KEY"),
);
check(
  "Worker requires Stripe payment_status=paid",
  worker.includes('session.payment_status !== "paid"'),
);
check(
  "Worker verifies the exact configured Stripe Price ID",
  worker.includes("item.price?.id === env.STRIPE_PRICE_ID"),
);
check(
  "Worker requires the expected product metadata",
  worker.includes('session.metadata?.product_id !== PRODUCT_ID'),
);
check(
  "entitlement signing secret is Worker-only",
  worker.includes("ENTITLEMENT_SECRET") && !client.includes("ENTITLEMENT_SECRET"),
);
check(
  "stored Pro entitlement is a signed token, not a trusted boolean",
  client.includes("token: string") && !client.includes("verified: boolean"),
);
check(
  "stored entitlement is revalidated by the Worker",
  client.includes('/api/entitlement/status') && worker.includes('/api/entitlement/status'),
);
check(
  "premium audit client sends Bearer entitlement",
  audit.includes('Authorization: `Bearer ${opts.entitlementToken}`'),
);
check(
  "premium audit Worker rejects missing/invalid entitlement",
  worker.includes("A valid ImageAlchemy Pro entitlement is required."),
);
check(
  "legacy licences are verified only server-side",
  client.includes('/api/entitlement/legacy') &&
    worker.includes("LEGACY_LICENCE_SECRET") &&
    !client.includes("LEGACY_LICENCE_SECRET"),
);
check(
  "free app remains separate from Pro entitlement hook",
  !read("src/pages/Index.tsx").includes("usePro("),
);

console.log(`\n${"─".repeat(64)}`);
if (failures.length) {
  console.log(`FAILED — ${passed} passed, ${failures.length} failed:\n`);
  for (const failure of failures) console.log(`  • ${failure}`);
  console.log("");
  process.exit(1);
}
console.log(`ALL PASS — ${passed} assertions.\n`);
