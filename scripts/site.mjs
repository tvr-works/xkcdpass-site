import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { parse, parseFragment } from 'parse5';
import budgets from '../build-budgets.json' with { type: 'json' };
import {
  pageFiles,
  pageRoutes,
  publicFiles,
  compiledAssetPattern,
  privacyStylesheetPattern,
} from './artifact-policy.mjs';

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
        documents.set(file, { document, ids, text });
      }),
  );
  for (const [file, { document }] of documents) {
    const pageUrl = `${origin}${pageRoutes[file] ?? `/${file}`}`;
    walk(document, (node) => {
      for (const { name, value } of node.attrs ?? []) {
        if (!['src', 'href', 'aria-controls'].includes(name)) continue;
        if (name === 'aria-controls') {
          assert.ok(documents.get(file).ids.has(value), `${file}: missing control target ${value}`);
          continue;
        }
        const url = new URL(value, pageUrl);
        assert.ok(['http:', 'https:', 'mailto:'].includes(url.protocol), `${file}: unsafe URL`);
        if (url.origin !== origin) continue;
        const pathname = decodeURIComponent(url.pathname);
        const target = pageFiles.get(pathname) ?? pathname.slice(1);
        assert.ok(
          files.includes(target) ||
            (source &&
              (['src/main.tsx', 'src/styles.css', 'src/privacy.css'].includes(target) ||
                publicFiles.includes(target))),
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
  for (const [file, path] of Object.entries(pageRoutes)) {
    const html = documents.get(file).text;
    assert.ok(
      html.includes(`rel="canonical" href="${origin}${path}"`),
      `${file}: production canonical URL`,
    );
    assert.ok(
      html.includes('content="index,follow,max-image-preview:large"'),
      `${file}: public indexing`,
    );
  }
}

export async function validateSource() {
  const files = await listFiles(resolve(root, 'public'));
  assert.deepEqual(
    files,
    publicFiles.toSorted(),
    'Only declared public assets may be copied by Vite.',
  );
  await validateDocuments(root, Object.keys(pageRoutes), { source: true });
  assert.equal(
    await readFile(resolve(root, 'public/robots.txt'), 'utf8'),
    `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
  );
  const sitemap = await readFile(resolve(root, 'public/sitemap.xml'), 'utf8');
  assert.deepEqual(
    sitemap.match(/<loc>[^<]+<\/loc>/gu),
    [...pageFiles.keys()].map((path) => `<loc>${origin}${path}</loc>`),
  );
}

export async function validateOutput(directory) {
  const files = await listFiles(directory);
  const required = [...Object.keys(pageRoutes), '_headers', 'deployment.json', ...publicFiles];
  for (const file of files)
    assert.ok(
      required.includes(file) || compiledAssetPattern.test(file),
      `Only allowlisted public files may be published: ${file}`,
    );
  for (const file of required) assert.ok(files.includes(file), `Missing public asset: ${file}`);
  await validateDocuments(directory, files);
  const manifest = JSON.parse(await readFile(resolve(directory, 'deployment.json'), 'utf8'));
  assert.deepEqual(
    Object.keys(manifest.files).toSorted(),
    files.filter((file) => file !== 'deployment.json'),
    'Manifest must cover the complete public artifact.',
  );
  const groups = {
    javascript: (file) => file.endsWith('.js'),
    css: (file) => file.endsWith('.css') && !privacyStylesheetPattern.test(file),
    privacyCss: (file) => privacyStylesheetPattern.test(file),
    html: (file) => file.endsWith('.html'),
    images: (file) => ['.png', '.svg', '.webp'].includes(extname(file)),
    fonts: (file) => file.endsWith('.woff2'),
    total: () => true,
  };
  const sizes = await Promise.all(
    files.map(async (file) => {
      const bytes = await readFile(resolve(directory, file));
      return { file, raw: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length };
    }),
  );
  for (const [name, matches] of Object.entries(groups)) {
    const selected = sizes.filter(({ file }) => matches(file));
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
