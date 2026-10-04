import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';

// One temporary ngrok endpoint serves Metro and the configured API together.
// Use the ngrok integration shipped with our pinned Expo CLI, not a copied token.
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const expoRequire = createRequire(require.resolve('expo/package.json'));
const cliRoot = path.dirname(expoRequire.resolve('@expo/cli/package.json'));
const { AsyncNgrok } = await import(pathToFileURL(path.join(cliRoot, 'build/src/start/server/AsyncNgrok.js')).href);
const tunnel = new AsyncNgrok(projectRoot, 8082);
// An npm-exec Node installation can have a different global prefix on Windows.
// The optional prefix still goes through Expo's module version validation.
if (process.env.KROK_NGROK_PREFIX) {
  const globalRequire = createRequire(path.join(process.env.KROK_NGROK_PREFIX, 'package.json'));
  tunnel.resolver._resolveGlobal = (moduleId) => globalRequire.resolve(moduleId);
}
const apiPaths = new Set(['/healthz', '/readyz', '/openapi.json']);
const gateway = http.createServer((request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
  const port = pathname.startsWith('/v1/') || apiPaths.has(pathname) ? 3001 : 8081;
  const upstream = http.request({
    hostname: '127.0.0.1', port, method: request.method, path: request.url,
    headers: request.headers,
  }, (incoming) => {
    response.writeHead(incoming.statusCode ?? 502, incoming.headers);
    incoming.pipe(response);
    incoming.on('error', () => response.destroy());
  });
  upstream.on('error', () => {
    if (!response.headersSent) response.writeHead(502, { 'Content-Type': 'text/plain' });
    response.end('Local development server unavailable');
  });
  request.on('aborted', () => upstream.destroy());
  response.on('close', () => { if (!response.writableFinished) upstream.destroy(); });
  request.pipe(upstream);
});
gateway.on('upgrade', (request, socket, head) => {
  const upstream = net.connect(8081, '127.0.0.1', () => {
    upstream.write(`${request.method} ${request.url} HTTP/${request.httpVersion}\r\n`);
    for (let i = 0; i < request.rawHeaders.length; i += 2) {
      upstream.write(`${request.rawHeaders[i]}: ${request.rawHeaders[i + 1]}\r\n`);
    }
    upstream.write('\r\n');
    if (head.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on('error', () => socket.destroy());
  socket.on('error', () => upstream.destroy());
  socket.on('close', () => upstream.destroy());
});

let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  gateway.closeAllConnections();
  gateway.close();
  await tunnel.stopAsync();
  process.exit(code);
}
process.on('SIGINT', () => { void stop(); });
process.on('SIGTERM', () => { void stop(); });
try {
  await new Promise((resolve, reject) => {
    gateway.once('error', reject);
    gateway.listen(8082, '127.0.0.1', resolve);
  });
  if (process.env.KROK_GATEWAY_ONLY === '1') {
    console.log('Local gateway ready on 127.0.0.1:8082; attach a separately configured tunnel.');
  } else {
    await tunnel.startAsync({ timeout: 30000 });
    const publicUrl = tunnel.getActiveUrl();
    if (!publicUrl) throw new Error('No ngrok URL');
    await mkdir(path.join(projectRoot, '.expo'), { recursive: true });
    await writeFile(path.join(projectRoot, '.expo', 'tunnel.json'), JSON.stringify({
      publicUrl, expoUrl: publicUrl.replace(/^https:/, 'exps:').replace(/^http:/, 'exp:'),
      gatewayPort: 8082, metroPort: 8081, apiPort: 3001,
    }, null, 2));
    console.log(`ngrok ready: ${publicUrl}`);
    console.log('Set EXPO_PUBLIC_API_URL and EXPO_PACKAGER_PROXY_URL to this URL, then start Expo on port 8081.');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Tunnel startup failed');
  await stop(1);
}
