import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'parse5';
import sharp from 'sharp';
import { root, origin } from '../scripts/site.mjs';

let nodes;
before(async () => {
  const document = parse(await readFile(resolve(root, 'dist/index.html'), 'utf8'));
  nodes = [];
  function collect(node) {
    nodes.push({
      tag: node.tagName,
      attributes: Object.fromEntries((node.attrs ?? []).map(({ name, value }) => [name, value])),
      text: (node.childNodes ?? []).map((child) => child.value ?? '').join(''),
    });
    for (const child of node.childNodes ?? []) collect(child);
  }
  collect(document);
});
function meta(key) {
  const matches = nodes.filter(
    ({ tag, attributes }) =>
      tag === 'meta' && (attributes.name === key || attributes.property === key),
  );
  assert.equal(matches.length, 1, `Exactly one ${key} meta tag`);
  assert.ok(matches[0].attributes.content.trim(), `Nonempty ${key}`);
  return matches[0].attributes.content;
}

test('search and social metadata describe the prerendered CLI page consistently', () => {
  const titles = nodes.filter(({ tag }) => tag === 'title');
  assert.equal(titles.length, 1);
  assert.match(titles[0].text, /xkcdpass.*[Cc]ommand-line passphrase generator/u);
  assert.equal(nodes.filter(({ tag }) => tag === 'h1').length, 1);
  assert.ok(nodes.some(({ text }) => text === 'Command-line passphrase generator'));
  const canonicals = nodes.filter(
    ({ tag, attributes }) => tag === 'link' && attributes.rel === 'canonical',
  );
  assert.equal(canonicals.length, 1);
  assert.equal(canonicals[0].attributes.href, `${origin}/`);
  assert.equal(meta('og:url'), `${origin}/`);
  assert.equal(meta('og:type'), 'website');
  assert.equal(meta('og:site_name'), 'xkcdpass');
  assert.equal(meta('twitter:card'), 'summary_large_image');
  assert.equal(meta('og:title'), meta('twitter:title'));
  assert.equal(meta('description'), meta('og:description'));
  assert.equal(meta('description'), meta('twitter:description'));
  assert.match(meta('description'), /cryptographically strong.*locally.*terminal/u);
  assert.equal(meta('robots'), 'index,follow,max-image-preview:large');
});

test('social crawlers receive a real PNG whose dimensions and alternative text match metadata', async () => {
  const image = new URL(meta('og:image'));
  assert.equal(image.origin, origin);
  assert.equal(image.search, '');
  assert.equal(meta('twitter:image'), image.href);
  assert.equal(meta('og:image:alt'), meta('twitter:image:alt'));
  assert.match(meta('og:image:alt'), /terminal.*turtlerocketcactusdonut.*stick figure/u);
  const information = await sharp(resolve(root, 'dist', image.pathname.slice(1))).metadata();
  assert.equal(meta('og:image:type'), `image/${information.format}`);
  assert.equal(Number(meta('og:image:width')), information.width);
  assert.equal(Number(meta('og:image:height')), information.height);
  assert.equal(information.width, 1200);
  assert.equal(information.height, 630);
  assert.equal(information.hasAlpha, false);
});

test('software metadata points to installation and uses application properties', () => {
  const scripts = nodes.filter(
    ({ tag, attributes }) => tag === 'script' && attributes.type === 'application/ld+json',
  );
  assert.equal(scripts.length, 1);
  const software = JSON.parse(scripts[0].text);
  assert.equal(software['@type'], 'SoftwareApplication');
  assert.equal(software.name, 'xkcdpass');
  assert.equal(software.url, `${origin}/`);
  assert.equal(software.description, meta('description'));
  assert.equal(software.image, meta('og:image'));
  assert.equal(software.downloadUrl, `${software.sameAs}/releases`);
  assert.equal(software.installUrl, `${software.sameAs}#installation`);
  assert.ok(!Object.hasOwn(software, 'codeRepository'));
});

test('the browser and search favicon resolves to a square vector asset', async () => {
  const icons = nodes.filter(({ tag, attributes }) => tag === 'link' && attributes.rel === 'icon');
  assert.equal(icons.length, 1);
  assert.equal(icons[0].attributes.type, 'image/svg+xml');
  const url = new URL(icons[0].attributes.href, origin);
  assert.equal(url.origin, origin);
  const information = await sharp(resolve(root, 'dist', url.pathname.slice(1))).metadata();
  assert.equal(information.format, 'svg');
  assert.equal(information.width, information.height);
  assert.ok(information.width >= 48);
});
