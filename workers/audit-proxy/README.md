# audit-proxy

The one serverless piece of the Website Image Audit.

## Why it exists

A browser cannot read a third party's HTML. Calling
`fetch("https://example.com")` from a page on `imagealchemy.app` is blocked from
reading the response body by the same-origin policy unless `example.com` opts in
with CORS headers — and essentially no site does.

So exactly one step of the pipeline needs a server: the fetch. This Worker does
that and nothing else. Parsing, measuring, scoring and rendering the report all
run in the visitor's browser.

## What it does NOT do

- **No HTML parsing.** Keeping it here would grow the attack surface and slow
  the product, for no benefit.
- **No logging of audited URLs.** A log of which pages people audit is a record
  of which competitor sites they are researching. This product's pitch is that
  it does not collect that, so it does not.
- **No cross-user caching.** A shared cache would let one visitor fingerprint
  what another had audited.
- **No user data.** It never sees an account, a licence key, or an uploaded file.

## Endpoints

| Method | Query / body | Returns |
| --- | --- | --- |
| `GET` | `?url=<encoded>` | `{ ok, html, finalUrl, ms }` |
| `POST` | `{ urls: string[] }` | `{ results: [{ url, ok, status, bytes, contentType, cacheControl, ms }] }` |
| `OPTIONS` | — | CORS preflight |

## Deploy

```bash
npx wrangler login
npx wrangler secret put AUDIT_TOKEN
npx wrangler deploy
```

Then set `VITE_AUDIT_PROXY_URL` and `VITE_AUDIT_TOKEN` in the app's `.env.local`.

**Before deploying, edit `ALLOWED_ORIGINS` in `wrangler.toml`.** The placeholder
is not a production value.

## Rate limiting

The in-memory limiter resets when the Worker instance recycles, which under load
is often. For a durable limit, create a KV namespace and bind it:

```bash
npx wrangler kv namespace create AUDIT_RATE_LIMIT
```

Uncomment the `[[kv_namespaces]]` block in `wrangler.toml` and paste the id.

## Security

The threat model for this endpoint is **SSRF**, not data theft — there is no
data. An open fetch proxy pointed at `169.254.169.254` will return cloud
instance credentials, so `isBlockedHost()` is the most important function in the
file. It rejects:

- non-`http(s)` schemes (`file:`, `gopher:`, `data:`)
- `localhost` and `.local`
- loopback `127.0.0.0/8`, `::1`
- private `10/8`, `172.16/12`, `192.168/16`
- carrier-grade NAT `100.64/10`
- link-local `169.254/16` — the cloud metadata endpoint
- IPv6 unique-local `fc00::/7`, link-local `fe80::/10`
- IPv4-mapped IPv6 (`::ffff:127.0.0.1`), a standard bypass attempt

It runs on the requested URL **and on every redirect hop**, because a public host
can 302 to an internal one. URL parsing uses `new URL()`, which normalises
decimal, octal and hex IPv4 forms — do not "simplify" this into a regex on the
raw input string.

Other limits: 4 MB response cap, 3 redirect hops, 12 s page timeout, 9 s per
image, 8 concurrent image measurements, 150 images per batch, 10 audits/minute
per IP.

## Local development

```bash
npx wrangler dev --var ALLOWED_ORIGINS:'*'
```

Then point `VITE_AUDIT_PROXY_URL` at the local URL it prints.
