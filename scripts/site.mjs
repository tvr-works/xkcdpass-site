import assert from 'node:assert/strict';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { parse, parseFragment } from 'parse5';
import budgets from '../build-budgets.json' with { type: 'json' };

export const root = fileURLToPath(new URL('../', import.meta.url));
export const origin = 'https://xkcdpass.tvr.works';
export const repository = 'tvr-works/xkcdpass-site';
export const sourceFiles = [
  'index.html',
  'main.js',
  'styles.css',
  'robots.txt',
  'sitemap.xml',
  '404.html',
  'assets/hero-stickman.svg',
  'assets/icons/lucide-sprite.svg',
  'assets/xkcdpass-og.png',
];
export const outputFiles = [...sourceFiles, '_headers', 'deployment.json'];

export function walk(node, visit) {
  visit(node);
  for (const child of node.childNodes ?? []) walk(child, visit);
}

export async function validateSource(directory = root) {
  const documents = new Map();
  await Promise.all(
    sourceFiles.map(async (file) => {
      assert.ok(
        (await lstat(resolve(directory, file))).isFile(),
        `Expected a regular source file: ${file}`,
      );
      if (!['.html', '.svg'].includes(extname(file))) return;
      const source = await readFile(resolve(directory, file), 'utf8');
      const errors = [];
      const document = file.endsWith('.html')
        ? parse(source, { onParseError: (error) => errors.push(error.code) })
        : parseFragment(source);
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
          assert.equal(attributes.type, 'application/ld+json', `${file}: unexpected inline script`);
          JSON.parse(node.childNodes.map((child) => child.value ?? '').join(''));
        }
      });
      documents.set(file, { document, ids });
    }),
  );
  for (const [file, { document }] of documents) {
    walk(document, (node) => {
      for (const { name, value } of node.attrs ?? []) {
        if (!['src', 'href', 'aria-controls', 'data-copy-target'].includes(name)) continue;
        if (['aria-controls', 'data-copy-target'].includes(name)) {
          assert.ok(documents.get(file).ids.has(value), `${file}: missing control target ${value}`);
          continue;
        }
        const url = new URL(value, `${origin}/${file}`);
        assert.ok(['http:', 'https:', 'mailto:'].includes(url.protocol), `${file}: unsafe URL`);
        if (url.origin !== origin) continue;
        const target = decodeURIComponent(url.pathname).replace(/^\//, '') || 'index.html';
        assert.ok(sourceFiles.includes(target), `${file}: missing public file ${value}`);
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
  assert.equal(
    await readFile(resolve(directory, 'robots.txt'), 'utf8'),
    `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
  );
  const sitemap = await readFile(resolve(directory, 'sitemap.xml'), 'utf8');
  assert.deepEqual(sitemap.match(/<loc>[^<]+<\/loc>/gu), [`<loc>${origin}/</loc>`]);
}

export async function validateOutput(directory) {
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
  assert.deepEqual(
    files.toSorted(),
    outputFiles.toSorted(),
    'Only allowlisted public files may be published.',
  );
  await validateSource(directory);
  const groups = {
    javascript: ['.js'],
    css: ['.css'],
    html: ['.html'],
    images: ['.png', '.svg'],
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
    assert.ok(raw <= budgets[name].maxRawKiB * 1024, `${name}: raw asset budget exceeded`);
    if (budgets[name].maxGzipKiB)
      assert.ok(gzip <= budgets[name].maxGzipKiB * 1024, `${name}: gzip budget exceeded`);
    console.log(
      `${name}: ${(raw / 1024).toFixed(2)} KiB raw; ${(gzip / 1024).toFixed(2)} KiB gzip`,
    );
  }
}
