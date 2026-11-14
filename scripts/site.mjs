import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { parse, parseFragment } from 'parse5';
import budgets from '../build-budgets.json' with { type: 'json' };
import { publicFiles, compiledAssetPattern } from './artifact-policy.mjs';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const origin = 'https://xkcdpass.tvr.works';
export const repository = 'tvr-works/xkcdpass-site';

export async function listFiles(directory) {
  const files = [];
  async function collect(relative = '') {
    await Promise.all(
      (await readdir(resolve(directory, relative), { withFileTypes: true })).map(async (entry) => {
        const path = relative ? `${relative}/${entry.name}` : entry.name;
        assert.ok(!entry.isSymbolicLink(), `Output symlink is forbidden: ${path}`);
        if (entry.isDirectory()) await collect(path);
        else {
          assert.ok(entry.isFile(), `Unexpected output entry: ${path}`);
          files.push(path);
        }
      }),
    );
  }
  await collect();
  return files.toSorted();
}

function walk(node, visit) {
  visit(node);
  for (const child of node.childNodes ?? []) walk(child, visit);
}

export async function validateDocuments(directory, files, { source = false } = {}) {
  const documents = new Map();
  await Promise.all(
    files
      .filter((file) => ['.html', '.svg'].includes(extname(file)))
      .map(async (file) => {
        const text = await readFile(resolve(directory, file), 'utf8');
        const errors = [];
        const document = file.endsWith('.html')
          ? parse(text, { onParseError: (error) => errors.push(error.code) })
          : parseFragment(text);
        assert.deepEqual(errors, [], `${file}: invalid HTML`);
        const ids = new Set();
        walk(document, (node) => {
          const attributes = Object.fromEntries(
            (node.attrs ?? []).map(({ name, value }) => [name, value]),
          );
          if (attributes.id) {
            assert.ok(!ids.has(attributes.id), `${file}: duplicate id ${attributes.id}`);
            ids.add(attributes.id);
          }
          for (const name of Object.keys(attributes))
            assert.ok(!name.startsWith('on'), `${file}: inline event handler`);
          if (node.tagName === 'script' && !attributes.src) {
            assert.equal(
              attributes.type,
              'application/ld+json',
              `${file}: unexpected inline script`,
            );
            JSON.parse(node.childNodes.map((child) => child.value ?? '').join(''));
          }
        });
        documents.set(file, { document, ids });
      }),
  );
  for (const [file, { document }] of documents) {
    walk(document, (node) => {
      for (const { name, value } of node.attrs ?? []) {
        if (!['src', 'href', 'aria-controls'].includes(name)) continue;
        if (name === 'aria-controls') {
          assert.ok(documents.get(file).ids.has(value), `${file}: missing control target ${value}`);
          continue;
        }
        const url = new URL(value, `${origin}/${file}`);
        assert.ok(['http:', 'https:', 'mailto:'].includes(url.protocol), `${file}: unsafe URL`);
        if (url.origin !== origin) continue;
        const target = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html';
        assert.ok(
          files.includes(target) ||
            (source && (target === 'src/main.tsx' || publicFiles.includes(target))),
          `${file}: missing public file ${value}`,
        );
        if (url.hash)
          assert.ok(
            documents.get(target)?.ids.has(decodeURIComponent(url.hash.slice(1))),
            `${file}: missing fragment ${value}`,
          );
      }
    });
  }
  const html = await readFile(resolve(directory, 'index.html'), 'utf8');
  assert.ok(
    html.includes(`rel="canonical" href="${origin}/"`),
    'Preserve the production canonical URL.',
  );
  assert.ok(
    html.includes('content="index,follow,max-image-preview:large"'),
    'Preserve public indexing.',
  );
}

export async function validateSource() {
  const files = await listFiles(resolve(root, 'public'));
  assert.deepEqual(
    files,
    publicFiles.toSorted(),
    'Only declared public assets may be copied by Vite.',
  );
  await validateDocuments(root, ['index.html'], { source: true });
  assert.equal(
    await readFile(resolve(root, 'public/robots.txt'), 'utf8'),
    `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
  );
  const sitemap = await readFile(resolve(root, 'public/sitemap.xml'), 'utf8');
  assert.deepEqual(sitemap.match(/<loc>[^<]+<\/loc>/gu), [`<loc>${origin}/</loc>`]);
}

export async function validateOutput(directory) {
  const files = await listFiles(directory);
  for (const file of files)
    assert.ok(
      ['index.html', '_headers', 'deployment.json', ...publicFiles].includes(file) ||
        compiledAssetPattern.test(file),
      `Only allowlisted public files may be published: ${file}`,
    );
  for (const file of ['index.html', '_headers', 'deployment.json', ...publicFiles])
    assert.ok(files.includes(file), `Missing public asset: ${file}`);
  await validateDocuments(directory, files);
  const manifest = JSON.parse(await readFile(resolve(directory, 'deployment.json'), 'utf8'));
  assert.deepEqual(
    Object.keys(manifest.files).toSorted(),
    files.filter((file) => file !== 'deployment.json'),
    'Manifest must cover the complete public artifact.',
  );
  const groups = {
    javascript: ['.js'],
    css: ['.css'],
    html: ['.html'],
    images: ['.png', '.svg', '.webp'],
    fonts: ['.woff2'],
    total: null,
  };
  const sizes = await Promise.all(
    files.map(async (file) => {
      const bytes = await readFile(resolve(directory, file));
      return { file, raw: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length };
    }),
  );
  for (const [name, extensions] of Object.entries(groups)) {
    const selected = sizes.filter(({ file }) => !extensions || extensions.includes(extname(file)));
    assert.ok(selected.length, `Missing ${name} assets`);
    const raw = selected.reduce((sum, file) => sum + file.raw, 0);
    const gzip = selected.reduce((sum, file) => sum + file.gzip, 0);
    assert.ok(
      raw <= budgets[name].maxRawKiB * 1024,
      `${name}: raw asset budget exceeded (${(raw / 1024).toFixed(1)} KiB)`,
    );
    if (budgets[name].maxGzipKiB)
      assert.ok(gzip <= budgets[name].maxGzipKiB * 1024, `${name}: gzip budget exceeded`);
    console.log(
      `${name}: ${(raw / 1024).toFixed(2)} KiB raw; ${(gzip / 1024).toFixed(2)} KiB gzip`,
    );
  }
}
