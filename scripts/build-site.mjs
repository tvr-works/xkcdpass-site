import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, rm, copyFile, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { root, sourceFiles, validateSource, validateOutput, repository } from './site.mjs';

await validateSource();
const sha =
  process.env.CF_PAGES_COMMIT_SHA ??
  execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.match(sha, /^[a-f0-9]{40}$/u);
const branch =
  process.env.CF_PAGES_BRANCH ??
  (process.env.GITHUB_HEAD_REF ||
    process.env.GITHUB_REF_NAME ||
    execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim());
assert.ok(branch.trim(), 'A branch identity is required for the static artifact.');
const directory = resolve(root, 'dist');
await rm(directory, { recursive: true, force: true });
await Promise.all(
  sourceFiles.map(async (file) => {
    await mkdir(dirname(resolve(directory, file)), { recursive: true });
    await copyFile(resolve(root, file), resolve(directory, file));
  }),
);
const html = await readFile(resolve(directory, 'index.html'), 'utf8');
const hashes = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gu)]
  .filter((match) => !/\bsrc=/.test(match[0]))
  .map((match) => `'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`);
const csp = `default-src 'self'; script-src 'self' ${hashes.join(' ')}; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`;
await writeFile(
  resolve(directory, '_headers'),
  `/*\n  Content-Security-Policy: ${csp}\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n/deployment.json\n  Cache-Control: no-store\n`,
);
const files = Object.fromEntries(
  await Promise.all(
    [...sourceFiles, '_headers'].map(async (file) => [
      file,
      createHash('sha256')
        .update(await readFile(resolve(directory, file)))
        .digest('hex'),
    ]),
  ),
);
await writeFile(
  resolve(directory, 'deployment.json'),
  `${JSON.stringify({ repository, sha, branch, files }, null, 2)}\n`,
);
await validateOutput(directory);
console.log(`Packaged ${Object.keys(files).length + 1} public files from ${sha}.`);
