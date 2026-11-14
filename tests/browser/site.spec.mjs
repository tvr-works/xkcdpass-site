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
  await expect(page).toHaveTitle('xkcdpass | Command-line passphrase generator');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Easy to use.Hard to guess.');
  await expect(page.locator('.hero-subtitle')).toHaveText(
    'Cryptographically strong passphrases, generated locally in your terminal. Familiar words you can read, retype, and say aloud.',
  );
  await expect(page.locator('.terminal-command')).toHaveText('$ xkcdpass');
  await expect(page.locator('.terminal-output')).toHaveText('turtlerocketcactusdonut');
  await expect(page.locator('.hero-illustration')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Why simple words can make strong passwords.' }),
  ).toBeVisible();
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

test('install navigation reaches its visible target on desktop and mobile', async ({ page }) => {
  await page.goto('/');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('link', { name: 'Install xkcdpass', exact: true }).click();
  await expect(page).toHaveURL(/#install$/u);
  await expect(
    page.getByRole('heading', { name: 'Install xkcdpass.', exact: true }),
  ).toBeInViewport();
  await expect(page.locator('#install .platform-links a')).toHaveCount(3);
  await expect(page.locator('#usage .platform-links')).toHaveCount(0);
  await expect(page.locator('[data-slot="separator"]')).toHaveCount(0);
  expect(
    await page.evaluate(() => {
      const usage = document.querySelector('#usage').getBoundingClientRect();
      const install = document.querySelector('#install').getBoundingClientRect();
      const footer = document.querySelector('.site-footer').getBoundingClientRect();
      return install.top >= usage.bottom && footer.top >= install.bottom;
    }),
  ).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('link', { name: 'Install', exact: true }).click();
  await expect(page).toHaveURL(/#install$/u);
  await expect(page.locator('#install-command')).toBeInViewport();
});

test('install anchors scroll smoothly unless reduced motion is requested', async ({ page }) => {
  for (const reducedMotion of ['no-preference', 'reduce']) {
    await page.emulateMedia({ reducedMotion });
    await page.goto('/');
    const destination = await page.evaluate(() => {
      const target = document.querySelector('#install');
      const top = target.getBoundingClientRect().top + scrollY;
      window.installScrollSamples = [];
      addEventListener('scroll', () => window.installScrollSamples.push(scrollY), {
        passive: true,
      });
      return Math.min(
        top - parseFloat(getComputedStyle(target).scrollMarginTop),
        document.documentElement.scrollHeight - innerHeight,
      );
    });
    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior),
    ).toBe(reducedMotion === 'reduce' ? 'auto' : 'smooth');
    await page.getByRole('link', { name: 'Install', exact: true }).click();
    await expect(page).toHaveURL(/#install$/u);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeCloseTo(destination, 0);
    await expect(page.locator('#install-command')).toBeInViewport();
    const intermediateScroll = await page.evaluate(
      (end) => window.installScrollSamples.some((position) => position > 0 && position < end - 1),
      destination,
    );
    expect(intermediateScroll, `intermediate scroll positions with ${reducedMotion}`).toBe(
      reducedMotion === 'no-preference',
    );
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
  await expect(page.locator('.copy-status')).toHaveText(
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
  for (const width of [320, 640, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await button.click();
    await expect(page.locator('.copy-status')).toContainText('Could not copy.');
    const feedback = await page.evaluate(() => {
      const status = document.querySelector('.copy-status').getBoundingClientRect();
      const install = document.querySelector('.installation').getBoundingClientRect();
      const footer = document.querySelector('.site-footer');
      return {
        contained: status.bottom <= install.bottom,
        sectionGap: footer.getBoundingClientRect().top - install.bottom,
        expectedGap: parseFloat(getComputedStyle(footer).marginTop),
      };
    });
    expect(feedback.contained, `copy feedback stays in flow at ${width}px`).toBe(true);
    expect(feedback.sectionGap, `footer spacing after feedback at ${width}px`).toBeCloseTo(
      feedback.expectedGap,
      0,
    );
  }
});

test('only the latest clipboard request owns feedback and its reset timer', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Copy install command', exact: true });
  await expect(button).toBeVisible();
  await page.clock.pauseAt('2026-01-01T00:01:00Z');
  await page.evaluate(() => {
    window.pendingCopies = [];
    navigator.clipboard.writeText = () =>
      new Promise((resolve, reject) => {
        window.pendingCopies.push({ resolve, reject });
      });
  });

  // Keep both actual click handlers pending, then complete them a second apart.
  await button.click({ force: true });
  await button.click({ force: true });
  expect(await page.evaluate(() => window.pendingCopies.length)).toBe(2);
  await page.evaluate(() => window.pendingCopies[0].resolve());
  await page.clock.fastForward(1000);
  await page.evaluate(() => window.pendingCopies[1].resolve());
  await expect(page.locator('.copy-status')).toHaveText('Install command copied.');
  await page.clock.fastForward(1500);
  await expect(page.locator('.copy-status')).toHaveText('Install command copied.');
  await page.clock.fastForward(1000);
  await expect(page.locator('.copy-status')).toBeEmpty();

  // A late success from an older request must not overwrite the latest failure.
  await button.click({ force: true });
  await button.click({ force: true });
  await page.evaluate(() => window.pendingCopies[3].reject(new Error('Clipboard denied')));
  await expect(page.locator('.copy-status')).toContainText('Could not copy.');
  await page.evaluate(() => window.pendingCopies[2].resolve());
  await page.clock.fastForward(1000);
  await expect(page.locator('.copy-status')).toContainText('Could not copy.');
  await page.clock.fastForward(1500);
  await expect(page.locator('.copy-status')).toBeEmpty();
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
    await expect(page.locator('.entropy-result')).toHaveText('3.7 quadrillion possible sequences');
    await expect(page.locator('.usage-example')).toContainText('xkcdpass --words 6 --separator -');
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
  await page.getByRole('button', { name: '6 words', exact: true }).click();
  await page.getByRole('button', { name: 'How the math works' }).click();
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
  const socialImage = await page.locator('meta[property="og:image"]').getAttribute('content');
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', socialImage);
  const socialResponse = await request.get(new URL(socialImage).pathname);
  expect(socialResponse.status()).toBe(200);
  expect(socialResponse.headers()['content-type']).toBe('image/png');
  const faviconResponse = await request.get('/favicon.svg');
  expect(faviconResponse.status()).toBe(200);
  expect(faviconResponse.headers()['content-type']).toBe('image/svg+xml');
  const application = 'https://github.com/tvr-works/xkcdpass';
  expect(
    JSON.parse(await page.locator('script[type="application/ld+json"]').textContent()),
  ).toMatchObject({
    downloadUrl: `${application}/releases`,
    installUrl: `${application}#installation`,
    sameAs: application,
  });
  await expect(page.locator(`a[href="${application}"]`)).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'xkcd #936', exact: true })).toHaveAttribute(
    'href',
    'https://xkcd.com/936/',
  );
  await expect(page.locator('.site-footer a')).toHaveCount(2);
  await expect(page.locator('.site-footer nav')).toHaveCount(0);
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

test('word count controls update the diagram, result, exact math, and screen-reader summary', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  const selected = page.getByRole('button', { name: '4 words', exact: true });
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  await selected.focus();
  await page.keyboard.press('ArrowLeft');
  const three = page.getByRole('button', { name: '3 words', exact: true });
  await expect(three).toBeFocused();
  await page.keyboard.press('Space');
  await expect(three).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.word-choice')).toHaveCount(3);
  await expect(page.locator('.entropy-result')).toHaveText('470.2 billion possible sequences');
  await expect(page.locator('.entropy-bits')).toHaveText('38.8 bits of entropy');
  await expect(page.locator('#strength output')).toContainText('3 independent words');
  await three.click();
  await expect(three).toHaveAttribute('aria-pressed', 'true');
  const disclosure = page.getByRole('button', { name: 'How the math works' });
  await disclosure.focus();
  await page.keyboard.press('Enter');
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.math-explanation')).toContainText('470,184,984,576');
  await page.getByRole('button', { name: '6 words', exact: true }).click();
  await expect(page.locator('.word-choice')).toHaveCount(6);
  await expect(page.locator('.entropy-result')).toHaveText('221.1 sextillion possible sequences');
  await expect(page.locator('.entropy-bits')).toHaveText('77.5 bits of entropy');
  await expect(page.locator('.exact-count')).toHaveText('221,073,919,720,733,357,899,776');
  await disclosure.focus();
  await page.keyboard.press('Space');
  await expect(disclosure).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.math-explanation')).toBeHidden();
  expect(errors).toEqual([]);
});

test('page keeps shared type and spacing roles across responsive layouts', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'How the math works' }).click();
  for (const width of [320, 390, 640, 768, 1024, 1374]) {
    await page.setViewportSize({ width, height: 900 });
    const typography = await page.evaluate(() => {
      const sizes = (selector) => [
        ...new Set(
          [...document.querySelectorAll(selector)].map(
            (element) => getComputedStyle(element).fontSize,
          ),
        ),
      ];
      return {
        headings: sizes('.section-title'),
        reading: sizes(
          '.eyebrow, .hero-subtitle, .install-command code, .section-intro, .entropy-assumptions, .word-count-label, .ui-toggle, .word-choice, .entropy-result-label, .entropy-bits, .ui-collapsible-trigger, .math-explanation p, .flag-reference code, .flag-reference dd, .usage-example code, .usage-example samp, .usage-note, .platform-links a, .site-footer a',
        ),
        metadata: sizes('.terminal-titlebar h2, .brand-credit'),
        actions: sizes('.site-nav, .hero-actions a, .site-nav .ui-button'),
        result: sizes('.entropy-number'),
      };
    });
    expect(typography, `type scale at ${width}px`).toEqual({
      headings: ['36px'],
      reading: ['18px'],
      metadata: ['14px'],
      actions: ['16px'],
      result: ['48px'],
    });
    const framing = await page.evaluate(() => {
      const title = document.querySelector('.terminal-titlebar h2').getBoundingClientRect();
      const controls = document.querySelector('.terminal-controls').getBoundingClientRect();
      return {
        titleClear: title.left >= controls.right,
        panelPadding: [
          ...new Set(
            ['.terminal-body', '.entropy-panel', '.usage-example'].map(
              (selector) => getComputedStyle(document.querySelector(selector)).padding,
            ),
          ),
        ],
      };
    });
    expect(framing.titleClear, `terminal title clears controls at ${width}px`).toBe(true);
    expect(framing.panelPadding, `shared panel padding at ${width}px`).toEqual([
      width < 640 ? '16px' : '32px',
    ]);
    const layout = await page.evaluate(() => {
      const bounds = (selector) => document.querySelector(selector).getBoundingClientRect();
      const panel = bounds('.entropy-panel');
      const copy = bounds('#strength .section-copy');
      return {
        beside: panel.left >= copy.right,
        below: panel.top >= copy.bottom,
        grouped: [
          '.word-count-controls',
          '.entropy-calculation',
          '.entropy-result',
          '.entropy-summary',
        ].every((selector) => {
          const rect = bounds(selector);
          return (
            rect.left >= panel.left &&
            rect.right <= panel.right &&
            rect.top >= panel.top &&
            rect.bottom <= panel.bottom
          );
        }),
      };
    });
    expect(width >= 1024 ? layout.beside : layout.below, `section placement at ${width}px`).toBe(
      true,
    );
    expect(layout.grouped, `explorer grouping at ${width}px`).toBe(true);
    for (const count of [3, 4, 5, 6]) {
      await page.getByRole('button', { name: `${count} words`, exact: true }).click();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${count}-word expanded lesson overflow at ${width}px`,
      ).toBe(true);
    }
  }
});
