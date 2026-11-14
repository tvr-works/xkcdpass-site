import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, cp, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { root, validateDocuments, validateOutput, listFiles } from '../scripts/site.mjs';
import budgets from '../build-budgets.json' with { type: 'json' };

async function fixture(t) {
  const directory = await mkdtemp(resolve(tmpdir(), 'xkcdpass-output-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await cp(resolve(root, 'dist'), directory, { recursive: true });
  return directory;
}

test('compiled, prerendered output fits budgets and includes content without JavaScript', async (t) => {
  const directory = await fixture(t);
  await validateOutput(directory);
  const html = await readFile(resolve(directory, 'index.html'), 'utf8');
  assert.match(html, /Hard to guess\.<br\/>Easy to use\./u);
  assert.match(html, /turtlerocketcactusdonut/u);
  assert.match(html, /brew install tvr-works\/tap\/xkcdpass/u);
});
test('an accidental development file cannot be published', async (t) => {
  const directory = await fixture(t);
  await writeFile(resolve(directory, 'package.json'), '{}');
  await assert.rejects(validateOutput(directory), /Only allowlisted public files/u);
});
test('a missing illustration blocks packaging', async (t) => {
  const directory = await fixture(t);
  await rm(resolve(directory, 'assets/passphrase-thought.webp'));
  await assert.rejects(validateOutput(directory), /Missing public asset/u);
});
test('symlinks cannot pull files into the public artifact', async (t) => {
  const directory = await fixture(t);
  await rm(resolve(directory, '404.css'));
  await symlink(resolve(root, 'package.json'), resolve(directory, '404.css'));
  await assert.rejects(validateOutput(directory), /symlink/u);
});
test('oversized compiled JavaScript exceeds the build budget', async (t) => {
  const directory = await fixture(t);
  const js = (await listFiles(directory)).find((file) => file.endsWith('.js'));
  await writeFile(resolve(directory, js), ' '.repeat(budgets.javascript.maxRawKiB * 1024 + 1));
  await assert.rejects(validateOutput(directory), /javascript: raw asset budget exceeded/u);
});
for (const [description, change, expected] of [
  [
    'broken local reference',
    (html) => html.replace('/assets/passphrase-thought.webp', '/missing.webp'),
    /missing public file/u,
  ],
  ['duplicate ID', (html) => html.replace('id="top"', 'id="main"'), /duplicate id/u],
  [
    'inline handler',
    (html) => html.replace('<body>', '<body onload="alert(1)">'),
    /inline event handler/u,
  ],
  ['invalid structured data', (html) => html.replace('"@context":', '"@context"'), SyntaxError],
  [
    'unsafe link',
    (html) => html.replace('href="#main"', 'href="javascript:alert(1)"'),
    /unsafe URL/u,
  ],
]) {
  test(`${description} blocks artifact validation`, async (t) => {
    const directory = await fixture(t);
    const path = resolve(directory, 'index.html');
    await writeFile(path, change(await readFile(path, 'utf8')));
    await assert.rejects(validateDocuments(directory, await listFiles(directory)), expected);
  });
}
