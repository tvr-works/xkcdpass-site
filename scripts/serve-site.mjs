import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { root } from './site.mjs';

// Local artifact preview only. Hosted smoke tests separately verify Pages' real delivery.
const directory = resolve(root, 'dist');
const headers = await readFile(resolve(directory, '_headers'), 'utf8');
const rules = [];
let rule;
for (const line of headers.trimEnd().split('\n')) {
  if (!line.startsWith(' ')) {
    rule = { path: line, headers: {} };
    rules.push(rule);
  } else {
    const match = /^  ([\w-]+): (.+)$/u.exec(line);
    if (!match) throw new Error('Invalid local header rule.');
    rule.headers[match[1]] = match[2];
  }
}
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.json': 'application/json',
};
const server = createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    for (const entry of rules)
      if (entry.path === '/*' || entry.path === path)
        for (const [name, value] of Object.entries(entry.headers)) response.setHeader(name, value);
    let file = resolve(directory, `.${path === '/' ? '/index.html' : path}`);
    let status = 200;
    if (!file.startsWith(directory + sep) || path === '/_headers') {
      response.writeHead(404);
      response.end();
      return;
    }
    try {
      if (!(await stat(file)).isFile()) throw new Error('Not a regular file');
    } catch {
      file = resolve(directory, '404.html');
      status = 404;
    }
    const body = await readFile(file);
    response.writeHead(status, {
      'Content-Type': types[extname(file)] ?? 'application/octet-stream',
      'Content-Length': body.length,
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(400);
    response.end('Invalid request');
  }
});
server.listen(Number(process.env.PORT ?? 4175), '127.0.0.1', () =>
  console.log(`Static artifact preview: http://127.0.0.1:${server.address().port}`),
);
