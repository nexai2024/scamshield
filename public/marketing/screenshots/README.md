# Canonical marketing screenshots

These PNGs are the **single set** to reuse on the website, ads, decks, and press kits.

| File | Contents |
|------|----------|
| `01-landing.png` | Landing hero (1200×630 logical frame) |
| `02-result-highlights.png` | Risk score + summary + phrase highlights |
| `03-verification-checklist.png` | Verify-it-yourself checklist |
| `04-email-report-link.png` | Inbox-style “report ready” with link |

## Generate

1. Install browser once: `npx playwright install chromium`
2. Start the app: `npm run dev`
3. In another terminal: `npm run marketing:screenshots`

Optional: `BASE_URL=https://your-staging.example npm run marketing:screenshots`

Source UI lives at **`/marketing/screenshots`** (not indexed). Demo copy is frozen in `lib/marketing/canonicalScreenshotData.ts` — update there if marketing refreshes all assets together.

## Git

You may commit the PNGs here so design and comms always pull from the same files. Regenerate after intentional UI or copy changes to the studio.
