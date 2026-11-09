import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, copyFile, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { root, sourceFiles, validateSource, validateOutput } from '../scripts/site.mjs';

async function fixture(t) {
  const directory = await mkdtemp(resolve(tmpdir(), 'xkcdpass-output-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await Promise.all(
    sourceFiles.map(async (file) => {
      await mkdir(dirname(resolve(directory, file)), { recursive: true });
      await copyFile(resolve(root, file), resolve(directory, file));
    }),
  );
  await writeFile(resolve(directory, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n');
  await writeFile(resolve(directory, 'deployment.json'), '{}\n');
  return directory;
}

test('a complete static output fits budgets', async (t) => {
  await validateOutput(await fixture(t));
});
test('an accidental development file cannot be published', async (t) => {
  const directory = await fixture(t);
  await writeFile(resolve(directory, 'package.json'), '{}');
  await assert.rejects(validateOutput(directory), /Only allowlisted public files/u);
});
test('a missing public asset blocks packaging', async (t) => {
  const directory = await fixture(t);
  await rm(resolve(directory, 'assets/hero-stickman.svg'));
  await assert.rejects(validateOutput(directory), /Only allowlisted public files/u);
});
test('symlinks cannot pull files into the public artifact', async (t) => {
  const directory = await fixture(t);
  await rm(resolve(directory, 'main.js'));
  await symlink(resolve(root, 'package.json'), resolve(directory, 'main.js'));
  await assert.rejects(validateOutput(directory), /symlink/u);
});
test('oversized source JavaScript exceeds the build budget', async (t) => {
  const directory = await fixture(t);
  await writeFile(resolve(directory, 'main.js'), ' '.repeat(4097));
  await assert.rejects(validateOutput(directory), /javascript: raw asset budget exceeded/u);
});
for (const [description, change, expected] of [
  [
    'broken local reference',
    (html) => html.replace('./styles.css', './missing.css'),
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
    (html) => html.replace('href="#guide"', 'href="javascript:alert(1)"'),
    /unsafe URL/u,
  ],
]) {
  test(`${description} blocks source validation`, async (t) => {
    const directory = await fixture(t);
    const path = resolve(directory, 'index.html');
    await writeFile(path, change(await readFile(path, 'utf8')));
    await assert.rejects(validateSource(directory), expected);
  });
}
