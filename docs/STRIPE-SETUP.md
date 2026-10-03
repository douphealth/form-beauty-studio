# ImageAlchemy Pro — Stripe + entitlement setup

ImageAlchemy keeps the free compressor fully client-side. Pro adds one Cloudflare
Worker that is the security boundary for checkout, purchase verification and the
paid website-audit endpoint.

## Architecture

1. The browser calls `POST /api/checkout`.
2. The Worker creates a Stripe Checkout Session using `STRIPE_SECRET_KEY` and
   the exact server-configured `STRIPE_PRICE_ID`.
3. Stripe redirects a successful buyer to
   `/pro?session_id={CHECKOUT_SESSION_ID}`.
4. The browser sends that session ID to `POST /api/entitlement/redeem`.
5. The Worker retrieves the session directly from Stripe and requires:
   - `mode === "payment"`
   - `payment_status === "paid"`
   - `metadata.product_id === "pro_lifetime"`
   - a Checkout line item whose Price ID exactly matches `STRIPE_PRICE_ID`
6. Only then does the Worker issue an HMAC-signed lifetime entitlement token.
7. Every premium audit request sends that token as
   `Authorization: Bearer <token>`; the Worker verifies it before fetching a
   target page.

No Stripe secret or entitlement signing key is ever embedded in the Vite bundle.

## Stripe configuration

Create a one-time Stripe Product/Price for ImageAlchemy Pro and copy its
`price_...` ID. You do **not** need a Stripe Payment Link; Checkout Sessions are
created server-side so the amount/product being purchased is controlled by the
Worker.

The displayed browser price (`VITE_PRO_PRICE_DISPLAY`) is cosmetic. Access is granted only for the server-pinned `STRIPE_PRICE_ID`. Production is currently pinned to `price_1UMXQIByiix0wtyTdZimWNzL` ($19 USD one-time).

## Worker secrets

From `workers/audit-proxy`:

```bash
npx wrangler login

npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put ENTITLEMENT_SECRET
```

Use a long random entitlement secret:

```bash
openssl rand -base64 48
```

If customers already hold old `ACHM-...` licence keys, also set the previous
HMAC secret once:

```bash
npx wrangler secret put LEGACY_LICENCE_SECRET
```

That legacy secret stays server-side and exists only to exchange an old licence
for the new signed entitlement. New sales do not use licence keys.

## Worker origins and rate limiting

In `workers/audit-proxy/wrangler.toml`, keep `ALLOWED_ORIGINS` restricted to
the real production hosts. Do not use `*` in production.

For durable audit throttling:

```bash
npx wrangler kv namespace create AUDIT_RATE_LIMIT
```

Bind the returned namespace as `RATE_LIMIT` in `wrangler.toml`.

The Worker keeps the existing SSRF protections: public HTTP(S) only, private and
metadata ranges blocked, redirects re-checked, response-size caps, bounded
image-measurement concurrency, and rate limiting.

## Browser environment

Set only public values:

```bash
VITE_PRO_API_URL=https://imagealchemy-audit-proxy.<account>.workers.dev
VITE_AUDIT_PROXY_URL=https://imagealchemy-audit-proxy.<account>.workers.dev
VITE_PRO_PRICE_DISPLAY=$19
VITE_PRO_PRODUCT_ID=pro_lifetime
```

Never add `VITE_PRO_LICENCE_SECRET`, `STRIPE_SECRET_KEY`,
`ENTITLEMENT_SECRET`, or any other secret to a `VITE_*` variable.

## Deploy

```bash
cd workers/audit-proxy
npm install
npm run typecheck
npx wrangler deploy
```

Then build/deploy the frontend with the public environment values above.

## Verification

Repository CI runs:

```bash
npm ci
npm test
npm run lint
npm run build

cd workers/audit-proxy
npm install
npm run typecheck
```

`scripts/test-licence.mjs` is now a payment-security regression suite. It fails
if code reintroduces a browser signing secret, trusts `session_id` as payment
proof, removes the Stripe `payment_status` or Price-ID checks, or allows Pro
audits without a bearer entitlement.

### Live Stripe test-mode acceptance test

After configuring test-mode secrets and deploying the Worker:

1. Open `/pro` in a clean browser profile; Pro must be locked.
2. Click **Get Pro**; the browser must land on Stripe-hosted Checkout.
3. Complete payment with Stripe test card `4242 4242 4242 4242`, any future
   expiry, any CVC/postcode accepted by the test form.
4. Stripe must return to `/pro?session_id=cs_test_...`.
5. The app must verify the session automatically and enter the audit workspace.
6. Refresh; entitlement must remain active after server validation.
7. Run a public-site audit; both HTML fetch and image measurement must succeed.
8. Clear `imagealchemy:pro:v2` from localStorage; the audit must lock again.
9. Put a random token in that key; the Worker must return 401.
10. In Stripe test mode create/pay a Checkout Session for a **different** Price
    and try its session ID against the redeem endpoint; redemption must return
    403.
11. Try an unpaid/expired session ID; redemption must fail.
12. Cancel checkout; returning to `/pro?checkout=cancelled` must remain free.

## Important limitation

The code can be validated in CI without real Stripe credentials, but an actual
charge cannot be claimed as verified until the Worker is deployed with Stripe
**test-mode** secrets and the live acceptance test above passes. Production
secrets should only be enabled after that test succeeds.
