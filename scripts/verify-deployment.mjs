import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const origin = 'https://xkcdpass.tvr.works';
const repository = 'tvr-works/xkcdpass-site';
const application = 'https://github.com/tvr-works/xkcdpass';
async function get(base, path) {
  return fetch(`${base}${path}`, {
    redirect: 'error',
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
}
export async function verifyDeployment({
  sha,
  environment,
  deploymentUrl,
  previewAlias,
  expectedBranch,
}) {
  expectedBranch = environment === 'production' ? 'main' : expectedBranch;
  assert.ok(expectedBranch?.trim(), 'EXPECTED_BRANCH is required for preview verification.');
  assert.match(sha ?? '', /^[a-f0-9]{40}$/u, 'EXPECTED_SHA must identify the published commit.');
  assert.ok(
    ['production', 'preview'].includes(environment),
    'DEPLOYMENT_ENV must be production or preview.',
  );
  const deployment = new URL(deploymentUrl ?? '');
  assert.equal(deployment.protocol, 'https:');
  assert.match(
    deployment.hostname,
    /^[a-f0-9]{8}\.xkcdpass-site\.pages\.dev$/u,
    'Use the immutable deployment URL.',
  );
  assert.equal(deployment.pathname, '/');
  assert.ok(
    !deployment.search &&
      !deployment.hash &&
      !deployment.username &&
      !deployment.password &&
      !deployment.port,
  );
  const origins = new Set([deployment.origin]);
  if (environment === 'production') origins.add(origin);
  if (previewAlias) {
    assert.equal(environment, 'preview');
    const alias = new URL(previewAlias);
    assert.match(alias.hostname, /^[a-z0-9-]+\.xkcdpass-site\.pages\.dev$/u);
    assert.equal(alias.protocol, 'https:');
    assert.ok(
      !alias.username &&
        !alias.password &&
        !alias.port &&
        alias.pathname === '/' &&
        !alias.search &&
        !alias.hash,
    );
    origins.add(alias.origin);
  }

  async function verify(base) {
    const response = await get(base, '/');
    assert.equal(response.status, 200, `${base}: homepage status`);
    assert.match(response.headers.get('content-type') ?? '', /text\/html/u);
    const csp = response.headers.get('content-security-policy') ?? '';
    for (const directive of ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'"])
      assert.ok(csp.includes(directive), `${base}: ${directive}`);
    assert.ok(!/unsafe-inline|unsafe-eval/u.test(csp));
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(
      response.headers.get('permissions-policy'),
      'camera=(), microphone=(), geolocation=()',
    );
    const noindex = /noindex/iu.test(response.headers.get('x-robots-tag') ?? '');
    assert.equal(
      noindex,
      base !== origin,
      `${base}: expected Pages preview/immutable indexing policy`,
    );
    const html = await response.text();
    assert.ok(html.includes(`rel="canonical" href="${origin}/"`));
    assert.ok(html.includes('content="index,follow,max-image-preview:large"'));
    assert.ok(!html.includes('github.com/tvanreenen/xkcdpass'), 'Legacy application reference');
    assert.ok(!html.includes('tvanreenen/tap'), 'Legacy tap reference');
    const links = [...html.matchAll(/href="(https:\/\/github\.com\/[^"]+)"/gu)].map(
      (match) => match[1],
    );
    assert.equal(
      links.filter((href) => href === application).length,
      2,
      'Canonical application links',
    );
    assert.ok(html.includes('href="https://xkcd.com/936/"'), 'Original comic attribution');
    const applicationData = JSON.parse(
      html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/u)?.[1] ?? 'null',
    );
    for (const key of ['downloadUrl', 'codeRepository', 'sameAs'])
      assert.equal(applicationData?.[key], application, `Application ${key}`);
    assert.equal(
      html.match(/<code\b[^>]*\bid="install-command"[^>]*>([^<]*)<\/code>/u)?.[1].trim(),
      'brew install tvr-works/tap/xkcdpass',
      'Organization formula install command',
    );
    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gu)) {
      if (!/\bsrc=/u.test(match[1]))
        assert.ok(
          csp.includes(`'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`),
        );
    }
    const metadata = await get(base, '/deployment.json');
    assert.equal(metadata.status, 200);
    assert.match(metadata.headers.get('cache-control') ?? '', /no-store/u);
    const manifest = await metadata.json();
    assert.equal(manifest.sha, sha, `${base}: deployed SHA`);
    assert.equal(manifest.repository, repository);
    assert.equal(manifest.branch, expectedBranch, `${base}: deployed branch`);
    const publicFiles = Object.keys(manifest.files).filter((file) => file !== '_headers');
    const required = [
      'index.html',
      '404.html',
      '404.css',
      'robots.txt',
      'sitemap.xml',
      'assets/hero-background.webp',
      'assets/passphrase-thought.webp',
      'assets/xkcdpass-og.png',
    ];
    for (const file of required) assert.ok(publicFiles.includes(file), `${base}: missing ${file}`);
    for (const file of publicFiles)
      assert.ok(
        required.includes(file) || /^assets\/[\w-]+-[\w-]{8,}\.(?:js|css|woff2)$/u.test(file),
        `Unexpected public file: ${file}`,
      );
    await Promise.all(
      publicFiles.map(async (path) => {
        const publicPath =
          path === 'index.html'
            ? '/'
            : path === '404.html'
              ? '/missing-deployment-check/nested'
              : `/${path}`;
        const artifact = await get(base, publicPath);
        assert.equal(artifact.status, path === '404.html' ? 404 : 200, `${base}/${path}`);
        const bytes = Buffer.from(await artifact.arrayBuffer());
        assert.equal(
          createHash('sha256').update(bytes).digest('hex'),
          manifest.files[path],
          `${base}/${path}: artifact bytes`,
        );
      }),
    );
    const robots = await get(base, '/robots.txt');
    assert.match(robots.headers.get('content-type') ?? '', /text\/plain/u);
    assert.equal(
      await robots.text(),
      `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
    );
    const missing = await get(base, '/missing-deployment-check/nested');
    assert.equal(missing.status, 404);
    assert.ok((await missing.text()).includes('noindex,follow'));
    for (const path of ['/package.json', '/scripts/build-site.mjs', '/.git/config'])
      assert.equal((await get(base, path)).status, 404);
    console.log(`Verified ${environment} publication ${sha} at ${base}`);
  }
  for (const base of origins) {
    for (let attempt = 1; ; attempt++) {
      try {
        await verify(base);
        break;
      } catch (error) {
        if (attempt === 3) throw error;
        console.warn(
          `${base}: verification attempt ${attempt} failed; retrying after edge propagation.`,
        );
        await new Promise((resolve) => setTimeout(resolve, 5_000));
      }
    }
  }
}

if (import.meta.main)
  await verifyDeployment({
    sha: process.env.EXPECTED_SHA,
    environment: process.env.DEPLOYMENT_ENV,
    deploymentUrl: process.env.DEPLOYMENT_URL,
    previewAlias: process.env.PREVIEW_ALIAS,
    expectedBranch: process.env.EXPECTED_BRANCH,
  });
