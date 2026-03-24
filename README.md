# ScamShield

AI-powered scam and fraud detection for messages, emails, and texts. Built with **Next.js (App Router)** and TypeScript. Analysis is powered by OpenAI; auth and billing use Clerk and Stripe.

## Stack

- **Next.js 15** (App Router), **TypeScript**, **Tailwind CSS**
- **Clerk** – sign-in, sign-up, user metadata (Pro plan)
- **Stripe** – Pro subscription ($8.99/mo) and webhooks
- **OpenAI** – scam analysis API

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables**

   Copy `.env.example` to `.env.local` and fill in values:

   - `OPENAI_API_KEY` – required for `/api/analyze` ([OpenAI API keys](https://platform.openai.com/api-keys))
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` – [Clerk](https://dashboard.clerk.com) (required for auth and for `npm run build` to succeed)
   - `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` – [Stripe](https://dashboard.stripe.com) (for Pro checkout and webhook)
   - `NEXT_PUBLIC_APP_URL` – app URL (e.g. `http://localhost:3000`); used for Stripe redirects

   If you used the previous Vite app, rename `VITE_CLERK_PUBLISHABLE_KEY` to `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

3. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Use the Scanner, Pricing, and History from the nav.

## Scripts

- `npm run dev` – start Next.js dev server
- `npm run build` – production build (requires `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in env)
- `npm run start` – run production server
- `npm run lint` – run ESLint

## Routes

- `/` – landing
- `/pricing` – pricing (Free / Pro)
- `/dashboard` – scanner and analysis result
- `/history` – scan history (per-user, local storage)

## API (App Router)

- `POST /api/analyze` – body `{ "text": "..." }` → returns risk score, level, red flags, advice.
- `POST /api/create-checkout-session` – creates Stripe Checkout session (requires Clerk auth).
- `POST /api/webhooks/stripe` – Stripe webhook; updates Clerk `publicMetadata.plan` on subscription events.

Configure Stripe webhook URL to `https://your-domain/api/webhooks/stripe` and use the raw body for signature verification.

- `POST /api/webhooks/inbound-email` – receive a forwarded suspicious email, run analysis, store a time-limited report, and (optionally) email the sender a link. See **Inbound email → report** below.

### Inbound email → report

Users can forward or BCC a dedicated address; the app analyzes the **plain-text/HTML body** and replies with a private URL like `/report/<token>` (about **7 days** TTL).

1. **Webhook URL** (HTTPS):  
   `https://<your-domain>/api/webhooks/inbound-email?secret=<INBOUND_EMAIL_WEBHOOK_SECRET>`  
   Or omit the query param and send header `Authorization: Bearer <INBOUND_EMAIL_WEBHOOK_SECRET>` (or `x-scamshield-webhook-secret`).

2. **SendGrid Inbound Parse** (common): point your subdomain MX to SendGrid, set the webhook POST URL above. The handler reads `multipart/form-data` fields `text`, `html`, `from`, `subject`.

3. **Storage**: set **Upstash Redis** (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`). In **development**, if Redis is unset, reports are kept **in memory** only (lost on restart).

4. **Reply email**: [Resend](https://resend.com) — `RESEND_API_KEY` and `INBOUND_REPLY_FROM` (a verified sender). Without these, the report is still created but no email is sent.

5. **UI**: set `NEXT_PUBLIC_INBOUND_EMAIL` to the same address users forward to (shown on the Scanner dashboard).

**Manual test** (JSON body, same secret):

```bash
curl -s -X POST "http://localhost:3000/api/webhooks/inbound-email?secret=YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"from\":\"you@example.com\",\"subject\":\"Test\",\"text\":\"URGENT: Pay $500 in gift cards to avoid account closure. Click here now.\"}"
```

Other providers (e.g. Resend inbound) may use a different JSON shape; extend `lib/inbound/parseInboundRequest.ts` if needed.

## API rate limiting

User-facing JSON routes apply limits per **Clerk user id** (when signed in) or **client IP** (guests). `POST /api/webhooks/stripe` is **not** rate limited (Stripe retries).

| Route | Default (sliding window) |
|-------|---------------------------|
| `POST /api/analyze` | 12 / minute |
| `POST /api/extract-entities` | 30 / minute |
| `POST /api/validate-entity` | 90 / minute |
| `POST /api/create-checkout-session` | 8 / minute per user |
| `POST /api/webhooks/inbound-email` | 20 / minute per connecting IP |

With **Upstash Redis** configured, limits are shared across all server instances. Without Redis, the app uses a **fixed-window in-memory** fallback (fine for local dev; production serverless should use Redis for consistent limits).

429 responses include `Retry-After`, `X-RateLimit-*`, and JSON `{ error, retryAfterSeconds }`. Set `RATE_LIMIT_DISABLED=true` only for local testing.

## Security

Do not commit `.env` or `.env.local`. Rotate any keys that were ever committed.
