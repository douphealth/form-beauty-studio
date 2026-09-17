# ImageAlchemy Pro — setup

Everything you need to switch the paid **Website Image Audit** on. Roughly 15
minutes, no backend to maintain.

There are three pieces:

| Piece | What it is | Where it lives |
| --- | --- | --- |
| **Stripe Payment Link** | Takes the one-time payment | Stripe's servers |
| **Audit proxy Worker** | Fetches the page being audited | Cloudflare Workers (free tier) |
| **Licence secret** | Signs and verifies keys offline | Your machine + build env |

---

## 1. Stripe — take the payment

1. In the Stripe Dashboard, go to **Products → Add product**.
   - Name: `ImageAlchemy Pro`
   - Price: your price (the default UI says `$19`), **one-time**, not recurring.
2. Save, then go to **Payment links → New**.
   - Product: the one you just made.
   - **After payment → Show a confirmation page**: leave this OFF. The app
     supplies its own `success_url`, and Stripe would override it otherwise.
   - Under **Advanced → Metadata**, add `product_id` = `pro_lifetime`. This is
     how a sale is later traced to the tier it unlocked.
3. Copy the Payment Link URL (`https://buy.stripe.com/…`).

That URL is **not** a secret. It ships in the client bundle, which is fine — a
Payment Link can only take money, never refund it or read your account.

### Fulfilment — how the buyer gets their key

Stripe's built-in receipt email is where the key goes. Two options:

**Option A — manual (works today, ~30 seconds per sale).**
1. Stripe emails you the payment notification.
2. Run `npm run licence:new -- --secret "$VITE_PRO_LICENCE_SECRET"`.
3. Email the printed key to the customer, or paste it into Stripe's receipt.
   Stripe lets you customise the receipt under **Settings → Emails**.

**Option B — automatic.**
Add a Stripe **webhook** on `checkout.session.completed` pointing at a small
endpoint that generates a key and emails it. This is genuinely optional: at low
volume, Option A costs less time than maintaining the endpoint. The Worker in
`workers/audit-proxy` is a reasonable place to add it, but keeping issuance
manual means the licence secret never has to exist on a server.

---

## 2. Licence secret — sign the keys

Keys are verified **offline** in the browser, using HMAC-SHA256. Generate one
secret and keep it forever:

```bash
openssl rand -base64 32
```

Put it in `.env.local` as `VITE_PRO_LICENCE_SECRET`.

> **This value ships inside the public bundle.** It is not a secret in the
> cryptographic sense, and `src/lib/pro.ts` documents this honestly rather than
> pretending otherwise. What it buys you: a customer cannot *guess* a valid key
> (2^20 checksums), and a leaked key cannot be *modified*. What it does not buy:
> protection from someone who reads your JavaScript and patches out the check.
> That is the real ceiling for a 100 % client-side app, and it is the same
> ceiling every offline-capable paid app lives with.

### Issuing keys

```bash
# Set it once in your shell, or pass --secret each time
export VITE_PRO_LICENCE_SECRET="$(openssl rand -base64 32)"

npm run licence:new                                  # one key
npm run licence:new -- --count 10                    # a batch
npm run licence:new -- --tier team --count 5         # a different tier
```

Output looks like `ACHM-4K9P2-M7XR3-QB1D`. Keys are grouped in fives for
transcription and use Crockford Base32, which omits `I`, `L`, `O` and `U` — so a
key read off a receipt cannot be mistyped into a *different valid* key.

> Rotating the secret invalidates every key already issued. If you must rotate,
> re-issue for existing customers.

---

## 3. Audit proxy Worker — the one server

### Why it is needed

A browser cannot read another site's HTML: `fetch("https://example.com")` from
your page is blocked from reading the response by the same-origin policy. So the
audit needs exactly one server-side fetch. Everything else — parsing, measuring,
scoring, the report — runs in the visitor's browser.

### Deploy

```bash
cd workers/audit-proxy
npx wrangler login
npx wrangler secret put AUDIT_TOKEN     # paste a long random string
npx wrangler deploy
```

