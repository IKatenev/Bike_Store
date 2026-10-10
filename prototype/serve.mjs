// Local HTTP server for the prototype. Node standard library only.
// Binds to loopback (127.0.0.1) by default; port 4173, override with PORT.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

// Resolve a request URL to a file inside root. Returns null if it would escape.
export function resolvePath(urlPath, root = HERE) {
  let p = String(urlPath).split('?')[0].split('#')[0];
  try { p = decodeURIComponent(p); } catch (err) { return null; }
  if (p === '/' || p === '') p = '/index.html';
  // Reject any parent-directory segment outright (defence in depth).
  if (/(^|[\\/])\.\.([\\/]|$)/.test(p)) return null;
  const rootResolved = path.resolve(root);
  const safeRel = path.normalize(p).replace(/^[/\\]+/, '');
  const full = path.resolve(rootResolved, safeRel);
  if (full !== rootResolved && !full.startsWith(rootResolved + path.sep)) return null;
  return full;
}

export function createServer(root = HERE) {
  return http.createServer(async (req, res) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Method not allowed');
        return;
      }
      const full = resolvePath(req.url || '/', root);
      if (!full) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }
      let target = full;
      const info = await stat(target).catch(() => null);
      if (info && info.isDirectory()) target = path.join(target, 'index.html');
      const data = await readFile(target).catch(() => null);
      if (!data) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }
      const ext = path.extname(target).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      if (req.method === 'HEAD') res.end();
      else res.end(data);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Server error');
    }
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const host = '127.0.0.1';
  const port = Number(process.env.PORT) || 4173;
  createServer().listen(port, host, () => {
    console.log(`Bike Store prototype running at http://${host}:${port}/`);
    console.log('This serves local files only. Press Ctrl+C to stop.');
  });
}
