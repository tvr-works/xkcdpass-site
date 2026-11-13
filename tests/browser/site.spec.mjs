import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';

test('renders the approved hero and all compiled assets without runtime errors', async ({
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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hard to guess.Easy to use.');
  await expect(page.locator('.hero-subtitle')).toHaveText(
    'Cryptographically strong passphrases, generated locally in your terminal. Familiar words you can read, retype, and say aloud.',
  );
  await expect(page.locator('.terminal-command')).toHaveText('$ xkcdpass');
  await expect(page.locator('.terminal-output')).toHaveText('turtlerocketcactusdonut');
  await expect(page.locator('.hero-illustration')).toBeVisible();
  expect(
    await page
      .locator('.hero-illustration')
      .evaluate((image) => image.complete && image.naturalWidth > 0),
  ).toBe(true);
  const manifest = await (await request.get('/deployment.json')).json();
  for (const path of Object.keys(manifest.files).filter((file) => file.startsWith('assets/'))) {
    const response = await request.get(`/${path}`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).not.toContain('text/html');
  }
  expect(errors).toEqual([]);
});

test('example and install navigation reach their visible targets on desktop and mobile', async ({
  page,
}) => {
  await page.goto('/');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('link', { name: 'Examples', exact: true }).click();
  await expect(page).toHaveURL(/#example$/u);
  await expect(
    page.getByRole('region', { name: 'Example terminal command and output' }),
  ).toBeInViewport();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('link', { name: 'Install', exact: true }).click();
  await expect(page).toHaveURL(/#install$/u);
  await expect(page.locator('#install-command')).toBeInViewport();
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
  await expect(page.getByRole('status')).toHaveText(
    'Could not copy. Select the command and copy it manually.',
  );
  await expect(button).toBeEnabled();
  expect(
    await page
      .locator('.copy-status')
      .evaluate(
        (status) =>
          status.getBoundingClientRect().bottom <=
          document.querySelector('.site-footer p').getBoundingClientRect().top,
      ),
  ).toBe(true);
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

test('keyboard skip link, responsive layouts, and the hero pass accessibility checks', async ({
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
  let stackedArtHeight;
  for (const width of [320, 360, 390, 639, 640, 767, 768, 1023, 1024, 1279, 1280, 1422, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `page overflow at ${width}px`,
    ).toBe(true);
    expect(
      await page
        .locator('.terminal-output')
        .evaluate(
          (element) =>
            element.getBoundingClientRect().height <=
            parseFloat(getComputedStyle(element).lineHeight) + 1,
        ),
      `passphrase wraps at ${width}px`,
    ).toBe(true);
    const layout = await page.locator('.hero-illustration').evaluate((image) => {
      const art = image.getBoundingClientRect();
      const terminal = document.querySelector('.terminal').getBoundingClientRect();
      const copy = document.querySelector('.hero-copy').getBoundingClientRect();
      return {
        beside: art.left >= terminal.right && art.left >= copy.right,
        below: art.top >= terminal.bottom,
        height: art.height,
      };
    });
    expect(
      width >= 768 ? layout.beside : layout.below,
      `illustration placement at ${width}px`,
    ).toBe(true);
    if (width === 767) stackedArtHeight = layout.height;
    if (width === 768) expect(layout.height).toBeCloseTo(stackedArtHeight, 0);
  }
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('hero-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  await page.setViewportSize({ width: 320, height: 844 });
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
  await expect(page.locator(`a[href="${application}"]`)).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'open source', exact: true })).toHaveAttribute(
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
