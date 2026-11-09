import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';

test('loads the static site and all local assets without runtime errors', async ({
  page,
  request,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (['error', 'warning'].includes(message.type())) errors.push(message.text());
  });
  await page.goto('/');
  await expect(page).toHaveTitle('xkcdpass | CLI passphrase generator for humans');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Simple passwords, hard to crack.',
  );
  await expect(page.locator('.hero-asset')).toBeVisible();
  expect(
    await page.locator('.hero-asset').evaluate((image) => image.complete && image.naturalWidth > 0),
  ).toBe(true);
  for (const path of [
    '/main.js',
    '/styles.css',
    '/assets/hero-stickman.svg',
    '/assets/icons/lucide-sprite.svg',
    '/assets/xkcdpass-og.png',
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).not.toContain('text/html');
  }
  expect(errors).toEqual([]);
});

test('mobile navigation updates state and closes after anchor navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Toggle navigation' });
  const nav = page.getByRole('navigation', { name: 'Primary' });
  await expect(nav).toBeHidden();
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(nav).toBeVisible();
  await nav.getByRole('link', { name: 'Install', exact: true }).click();
  await expect(page).toHaveURL(/#install$/u);
  await expect(nav).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('FAQ keyboard controls reveal and hide the associated answers', async ({ page }) => {
  await page.goto('/');
  const questions = page.locator('.faq-question');
  expect(await questions.count()).toBe(6);
  for (const question of await questions.all()) {
    const id = await question.getAttribute('aria-controls');
    const answer = page.locator(`#${id}`);
    await expect(answer).toBeHidden();
    await question.focus();
    await page.keyboard.press('Space');
    await expect(question).toHaveAttribute('aria-expanded', 'true');
    await expect(answer).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(answer).toBeHidden();
  }
});

test('copy reports success, restores its label, and reports clipboard rejection', async ({
  page,
  browserName,
  context,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Chromium exposes clipboard read/write permissions for an actual clipboard assertion.',
  );
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Copy install command' });
  await button.click();
  await expect(page.getByRole('button', { name: 'Copied', exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'brew install tvr-works/tap/xkcdpass',
  );
  await expect(button).toBeVisible();
  await page.evaluate(() => {
    navigator.clipboard.writeText = async () => {
      throw new DOMException('Permission denied', 'NotAllowedError');
    };
  });
  await button.click();
  await expect(page.getByRole('button', { name: 'Copy failed' })).toBeVisible();
});

test('preserves static content and mobile navigation without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4175/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
    await expect(page.locator('#install-command')).toHaveText(
      'brew install tvr-works/tap/xkcdpass',
    );
  } finally {
    await context.close();
  }
});

test('keyboard skip link, responsive layouts, and expanded content pass accessibility checks', async ({
  page,
  browserName,
}) => {
  await page.goto('/');
  if (browserName === 'webkit') await page.getByRole('link', { name: 'Skip to content' }).focus();
  else await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/u);
  await expect(page.locator('main')).toBeFocused();
  for (const width of [320, 390, 760, 761, 980, 981, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `page overflow at ${width}px`,
    ).toBe(true);
  }
  for (const question of await page.locator('.faq-question').all()) await question.click();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('expanded-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  await page.locator('#install-command').focus();
  await expect(page.locator('#install-command')).toBeFocused();
  if (browserName === 'chromium') {
    await page.keyboard.press('ArrowRight');
    await expect
      .poll(() => page.locator('#install-command').evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);
  }
  expect(mobile.violations).toEqual([]);
});

test('public indexing, metadata, XML, security headers, and true 404 survive packaging', async ({
  page,
  request,
}) => {
  const response = await page.goto('/');
  const headers = response.headers();
  const csp = headers['content-security-policy'];
  for (const directive of [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
  ])
    expect(csp).toContain(directive);
  expect(csp).not.toMatch(/unsafe-inline|unsafe-eval/u);
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');
  const html = await response.text();
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gu)) {
    if (!/\bsrc=/u.test(match[1]))
      expect(csp).toContain(`'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`);
  }
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    'https://xkcdpass.tvr.works/',
  );
  await expect(page.locator('meta[name=robots]')).toHaveAttribute(
    'content',
    'index,follow,max-image-preview:large',
  );
  const application = 'https://github.com/tvr-works/xkcdpass';
  expect(
    JSON.parse(await page.locator('script[type="application/ld+json"]').textContent()),
  ).toMatchObject({
    downloadUrl: application,
    codeRepository: application,
    sameAs: application,
  });
  await expect(page.locator(`a[href="${application}"]`)).toHaveCount(3);
  await expect(page.locator('.footer-license-link')).toHaveAttribute(
    'href',
    `${application}/blob/main/LICENSE`,
  );
  expect(html).not.toContain('github.com/tvanreenen/xkcdpass');
  expect(html).not.toContain('tvanreenen/tap');
  const robots = await request.get('/robots.txt');
  expect(robots.headers()['content-type']).toContain('text/plain');
  expect(await robots.text()).toBe(
    'User-agent: *\nAllow: /\n\nSitemap: https://xkcdpass.tvr.works/sitemap.xml\n',
  );
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.headers()['content-type']).toBe('application/xml');
  const xml = await sitemap.text();
  expect(
    await page.evaluate((source) => {
      const document = new DOMParser().parseFromString(source, 'application/xml');
      return {
        errors: document.querySelectorAll('parsererror').length,
        locations: [...document.querySelectorAll('loc')].map((node) => node.textContent),
      };
    }, xml),
  ).toEqual({ errors: 0, locations: ['https://xkcdpass.tvr.works/'] });
  const missing = await page.goto('/unknown/nested/page');
  expect(missing.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex,follow');
  const metadata = await request.get('/deployment.json');
  expect(metadata.headers()['cache-control']).toBe('no-store');
  const manifest = await metadata.json();
  expect(manifest.repository).toBe('tvr-works/xkcdpass-site');
  expect(manifest.sha).toMatch(/^[a-f0-9]{40}$/u);
  expect(manifest.branch).toBeTruthy();
  for (const [path, expected] of Object.entries(manifest.files)) {
    if (path === '_headers') continue;
    const artifact = await request.get(`/${path}`);
    expect(
      createHash('sha256')
        .update(await artifact.body())
        .digest('hex'),
    ).toBe(expected);
  }
  for (const path of [
    '/package.json',
    '/scripts/build-site.mjs',
    '/node_modules/parse5/package.json',
    '/.git/config',
  ])
    expect((await request.get(path)).status()).toBe(404);
});
