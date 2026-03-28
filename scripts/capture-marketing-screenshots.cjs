/**
 * Capture canonical marketing PNGs from /marketing/screenshots.
 *
 * Prerequisite: dev or production server running (default http://localhost:3000).
 * First run: npx playwright install chromium
 *
 *   npm run dev   # other terminal
 *   npm run marketing:screenshots
 */
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const BASE = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const OUT_DIR = path.join(process.cwd(), 'public', 'marketing', 'screenshots');

const SHOTS = [
  { id: 'shot-landing', file: '01-landing.png' },
  { id: 'shot-result', file: '02-result-highlights.png' },
  { id: 'shot-checklist', file: '03-verification-checklist.png' },
  { id: 'shot-email', file: '04-email-report-link.png' },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    deviceScaleFactor: 2,
  });
  await page.setViewportSize({ width: 1440, height: 960 });

  const url = `${BASE}/marketing/screenshots`;
  const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  if (!res || !res.ok()) {
    console.error(`Failed to load ${url} — is the app running? Status: ${res?.status()}`);
    process.exitCode = 1;
    await browser.close();
    return;
  }

  await page.waitForTimeout(500);

  for (const { id, file } of SHOTS) {
    const loc = page.locator(`#${id}`);
    const count = await loc.count();
    if (count === 0) {
      console.error(`Missing element #${id}`);
      process.exitCode = 1;
      continue;
    }
    await loc.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const outPath = path.join(OUT_DIR, file);
    await loc.first().screenshot({ path: outPath, type: 'png' });
    console.log('Wrote', outPath);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
