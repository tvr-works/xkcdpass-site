import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { root } from './site.mjs';

// Offline authoring tool; the normal site build publishes the checked-in PNG.
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto(pathToFileURL(resolve(root, 'assets/social-card.html')).href);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
  });
  assert.equal(await page.evaluate(() => document.fonts.check('700 88px Geist')), true);
  assert.deepEqual(errors, []);
  const path = resolve(root, 'public/assets/xkcdpass-social.png');
  await sharp(await page.screenshot())
    .png({ palette: true, colours: 256, effort: 10 })
    .toFile(path);
  console.log(`Rendered 1200 × 630 social card: ${path}`);
} finally {
  await browser.close();
}
