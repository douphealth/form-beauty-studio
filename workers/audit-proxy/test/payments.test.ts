// @vitest-environment node
/**
 * Behavioural tests for the Pro payment path in the audit-proxy Worker.
 *
 * scripts/test-licence.mjs pins the architecture by reading source text. These
 * tests execute the Worker itself: Stripe and target sites are replaced with
 * fakes at the fetch boundary, so every branch that decides whether money buys
 * access is exercised without any real Stripe credentials.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { isBlockedHost, type Env } from "../src/index";

const ORIGIN = "https://imagealchemy.app";
const PRICE = "price_test_pro_lifetime";

const ENV: Env = {
  ALLOWED_ORIGINS: `${ORIGIN},https://www.imagealchemy.app`,
  STRIPE_SECRET_KEY: "sk_test_" + "fake".repeat(6), // never a real key; built so secret scanners do not flag it
  STRIPE_PRICE_ID: PRICE,
  ENTITLEMENT_SECRET: "7f3c9a1e5b2d8f04a6c1e9b7d3f5a2c8e4b6d0f1a3c5e7b9d2f4a6c8e0b1d3f5",
  LEGACY_LICENCE_SECRET: "legacy-licence-secret-for-tests-only-0123456789abcdef",
};

interface Call {
  url: string;
  init?: RequestInit;
}

/** Route fetch(): Stripe calls to `stripe`, everything else to `target`. */
function installFetch(handlers: {
  stripe?: (url: string, init: RequestInit) => Response;
  target?: (url: string) => Response;
}): Call[] {
  const calls: Call[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      calls.push({ url, init });
      if (url.startsWith("https://api.stripe.com/v1/")) {
        return handlers.stripe ? handlers.stripe(url, init ?? {}) : json({ error: { message: "unmocked" } }, 500);
      }
      return handlers.target ? handlers.target(url) : new Response("unmocked", { status: 599 });
    }),
  );
  return calls;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function paidSession(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "cs_test_a1",
    mode: "payment",
    payment_status: "paid",
    metadata: { product_id: "pro_lifetime" },
    line_items: { data: [{ price: { id: PRICE } }] },
    ...overrides,
  };
}