Wrangler prints the URL, e.g.
`https://imagealchemy-audit-proxy.you.workers.dev`. Put it in `.env.local`:

```bash
VITE_AUDIT_PROXY_URL=https://imagealchemy-audit-proxy.you.workers.dev
VITE_AUDIT_TOKEN=<the same string you gave wrangler>
```

### Before you deploy — two edits

1. **`wrangler.toml` → `ALLOWED_ORIGINS`.** Replace the placeholder with your
   real hosts. Leaving `*` means any website can call your Worker.
2. **Rate limiting (recommended).** The in-memory limiter resets whenever the
   Worker instance recycles, so it is close to useless under real load. Make it
   durable:
   ```bash
   npx wrangler kv namespace create AUDIT_RATE_LIMIT
   ```
   Paste the returned id into the commented `[[kv_namespaces]]` block in
   `wrangler.toml` and uncomment it.

### The security posture, stated plainly

An open fetch endpoint is an SSRF primitive — point it at `169.254.169.254` and
it will happily fetch cloud credentials. `isBlockedHost()` in
`workers/audit-proxy/src/index.ts` rejects loopback, private ranges,
carrier-grade NAT, IPv6 unique-local, IPv4-mapped IPv6, and the metadata
endpoints, and it re-checks on **every redirect hop** (a public host can 302 to
an internal one). Response bodies are capped at 4 MB and the fetcher follows at
most 3 redirects.

The Worker logs nothing about which URLs are audited. If you enable Workers
Analytics, note that the code is written so no per-URL logging occurs — that is
deliberate, because a log of audited URLs would be a record of which competitor
sites your visitors are checking, and this product's entire pitch is that it
does not collect that kind of thing.

---

## 4. Build and verify

```bash
npm install
npm run test:audit      # 101 assertions — the parsing and scoring engine
npm run test:licence    #  35 assertions — the key round-trip
npm run build           # runs both, plus typecheck, prerender and crawl checks
```

`npm run build` is deliberately strict. It fails if:

- the audit parser or the licence round-trip regresses
- TypeScript does not compile
- a route has no directory index, or two pages share a `<title>`
- a prerendered page has no `<h1>`
- `robots.txt` would block a real route
- the comparison demo no longer demonstrates a real byte saving

A red build means a real defect, not a warning to ignore.

---

## 5. What the customer actually gets

For the price, once:

- **Full-site image audit** of any public URL: every image measured, format and
  cache headers inspected, above-the-fold images identified.
- **A score out of 100**, broken into image weight, format, delivery and markup.
- **A prioritised fix list** with the bytes each fix saves and the exact files
  it applies to — legacy formats, oversized files, missing lazy loading, absent
  `width`/`height` (layout shift), weak cache headers, missing alt text.
- **Core Web Vitals impact**: estimated transfer time on a 4G connection.
- **Markdown and CSV export** for pasting into a ticket, a client email or a CMS.

The free compressor is untouched: batch compression, conversion and resizing for
up to 200 images, still free, still entirely on-device. Pro adds a *different
question* — not "make this file smaller" but "which files are costing me, and by
how much".

---

## 6. Honest limitations

Worth knowing before you sell it, and worth saying to customers if they ask:

- **JavaScript-rendered images are invisible.** The proxy fetches HTML; it does
  not run a browser. A site that injects `<img>` after hydration will show few
  or no images. The audit says so explicitly when it finds none, rather than
  reporting a misleadingly perfect score.
- **Sizes come from `Content-Length`.** If a server omits it — some gzip or
  chunked responses do — that image is reported as unmeasured rather than
  guessed at.
- **Above-the-fold is a heuristic.** Without a layout engine, the audit treats
  early non-lazy images as LCP candidates. It is right far more often than not,
  and when it is wrong the estimate is merely conservative.
- **The saving percentages are conservative mid-points**, not best cases.
  `SAVING_JPEG_TO_WEBP` and friends in `src/lib/audit.ts` are documented with
  their reasoning; the audit is designed to under-promise.
- **Client-side gating is a fair-dealing gate, not DRM.** See §2.
