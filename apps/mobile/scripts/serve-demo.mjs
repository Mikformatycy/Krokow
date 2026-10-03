import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.ico': 'image/x-icon' };
const server = createServer((request, response) => {
  void (async () => {
    if (request.method !== 'GET' && request.method !== 'HEAD') { response.writeHead(405).end(); return; }
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    let target = path.resolve(root, '.' + pathname);
    if (target !== path.resolve(root) && !target.startsWith(root)) { response.writeHead(404).end(); return; }
    if (pathname === '/') target = path.join(root, 'index.html');
    else if (!path.extname(target)) target += '.html';
    if (!(await stat(target)).isFile()) { response.writeHead(404).end(); return; }
    const body = await readFile(target);
    response.writeHead(200, { 'Content-Type': types[path.extname(target)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
  })().catch(() => response.writeHead(404).end());
});
server.listen(8081, '127.0.0.1', () => console.log('Static demo: http://localhost:8081'));
process.once('SIGINT', () => server.close());
process.once('SIGTERM', () => server.close());
