import assert from 'node:assert/strict';
import { before, test, afterEach, mock } from 'node:test';
import { readFile } from 'node:fs/promises';
import { setImmediate } from 'node:timers/promises';
import { resolve } from 'node:path';
import { verifyDeployment } from '../scripts/verify-deployment.mjs';
import { root, origin, listFiles } from '../scripts/site.mjs';

let files;
let manifest;
let headers;
before(async () => {
  // npm test builds once; fixtures use the actual compiled and prerendered artifact.
  const outputFiles = await listFiles(resolve(root, 'dist'));
  files = Object.fromEntries(
    await Promise.all(
      outputFiles.map(async (file) => [file, await readFile(resolve(root, 'dist', file))]),
    ),
  );
  manifest = JSON.parse(files['deployment.json']);
  assert.ok(manifest.branch);
  assert.match(manifest.sha, /^[a-f0-9]{40}$/u);
  headers = Object.fromEntries(
    [
      ...files['_headers']
        .toString()
        .split('/deployment.json')[0]
        .matchAll(/^  ([\w-]+): (.+)$/gmu),
    ].map((match) => [match[1], match[2]]),
  );
});
afterEach(() => mock.restoreAll());
const deploymentUrl = 'https://1234abcd.xkcdpass-site.pages.dev';
const previewAlias = 'https://feature-check.xkcdpass-site.pages.dev';
function responses(environment, overrides = {}, changeHtml = (body) => body) {
  const hosts = new Set();
  mock.method(globalThis, 'fetch', async (input) => {
    const url = new URL(input);
    hosts.add(url.origin);
    const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const responseHeaders = {
      ...headers,
      'Content-Type': file.endsWith('.html')
        ? 'text/html; charset=utf-8'
        : file.endsWith('.txt')
          ? 'text/plain; charset=utf-8'
          : 'application/octet-stream',
    };
    if (url.origin !== origin) responseHeaders['X-Robots-Tag'] = 'noindex';
    if (file === 'deployment.json')
      return Response.json(
        {
          ...manifest,
          branch: environment === 'production' ? 'main' : manifest.branch,
          ...overrides,
        },
        { headers: { ...responseHeaders, 'Cache-Control': 'no-store' } },
      );
    const body =
      file === 'index.html'
        ? changeHtml(files[file].toString())
        : (files[file] ?? files['404.html']);
    return new Response(body, {
      status: files[file] ? 200 : 404,
      headers: responseHeaders,
    });
  });
  return hosts;
}
test('preview smoke verifies only its immutable URL and alias', async () => {
  const hosts = responses('preview');
  await verifyDeployment({
    environment: 'preview',
    deploymentUrl,
    previewAlias,
    sha: manifest.sha,
    expectedBranch: manifest.branch,
  });
  assert.deepEqual(hosts, new Set([deploymentUrl, previewAlias]));
});
test('production smoke requires main and verifies its immutable URL and public domain', async () => {
  const hosts = responses('production');
  await verifyDeployment({ environment: 'production', deploymentUrl, sha: manifest.sha });
  assert.deepEqual(hosts, new Set([deploymentUrl, origin]));
});
for (const [description, overrides, pattern, changeHtml] of [
  ['wrong deployed commit', { sha: 'b'.repeat(40) }, /deployed SHA/u],
  ['wrong deployed branch', { branch: 'another-branch' }, /deployed branch/u],
  [
    'legacy application link',
    {},
    /Legacy application reference/u,
    (html) =>
      html.replace(
        'href="https://github.com/tvr-works/xkcdpass"',
        'href="https://github.com/tvanreenen/xkcdpass"',
      ),
  ],
  [
    'incorrect application license',
    {},
    /Canonical application license/u,
    (html) => html.replace('/blob/main/LICENSE', '/blob/main/COPYING'),
  ],
  [
    'incorrect download metadata',
    {},
    /Application downloadUrl/u,
    (html) =>
      html.replace(
        '"downloadUrl": "https://github.com/tvr-works/xkcdpass"',
        '"downloadUrl": "https://example.com/download"',
      ),
  ],
  [
    'unqualified installation command',
    {},
    /Organization formula install command/u,
    (html) => html.replace('brew install tvr-works/tap/xkcdpass', 'brew install xkcdpass'),
  ],
]) {
  test(`${description} fails all bounded smoke attempts`, async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    responses('preview', overrides, changeHtml);
    const pending = assert.rejects(
      verifyDeployment({
        environment: 'preview',
        deploymentUrl,
        sha: manifest.sha,
        expectedBranch: manifest.branch,
      }),
      pattern,
    );
    await setImmediate();
    t.mock.timers.tick(5_000);
    await setImmediate();
    t.mock.timers.tick(5_000);
    await pending;
  });
}
test('preview needs a branch and cannot use a mutable URL as immutable identity', async () => {
  const request = mock.method(globalThis, 'fetch');
  await assert.rejects(
    verifyDeployment({ environment: 'preview', deploymentUrl, sha: manifest.sha }),
    /EXPECTED_BRANCH/u,
  );
  await assert.rejects(
    verifyDeployment({
      environment: 'preview',
      deploymentUrl: previewAlias,
      sha: manifest.sha,
      expectedBranch: manifest.branch,
    }),
    /immutable deployment URL/u,
  );
  assert.equal(request.mock.callCount(), 0);
});
