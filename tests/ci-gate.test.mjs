import assert from 'node:assert/strict';
import { test, afterEach, mock } from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { waitForCI } from '../scripts/wait-for-ci.mjs';

const sha = 'a'.repeat(40);
const options = { repository: 'tvr-works/xkcdpass-site', sha, branch: 'main' };
const run = (overrides = {}) => ({
  id: 100,
  run_number: 10,
  run_attempt: 1,
  head_sha: sha,
  head_branch: 'main',
  event: 'push',
  status: 'completed',
  conclusion: 'success',
  ...overrides,
});
const response = (runs) => Response.json({ workflow_runs: runs });
afterEach(() => mock.restoreAll());

test('accepts only matching push CI and sends no credentials', async () => {
  const request = mock.method(globalThis, 'fetch', async () => response([run()]));
  await waitForCI(options);
  const [url, init] = request.mock.calls[0].arguments;
  const endpoint = new URL(url);
  assert.equal(endpoint.pathname, '/repos/tvr-works/xkcdpass-site/actions/workflows/ci.yml/runs');
  assert.deepEqual(Object.fromEntries(endpoint.searchParams), {
    head_sha: sha,
    branch: 'main',
    event: 'push',
    per_page: '100',
  });
  assert.equal(new Headers(init.headers).has('authorization'), false);
  assert.equal(request.mock.callCount(), 1);
});
for (const invalid of [
  { sha: undefined },
  { sha: 'abc' },
  { branch: undefined },
  { branch: ' ' },
  { repository: 'https://example.com' },
  { timeoutMs: 0 },
]) {
  test(`invalid gate context fails before a request: ${JSON.stringify(invalid)}`, async () => {
    const request = mock.method(globalThis, 'fetch');
    await assert.rejects(waitForCI({ ...options, ...invalid }), /required|Expected/u);
    assert.equal(request.mock.callCount(), 0);
  });
}
for (const conclusion of [
  'failure',
  'cancelled',
  'skipped',
  'timed_out',
  'neutral',
  'action_required',
  null,
]) {
  test(`completed ${conclusion} blocks publication`, async () => {
    mock.method(globalThis, 'fetch', async () => response([run({ conclusion })]));
    await assert.rejects(waitForCI(options), /refusing deployment/u);
  });
}
for (const mismatch of [
  { head_sha: 'b'.repeat(40) },
  { head_branch: 'feature/same-sha' },
  { event: 'pull_request' },
  { event: 'workflow_dispatch' },
]) {
  test(`cannot substitute another run: ${JSON.stringify(mismatch)}`, async () => {
    mock.method(globalThis, 'fetch', async () => response([run(mismatch)]));
    await assert.rejects(waitForCI({ ...options, timeoutMs: 10 }), /Timed out/u);
  });
}
test('older success cannot mask a newer failure or canceled rerun', async () => {
  const request = mock.method(globalThis, 'fetch', async () =>
    response([run(), run({ id: 101, run_number: 11, conclusion: 'failure' })]),
  );
  await assert.rejects(waitForCI(options), /CI run 101 concluded failure/u);
  request.mock.mockImplementation(async () =>
    response([run(), run({ run_attempt: 2, conclusion: 'cancelled' })]),
  );
  await assert.rejects(waitForCI(options), /concluded cancelled/u);
});
test('waits for a queued run without accepting an older success', async (t) => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'] });
  let calls = 0;
  mock.method(globalThis, 'fetch', async () =>
    response(
      ++calls === 1
        ? [run(), run({ id: 101, run_number: 11, status: 'queued', conclusion: null })]
        : [run({ id: 101, run_number: 11 })],
    ),
  );
  const pending = waitForCI(options);
  await setImmediate();
  assert.equal(calls, 1);
  t.mock.timers.tick(15_000);
  await pending;
  assert.equal(calls, 2);
});
test('deadline bounds polling and rejects a late success', async (t) => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'] });
  const request = mock.method(globalThis, 'fetch', async () => response([]));
  const pending = assert.rejects(waitForCI({ ...options, timeoutMs: 106_000 }), /Timed out/u);
  for (const time of [15_000, 30_000, 60_000, 1_000]) {
    await setImmediate();
    t.mock.timers.tick(time);
  }
  await pending;
  assert.equal(request.mock.callCount(), 4);
  request.mock.mockImplementation(async () => {
    t.mock.timers.tick(101);
    return response([run()]);
  });
  await assert.rejects(waitForCI({ ...options, timeoutMs: 100 }), /Timed out/u);
});
for (const status of [403, 429, 404, 500]) {
  test(`HTTP ${status} blocks publication`, async () => {
    mock.method(globalThis, 'fetch', async () => new Response(null, { status }));
    await assert.rejects(waitForCI(options), /denied|rate-limited|lookup failed/u);
  });
}
test('network failures and invalid JSON block publication', async () => {
  const request = mock.method(globalThis, 'fetch', async () => {
    throw new TypeError('Network unavailable');
  });
  await assert.rejects(waitForCI(options), /Network unavailable/u);
  request.mock.mockImplementation(async () => new Response('not JSON'));
  await assert.rejects(waitForCI(options), SyntaxError);
});
for (const payload of [
  {},
  { workflow_runs: null },
  { workflow_runs: [{}] },
  { workflow_runs: [run(), {}] },
]) {
  test(`malformed response fails closed: ${JSON.stringify(payload)}`, async () => {
    mock.method(globalThis, 'fetch', async () => Response.json(payload));
    await assert.rejects(waitForCI(options), /Invalid GitHub workflow response/u);
  });
}
