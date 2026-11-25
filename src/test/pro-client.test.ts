/**
 * Browser-side Pro entitlement client (src/lib/pro.ts).
 *
 * The Worker is the only authority on payment; these tests pin what the browser
 * does with the Worker's answers: what it stores, what it trusts, and what it
 * clears. The Worker is replaced with a fake fetch so no network is involved.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const API = "https://audit.example.test";
const TOKEN = "a".repeat(40);
const STORAGE_KEY = "imagealchemy:pro:v2";

type Pro = typeof import("../lib/pro");

async function loadClient(): Promise<Pro> {
  vi.resetModules();
  vi.stubEnv("VITE_PRO_API_URL", API);
  vi.stubEnv("VITE_AUDIT_PROXY_URL", API);
  return import("../lib/pro");
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function stubFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const calls: { url: string; init?: RequestInit }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      return handler(url, init);
    }),
  );
  return calls;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  localStorage.clear();
});

describe("redeemCheckoutSession", () => {
  it("stores the signed entitlement the Worker issues for a verified payment", async () => {
    const pro = await loadClient();
    stubFetch(() => json({ ok: true, token: TOKEN, productId: "pro_lifetime", source: "stripe-checkout" }));

    const error = await pro.redeemCheckoutSession("cs_test_abc123");

    expect(error).toBeNull();
    const stored = pro.readEntitlement();
    expect(stored?.token).toBe(TOKEN);
    expect(stored?.source).toBe("stripe-checkout");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").token).toBe(TOKEN);
  });

  it("stores nothing and surfaces the Worker's reason when payment is not verified", async () => {
    const pro = await loadClient();
    stubFetch(() => json({ ok: false, error: "This checkout session does not contain a completed ImageAlchemy Pro payment." }, 403));

    const error = await pro.redeemCheckoutSession("cs_test_unpaid");

    expect(error).toBe("This checkout session does not contain a completed ImageAlchemy Pro payment.");
    expect(pro.readEntitlement()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("rejects a malformed session ID without calling the Worker", async () => {
    const pro = await loadClient();
    const calls = stubFetch(() => json({ ok: true }));

    expect(await pro.redeemCheckoutSession("not-a-session")).toBe("That checkout session ID is invalid.");
    expect(calls).toHaveLength(0);
  });

  it("reports a network failure as retryable, not as a payment failure", async () => {
    const pro = await loadClient();
    stubFetch(() => {
      throw new TypeError("Failed to fetch");
    });

    const error = await pro.redeemCheckoutSession("cs_test_abc123");

    expect(error).toMatch(/Could not verify the payment with Stripe/);
    expect(pro.readEntitlement()).toBeNull();
  });
});

describe("checkEntitlement", () => {
  it("unlocks Pro only when the Worker confirms the stored token", async () => {
    const pro = await loadClient();
    pro.writeEntitlement({ token: TOKEN, activatedAt: "2026-10-01T00:00:00.000Z", source: "stripe-checkout", productId: "pro_lifetime" });
    const calls = stubFetch(() => json({ ok: true, productId: "pro_lifetime" }));

    const status = await pro.checkEntitlement();

    expect(status.isPro).toBe(true);
    expect(calls[0].url).toBe(`${API}/api/entitlement/status`);
    expect(new Headers(calls[0].init?.headers).get("Authorization")).toBe(`Bearer ${TOKEN}`);
  });

  it("clears a stored token the Worker rejects", async () => {
    const pro = await loadClient();
    pro.writeEntitlement({ token: TOKEN, activatedAt: "2026-10-01T00:00:00.000Z", source: "stripe-checkout", productId: "pro_lifetime" });
    stubFetch(() => json({ ok: false, error: "invalid entitlement" }, 401));

    const status = await pro.checkEntitlement();

    expect(status.isPro).toBe(false);
    expect(status.entitlement).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("keeps the token but does not claim Pro when the Worker is unreachable", async () => {
    const pro = await loadClient();
    pro.writeEntitlement({ token: TOKEN, activatedAt: "2026-10-01T00:00:00.000Z", source: "stripe-checkout", productId: "pro_lifetime" });
    stubFetch(() => {
      throw new TypeError("Failed to fetch");
    });

    const status = await pro.checkEntitlement();

    expect(status.isPro).toBe(false);
    expect(status.entitlement?.token).toBe(TOKEN);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("never calls the Worker when nothing is stored", async () => {
    const pro = await loadClient();
    const calls = stubFetch(() => json({ ok: true }));

    const status = await pro.checkEntitlement();

    expect(status).toEqual({ isPro: false, entitlement: null, checking: false });
    expect(calls).toHaveLength(0);
  });
});

describe("readEntitlement", () => {
  it("ignores a hand-edited record that is too short to be a signed token", async () => {
    const pro = await loadClient();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: "true", activatedAt: "x", source: "stripe-checkout", productId: "pro_lifetime" }));

    expect(pro.readEntitlement()).toBeNull();
  });

  it("ignores a record with an unknown source", async () => {
    const pro = await loadClient();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: TOKEN, activatedAt: "x", source: "admin-override", productId: "pro_lifetime" }));

    expect(pro.readEntitlement()).toBeNull();
  });
});

describe("createCheckoutSession", () => {
  it("returns the Stripe-hosted URL the Worker created", async () => {
    const pro = await loadClient();
    stubFetch(() => json({ ok: true, sessionId: "cs_test_1", url: "https://checkout.stripe.com/c/pay/cs_test_1" }));

    expect(await pro.createCheckoutSession()).toEqual({ url: "https://checkout.stripe.com/c/pay/cs_test_1" });
  });

  it("refuses a non-HTTPS checkout URL rather than redirecting to it", async () => {
    const pro = await loadClient();
    stubFetch(() => json({ ok: true, url: "http://checkout.example.test/pay" }));

    expect(await pro.createCheckoutSession()).toEqual({ error: "Checkout returned an invalid payment URL." });
  });

  it("passes the Worker's error message through when checkout is unavailable", async () => {
    const pro = await loadClient();
    stubFetch(() => json({ ok: false, error: "Checkout is not configured." }, 503));

    expect(await pro.createCheckoutSession()).toEqual({ error: "Checkout is not configured." });
  });
});

describe("legacy licence keys", () => {
  it("rejects an obviously short key without a network call", async () => {
    const pro = await loadClient();
    const calls = stubFetch(() => json({ ok: true }));

    expect(await pro.exchangeLegacyLicence("ACHM")).toBe("That licence key looks too short.");
    expect(calls).toHaveLength(0);
  });

  it("normalises user input before display, so typed keys match the issued format", async () => {
    const pro = await loadClient();

    // Strip separators, then O→0, I/L→1, U→V — the same mapping the Worker uses.
    expect(pro.normaliseLicenceKey("achm-o0il-u1 2")).toBe("ACHM0011V12");
    expect(pro.formatLicenceKey("ACHM0ABCDEFGHJ")).toBe("ACHM0-ABCDE-FGHJ");
  });
});

describe("the browser never holds a Pro secret", () => {
  it("exposes only public configuration to the client", async () => {
    const pro = await loadClient();

    expect(pro.PRO_CONFIG.apiUrl).toBe(API);
    expect(Object.keys(pro.PRO_CONFIG)).not.toContain("secret");
    expect(pro.AUDIT_CONFIGURED).toBe(true);
  });
});

describe("restore purchase", () => {
  const SESSION = "cs_live_a1B2c3D4e5F6g7H8";

  it("keeps the paid session ID as the restore code after redemption", async () => {
    const pro = await loadClient();
    stubFetch(() => json({ ok: true, token: TOKEN, productId: "pro_lifetime", source: "stripe-checkout" }));

    expect(await pro.redeemCheckoutSession(SESSION)).toBeNull();
    expect(pro.readEntitlement()?.restoreCode).toBe(SESSION);
  });

  it("reads a bare restore code, a restore link and surrounding whitespace the same way", async () => {
    const pro = await loadClient();
    for (const input of [SESSION, `  ${SESSION}\n`, `https://imagealchemy.app/pro?session_id=${SESSION}`]) {
      expect(pro.parseRestoreInput(input)).toEqual({ kind: "session", sessionId: SESSION });
    }
  });

  it("treats anything without a session ID as a legacy licence key", async () => {
    const pro = await loadClient();
    expect(pro.parseRestoreInput(" ACHM-ABCDE-FGHJK-12 ")).toEqual({ kind: "legacy", key: "ACHM-ABCDE-FGHJK-12" });
  });

  it("builds a restore link that round-trips through the parser", async () => {
    const pro = await loadClient();
    const link = pro.restoreLink(SESSION);
    expect(link).toContain(`/pro?session_id=${SESSION}`);
    expect(pro.parseRestoreInput(link)).toEqual({ kind: "session", sessionId: SESSION });
  });
});

describe("displayed price", () => {
  it("falls back to $19 when the env value is empty, as Vite produces for an unescaped $19", async () => {
    vi.resetModules();
    vi.stubEnv("VITE_PRO_PRICE_DISPLAY", "");
    const pro = await import("../lib/pro");
    expect(pro.PRO_PRICE_DISPLAY).toBe("$19");
  });
});
