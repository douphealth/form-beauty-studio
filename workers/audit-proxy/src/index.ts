/**
 * ImageAlchemy audit proxy — Cloudflare Worker.
 *
 * WHY THIS EXISTS (the one honest constraint)
 * -------------------------------------------
 * The Website Image Audit needs to read a third party's HTML and measure its
 * images. A browser cannot do that: `fetch("https://example.com")` from a page
 * on imagealchemy.app is blocked from reading the response body by the
 * same-origin policy unless example.com explicitly opts in with CORS headers.
 * Essentially no site does.
 *
 * So exactly one piece of the pipeline needs a server: the fetch. This Worker
 * does the fetching and nothing else. It never sees a user account, a licence
 * key, an uploaded file, or any personal data — only the URL of a public page
 * that the visitor asked to audit, and the list of image URLs on that page.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * --------------------------------
 * - No logging of URLs beyond the counters needed for rate limiting.
 *   (If you enable Workers Analytics, that is aggregate, not per-URL.)
 * - No caching of page bodies across users. A cache here would let one visitor
 *   fingerprint what another visitor audited.
 * - No HTML parsing. Parsing, measuring, scoring and reporting all happen in
 *   the visitor's browser. Putting them here would mean shipping a bigger
 *   attack surface and a slower product for no benefit.
 *
 * DENIAL-OF-SERVICE POSTURE
 * -------------------------
 * An open fetch proxy is an attacker's toy: point it at an internal host and
 * you have an SSRF primitive, point it at yourself and you have a reflector.
 * The `isBlockedHost` function below is the single most important part of this
 * file. It rejects:
 *   - non-http(s) schemes            (file:, gopher:, data:)
 *   - loopback and link-local        (127., ::1, 169.254., localhost)
 *   - private ranges                 (10., 172.16–31., 192.168.)
 *   - carrier-grade NAT              (100.64–127.)
 *   - IPv6 unique-local and mapped   (fc00::/7, ::ffff:127.0.0.1)
 *   - the metadata endpoints         (169.254.169.254 — the classic SSRF target)
 * plus a hard cap on response size and a per-IP rate limit.
 *
 * DEPLOY
 * ------
 *   cd workers/audit-proxy
 *   npx wrangler deploy
 *
 * Then set the resulting URL as VITE_AUDIT_PROXY_URL in the app's .env.
 */

export interface Env {
  /**
   * Comma-separated origins allowed to call this Worker, e.g.
   *   "https://imagealchemy.app,https://www.imagealchemy.app"
   * Set to "*" only for local development.
   */
  ALLOWED_ORIGINS: string;
  /**
   * Simple shared secret required in the `x-audit-token` header. Not real
   * authentication — a browser app cannot keep a secret — but it stops the
   * Worker being used as a general-purpose open proxy by anyone who finds it,
   * which is the actual threat model for a public endpoint like this.
   */
  AUDIT_TOKEN?: string;
  /** Optional KV namespace for per-IP rate limiting. Absent = memory only. */
  RATE_LIMIT?: KVNamespace;
  /** Max response body we will read from a target page, in bytes. */
  MAX_HTML_BYTES?: string;
}

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

/** Hard limits. A target page is HTML; anything larger is not a page we want. */
const MAX_HTML_BYTES = 4 * 1024 * 1024; // 4 MB of HTML is already absurd
const MAX_IMAGES_PER_BATCH = 150;
const FETCH_TIMEOUT_MS = 12_000;
const MEASURE_TIMEOUT_MS = 9_000;
const MEASURE_CONCURRENCY = 8;
/** Token bucket: a real audit is 1 page + 1 batch, so 10/min is generous. */
const RATE_LIMIT_PER_MINUTE = 10;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Reject anything that is not a public internet host.
 *
 * This is the SSRF guard. It runs on the URL the caller supplied AND on every
 * redirect hop, because a public host can 302 to 169.254.169.254.
 */
