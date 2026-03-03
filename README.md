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

## Security

Do not commit `.env` or `.env.local`. Rotate any keys that were ever committed.