function request(
  path: string,
  opts: { method?: string; origin?: string | null; token?: string; ip?: string; body?: unknown } = {},
): Request {
  const headers = new Headers();
  if (opts.origin) headers.set("origin", opts.origin);
  if (opts.token) headers.set("authorization", `Bearer ${opts.token}`);
  if (opts.ip) headers.set("cf-connecting-ip", opts.ip);
  if (opts.body !== undefined) headers.set("content-type", "application/json");
  return new Request(`https://audit.example.workers.dev${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
}

async function call(req: Request, env: Env = ENV): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await worker.fetch(req, env);
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function redeem(sessionId: string, env: Env = ENV) {
  return call(request("/api/entitlement/redeem", { method: "POST", origin: ORIGIN, body: { sessionId } }), env);
}

/** Issue a real entitlement through the redeem path, as the browser would. */
async function issueToken(): Promise<string> {
  installFetch({ stripe: () => json(paidSession()) });
  const { status, body } = await redeem("cs_test_a1");
  expect(status).toBe(200);
  return body.token as string;
}

// Base32 + HMAC, mirroring the Worker's legacy ACHM key scheme.
const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
async function legacyKey(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  let out = "";
  let bits = 0;
  let value = 0;
  for (const byte of sig) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return `ACHM-${payload.slice(0, 5)}-${payload.slice(5)}${out.slice(0, 4)}`;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/checkout", () => {
  it("creates a one-time payment session pinned to the server-side price", async () => {
    const calls = installFetch({
      stripe: () => json({ id: "cs_test_new", url: "https://checkout.stripe.com/c/pay/cs_test_new" }),
    });
    const { status, body } = await call(
      request("/api/checkout", { method: "POST", origin: ORIGIN, body: { productId: "pro_lifetime" } }),
    );

    expect(status).toBe(200);
    expect(body).toMatchObject({ ok: true, url: "https://checkout.stripe.com/c/pay/cs_test_new" });

    const stripeCall = calls.find((c) => c.url.endsWith("/checkout/sessions"));
    expect(stripeCall).toBeDefined();
    const form = new URLSearchParams(String(stripeCall?.init?.body));
    expect(form.get("mode")).toBe("payment");
    expect(form.get("line_items[0][price]")).toBe(PRICE);
    expect(form.get("line_items[0][quantity]")).toBe("1");
    expect(form.get("success_url")).toBe(`${ORIGIN}/pro?session_id={CHECKOUT_SESSION_ID}`);
    expect(form.get("cancel_url")).toBe(`${ORIGIN}/pro?checkout=cancelled`);
    expect(form.get("metadata[product_id]")).toBe("pro_lifetime");
  });

  it("ignores any price the browser tries to send", async () => {
    const calls = installFetch({ stripe: () => json({ id: "cs_x", url: "https://checkout.stripe.com/x" }) });
    await call(
      request("/api/checkout", {
        method: "POST",
        origin: ORIGIN,
        body: { productId: "pro_lifetime", priceId: "price_cheap", amount: 1 },
      }),
    );
    const form = new URLSearchParams(String(calls[0].init?.body));
    expect(form.get("line_items[0][price]")).toBe(PRICE);
    expect(form.toString()).not.toContain("price_cheap");
  });

  it("refuses to create a session for an origin outside the allowlist", async () => {
    const calls = installFetch({ stripe: () => json({ url: "https://checkout.stripe.com/x" }) });
    const { status } = await call(
      request("/api/checkout", { method: "POST", origin: "https://evil.example", body: {} }),
    );
    expect(status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it("accepts a restricted (rk_) Stripe key", async () => {
    installFetch({ stripe: () => json({ id: "cs_rk", url: "https://checkout.stripe.com/c/pay/cs_rk" }) });
    const { status, body } = await call(
      request("/api/checkout", { method: "POST", origin: ORIGIN, body: {} }),
      { ...ENV, STRIPE_SECRET_KEY: "rk_live_restrictedExample" },
    );
    expect(status).toBe(200);
    expect(body).toMatchObject({ ok: true, url: "https://checkout.stripe.com/c/pay/cs_rk" });
  });

  it("fails closed on a publishable key placed in the secret slot", async () => {
    const calls = installFetch({});
    const { status } = await call(
      request("/api/checkout", { method: "POST", origin: ORIGIN, body: {} }),
      { ...ENV, STRIPE_SECRET_KEY: "pk_live_publishableExample" },
    );
    expect(status).toBe(503);
    expect(calls).toHaveLength(0);
  });

  it("fails closed when Stripe is not configured", async () => {
    const calls = installFetch({});
    const { status, body } = await call(
      request("/api/checkout", { method: "POST", origin: ORIGIN, body: {} }),
      { ...ENV, STRIPE_SECRET_KEY: undefined },
    );
    expect(status).toBe(503);
    expect(body.ok).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("maps a rejected Stripe key to a 502 server error, not a visitor error", async () => {
    installFetch({ stripe: () => json({ error: { message: "Invalid API Key provided" } }, 401) });
    const { status, body } = await call(
      request("/api/checkout", { method: "POST", origin: ORIGIN, body: {} }),
    );
    expect(status).toBe(502);
    expect(body.error).toBe("Invalid API Key provided");
  });

  it("survives a non-JSON Stripe error body without throwing", async () => {
    installFetch({ stripe: () => new Response("<html>upstream down</html>", { status: 503 }) });
    const { status, body } = await call(
      request("/api/checkout", { method: "POST", origin: ORIGIN, body: {} }),
    );
    expect(status).toBe(502);
    expect(body.ok).toBe(false);
  });
});

describe("POST /api/entitlement/redeem", () => {
  it("issues a signed entitlement only for a paid session with the exact Pro price", async () => {
    installFetch({ stripe: () => json(paidSession()) });
    const { status, body } = await redeem("cs_test_a1");
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.source).toBe("stripe-checkout");
    expect(String(body.token)).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });

  it("retrieves the session from Stripe rather than trusting the browser", async () => {
    const calls = installFetch({ stripe: () => json(paidSession()) });
    await redeem("cs_test_a1");
    expect(calls[0].url).toContain("/checkout/sessions/cs_test_a1");
    expect(calls[0].url).toContain("expand[]=line_items");
  });

  it("rejects an unpaid session", async () => {
    installFetch({ stripe: () => json(paidSession({ payment_status: "unpaid" })) });
    const { status, body } = await redeem("cs_test_a1");
    expect(status).toBe(403);
    expect(body.token).toBeUndefined();
  });

  it("rejects a session that was paid for a different Stripe price", async () => {
    installFetch({
      stripe: () => json(paidSession({ line_items: { data: [{ price: { id: "price_other_product" } }] } })),
    });
    const { status, body } = await redeem("cs_test_a1");
    expect(status).toBe(403);
    expect(body.token).toBeUndefined();
  });

  it("rejects a session with no line items at all", async () => {
    installFetch({ stripe: () => json(paidSession({ line_items: { data: [] } })) });
    expect((await redeem("cs_test_a1")).status).toBe(403);
  });

  it("rejects a subscription-mode session even when paid", async () => {
    installFetch({ stripe: () => json(paidSession({ mode: "subscription" })) });
    expect((await redeem("cs_test_a1")).status).toBe(403);
  });

  it("rejects a session that carries a different product marker", async () => {
    installFetch({ stripe: () => json(paidSession({ metadata: { product_id: "pro_monthly" } })) });
    expect((await redeem("cs_test_a1")).status).toBe(403);
  });

  it("rejects a malformed session ID before calling Stripe", async () => {
    const calls = installFetch({ stripe: () => json(paidSession()) });
    const { status } = await redeem("not-a-session");
    expect(status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("returns a client error when Stripe does not know the session", async () => {
    installFetch({ stripe: () => json({ error: { message: "No such checkout.session" } }, 404) });
    const { status, body } = await redeem("cs_test_missing");
    expect(status).toBe(400);
    expect(body.error).toBe("No such checkout.session");
  });

  it("does not issue a token when the server has no usable signing secret", async () => {
    installFetch({ stripe: () => json(paidSession()) });
    const { status, body } = await redeem("cs_test_a1", { ...ENV, ENTITLEMENT_SECRET: "short" });
    expect(status).toBe(503);
    expect(body.token).toBeUndefined();
  });
});

describe("GET /api/entitlement/status", () => {
  it("accepts a token issued by a verified redeem", async () => {
    const token = await issueToken();
    const { status, body } = await call(request("/api/entitlement/status", { origin: ORIGIN, token }));
    expect(status).toBe(200);
    expect(body).toMatchObject({ ok: true, productId: "pro_lifetime" });
  });

  it("rejects a token whose payload was edited", async () => {
    const token = await issueToken();
    const [, sig] = token.split(".");
    const forgedPayload = btoa(JSON.stringify({ v: 1, productId: "pro_lifetime", issuedAt: "2020-01-01T00:00:00.000Z" }))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    const { status } = await call(
      request("/api/entitlement/status", { token: `${forgedPayload}.${sig}` }),
    );
    expect(status).toBe(401);
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await issueToken();
    const { status } = await call(
      request("/api/entitlement/status", { token }),
      { ...ENV, ENTITLEMENT_SECRET: "a-completely-different-secret-value-0123456789" },
    );
    expect(status).toBe(401);
  });

  it("rejects a random string and a missing token", async () => {
    expect((await call(request("/api/entitlement/status", { token: "abc.def" }))).status).toBe(401);
    expect((await call(request("/api/entitlement/status"))).status).toBe(401);
  });
});

describe("POST /api/entitlement/legacy", () => {
  it("exchanges a correctly signed legacy ACHM key for an entitlement", async () => {
    const key = await legacyKey(ENV.LEGACY_LICENCE_SECRET as string, "ABCDEFGHJK");
    const { status, body } = await call(
      request("/api/entitlement/legacy", { method: "POST", origin: ORIGIN, body: { key } }),
    );
    expect(status).toBe(200);
    expect(body.source).toBe("legacy-licence");
  });

  it("rejects a legacy key with a single altered character", async () => {
    const key = await legacyKey(ENV.LEGACY_LICENCE_SECRET as string, "ABCDEFGHJK");
    const tampered = key.slice(0, -1) + (key.endsWith("Z") ? "Y" : "Z");
    const { status } = await call(
      request("/api/entitlement/legacy", { method: "POST", origin: ORIGIN, body: { key: tampered } }),
    );
    expect(status).toBe(403);
  });
});

describe("GET / (premium audit fetch)", () => {
  const target = "https://example.com/pricing";
  const auditUrl = `/?url=${encodeURIComponent(target)}`;

  it("refuses to fetch a page without a valid entitlement", async () => {
    const calls = installFetch({ target: () => new Response("<html></html>", { headers: { "Content-Type": "text/html" } }) });
    const { status } = await call(request(auditUrl, { ip: "198.51.100.1" }));
    expect(status).toBe(401);
    expect(calls).toHaveLength(0);
  });

  it("fetches and returns the HTML for a paying visitor", async () => {
    const token = await issueToken();
    installFetch({
      target: () => new Response("<html><body><img src='/a.jpg'></body></html>", { headers: { "Content-Type": "text/html; charset=utf-8" } }),
    });
    const { status, body } = await call(request(auditUrl, { token, ip: "198.51.100.2" }));
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(String(body.html)).toContain("<img src='/a.jpg'>");
  });

  it("never fetches a private or metadata address, even for a paying visitor", async () => {
    const token = await issueToken();
    const calls = installFetch({ target: () => new Response("secret", { headers: { "Content-Type": "text/html" } }) });
    for (const private_ of ["http://169.254.169.254/latest/meta-data/", "http://10.0.0.5/admin", "http://localhost/x"]) {
      const { body } = await call(request(`/?url=${encodeURIComponent(private_)}`, { token, ip: "198.51.100.3" }));
      expect(body.ok).toBe(false);
    }
    expect(calls.filter((c) => !c.url.startsWith("https://api.stripe.com"))).toHaveLength(0);
  });

  it("enforces a per-IP rate limit of ten audits a minute", async () => {
    const token = await issueToken();
    installFetch({ target: () => new Response("<html></html>", { headers: { "Content-Type": "text/html" } }) });
    const ip = "198.51.100.44";
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      statuses.push((await call(request(auditUrl, { token, ip }))).status);
    }
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});

describe("isBlockedHost (SSRF guard)", () => {
  it.each([
    "http://127.0.0.1/",
    "http://169.254.169.254/",
    "http://10.1.2.3/",
    "http://172.20.0.1/",
    "http://192.168.1.1/",
    "http://100.64.0.1/",
    "http://[::1]/",
    "http://[fd00::1]/",
    "http://[::ffff:127.0.0.1]/",
    "http://[::ffff:7f00:1]/", // URL() rewrites the dotted form to hex
    "http://[::ffff:a9fe:a9fe]/", // hex form of 169.254.169.254
    "http://[::]/",
    "http://localhost:8080/",
    "http://printer.local/",
    "http://metadata.google.internal/",
    "http://2130706433/", // decimal form of 127.0.0.1
    "file:///etc/passwd",
    "http://intranet/",
  ])("blocks %s", (url) => {
    expect(isBlockedHost(url)).not.toBeNull();
  });

  it.each(["https://example.com/", "http://93.184.216.34/", "https://www.imagealchemy.app/pro"])(
    "allows public %s",
    (url) => {
      expect(isBlockedHost(url)).toBeNull();
    },
  );
});