export function isBlockedHost(rawUrl: string): string | null {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return "malformed URL";
  }

  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return `unsupported scheme ${u.protocol}`;
  }

  // URL() already normalises decimal/octal/hex IPv4 forms like 2130706433 into
  // 127.0.0.1, which is exactly why we parse rather than pattern-match the raw
  // string. Do not "simplify" this into a regex on the input.
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return "loopback host";
  }
  if (host === "metadata.google.internal" || host === "metadata") {
    return "cloud metadata endpoint";
  }

  // IPv4 checks
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 0) return "unspecified address";
    if (a === 127) return "loopback range";
    if (a === 10) return "private range 10/8";
    if (a === 172 && b >= 16 && b <= 31) return "private range 172.16/12";
    if (a === 192 && b === 168) return "private range 192.168/16";
    if (a === 169 && b === 254) return "link-local / cloud metadata";
    if (a === 100 && b >= 64 && b <= 127) return "carrier-grade NAT range";
    if (a >= 224) return "multicast or reserved range";
    return null;
  }

  // IPv6 checks
  if (host.includes(":")) {
    if (host === "::1") return "loopback address";
    if (host.startsWith("fc") || host.startsWith("fd")) return "unique-local range";
    if (host.startsWith("fe80")) return "link-local range";
    // ::ffff:127.0.0.1 — IPv4-mapped IPv6 is a standard bypass.
    const mapped = host.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
    if (mapped) return isBlockedHost(`http://${mapped[1]}/`);
    return null;
  }

  // A hostname with no dot cannot be a public site (Cloudflare resolves
  // single-label names against the Worker's own zone).
  if (!host.includes(".")) return "single-label hostname";

  return null;
}

/**
 * Fetch a URL, following redirects manually so each hop is validated.
 *
 * A 3-hop cap is enough for real sites (http→https, apex→www, trailing slash)
 * and short enough that a redirect chain cannot be used to burn CPU.
 */
async function safeFetch(url: string, init: RequestInit, maxHops = 3): Promise<Response> {
  let current = url;
  for (let hop = 0; hop <= maxHops; hop++) {
    const blocked = isBlockedHost(current);
    if (blocked) throw new Error(`blocked host: ${blocked}`);

    const res = await fetch(current, { ...init, redirect: "manual" });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return res;
      current = new URL(location, current).toString();
      continue;
    }
    return res;
  }
  throw new Error("too many redirects");
}

function corsHeaders(env: Env, origin: string | null): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  let allowOrigin = allowed[0] ?? "*";
  if (allowed.includes("*")) {
    // Reflecting the origin is safer than a bare "*" because it keeps the
    // response out of shared caches, but with no credentials in play "*" is
    // also acceptable. Prefer an explicit allowlist in production.
    allowOrigin = origin ?? "*";
  } else if (origin && allowed.includes(origin)) {
    allowOrigin = origin;
  } else {
    allowOrigin = allowed[0];
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-audit-token",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

/** Per-IP token bucket. KV when bound, in-memory otherwise. */
const memoryBucket = new Map<string, { count: number; resetAt: number }>();

async function checkRateLimit(env: Env, ip: string): Promise<boolean> {
  const key = `rl:${ip}:${Math.floor(Date.now() / 60_000)}`;

  if (env.RATE_LIMIT) {
    const current = Number((await env.RATE_LIMIT.get(key)) ?? "0");
    if (current >= RATE_LIMIT_PER_MINUTE) return false;
    await env.RATE_LIMIT.put(key, String(current + 1), { expirationTtl: 120 });
    return true;
  }

  const now = Date.now();
  const entry = memoryBucket.get(ip);
  if (!entry || entry.resetAt < now) {
    memoryBucket.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_PER_MINUTE) return false;
  entry.count += 1;
  return true;
}

/** Read a response body with a hard byte ceiling, so one huge page cannot OOM us. */
async function readCapped(res: Response, max: number): Promise<{ text: string; truncated: boolean }> {
  const reader = res.body?.getReader();
  if (!reader) return { text: "", truncated: false };

  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > max) {
      chunks.push(value.subarray(0, Math.max(0, value.byteLength - (total - max))));
      truncated = true;
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0));
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return { text: new TextDecoder("utf-8").decode(merged), truncated };
}

