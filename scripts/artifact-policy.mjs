// Prerendered documents and the clean paths Pages serves them at.
export const pageRoutes = { 'index.html': '/', 'privacy.html': '/privacy' };
export const pageFiles = new Map(Object.entries(pageRoutes).map(([file, path]) => [path, file]));

// Files copied from public/ and the only compiler-generated asset names we publish.
export const publicFiles = [
  'robots.txt',
  'sitemap.xml',
  '404.html',
  '404.css',
  'favicon.svg',
  'assets/passphrase-thought.webp',
  'assets/xkcdpass-social.png',
];

export const compiledAssetPattern = /^assets\/[\w-]+-[\w-]{8,}\.(?:js|css|woff2)$/u;
export const privacyStylesheetPattern = /^assets\/privacy-[\w-]{8,}\.css$/u;