/** HEAD, with a ranged-GET fallback for servers that reject HEAD (some do). */
async function measureOne(url: string): Promise<Record<string, unknown>> {
  const started = Date.now();
  const base = {
    url,
    ok: false,
    status: 0,
    bytes: null as number | null,
    contentType: null as string | null,
    cacheControl: null as string | null,
    ms: 0,
    error: undefined as string | undefined,
  };

  try {
    let res = await safeFetch(url, {
      method: "HEAD",
      headers: { "User-Agent": BROWSER_UA, Accept: "image/*,*/*" },
      signal: AbortSignal.timeout(MEASURE_TIMEOUT_MS),
    });

    // 405/501 on HEAD is common enough to be worth handling: fall back to a
    // 1-byte ranged GET, which still returns Content-Range with the full size.
    if (res.status === 405 || res.status === 501) {
      res = await safeFetch(url, {
        method: "GET",
        headers: { "User-Agent": BROWSER_UA, Accept: "image/*,*/*", Range: "bytes=0-0" },
        signal: AbortSignal.timeout(MEASURE_TIMEOUT_MS),
      });
    }

    const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();

    let bytes: number | null = null;
    const len = res.headers.get("content-length");
    if (len && /^\d+$/.test(len)) bytes = Number(len);

    // A ranged response reports the TOTAL size in Content-Range, not the
    // 1 byte actually sent. Reading Content-Length here would report 1.
    const range = res.headers.get("content-range");
    if (!bytes && range) {
      const m = range.match(/\/(\d+)$/);
      if (m) bytes = Number(m[1]);
    }

    return {
      ...base,
      ok: res.ok || res.status === 206,
      status: res.status,
      bytes,
      contentType: contentType || null,
      cacheControl: res.headers.get("cache-control"),
      ms: Date.now() - started,
    };
  } catch (err) {
    return { ...base, ms: Date.now() - started, error: (err as Error).message };
  }
}

/** Run `fn` over `items` with a bounded number of concurrent promises. */
async function pooled<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    const cors = corsHeaders(env, origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    // ── Auth + rate limit ──────────────────────────────────────────────────
    if (env.AUDIT_TOKEN && request.headers.get("x-audit-token") !== env.AUDIT_TOKEN) {
      return json({ ok: false, error: "unauthorized" }, 401, cors);
    }

    const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
    if (!(await checkRateLimit(env, ip))) {
      return json(
        { ok: false, error: "Rate limit reached (10 audits per minute). Wait a minute and try again." },
        429,
        cors,
      );
    }

    // ── GET: fetch one page's HTML ─────────────────────────────────────────
    if (request.method === "GET") {
      const target = url.searchParams.get("url");
      if (!target) return json({ ok: false, error: "missing ?url=" }, 400, cors);

      const started = Date.now();
      try {
        const res = await safeFetch(target, {
          headers: {
            "User-Agent": BROWSER_UA,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });

        if (!res.ok) {
          return json(
            { ok: false, error: `The site returned HTTP ${res.status}. It may be blocking automated requests, or the URL may be wrong.` },
            200,
            cors,
          );
        }

        const ct = res.headers.get("content-type") ?? "";
        if (!ct.includes("html") && !ct.includes("xml") && !ct.includes("text/plain")) {
          return json(
            { ok: false, error: `That URL returned ${ct || "an unknown content type"}, not an HTML page. Audit a web page, not a file.` },
            200,
            cors,
          );
        }

        const max = Number(env.MAX_HTML_BYTES ?? MAX_HTML_BYTES);
        const { text, truncated } = await readCapped(res, max);

        return json(
          {
            ok: true,
            html: text,
            finalUrl: res.url || target,
            ms: Date.now() - started,
            truncated,
          },
          200,
          cors,
        );
      } catch (err) {
        const msg = (err as Error).message ?? "unknown error";
        return json(
          {
            ok: false,
            error: msg.startsWith("blocked host")
              ? "That address is not a public website, so it cannot be audited."
              : `Could not fetch that page: ${msg}`,
          },
          200,
          cors,
        );
      }
    }

    // ── POST: measure a batch of image URLs ────────────────────────────────
    if (request.method === "POST") {
      let payload: { urls?: unknown };
      try {
        payload = await request.json();
      } catch {
        return json({ ok: false, error: "invalid JSON body" }, 400, cors);
      }

      const urls = Array.isArray(payload.urls)
        ? payload.urls.filter((u): u is string => typeof u === "string").slice(0, MAX_IMAGES_PER_BATCH)
        : [];

      if (!urls.length) return json({ ok: false, error: "no urls supplied" }, 400, cors);

      const results = await pooled(urls, MEASURE_CONCURRENCY, measureOne);
      return json({ results }, 200, cors);
    }

    return json({ ok: false, error: "method not allowed" }, 405, cors);
  },
};
