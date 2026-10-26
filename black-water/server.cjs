'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname);
// Resolve symlinked installation roots before validating served file boundaries.
const canonicalRoot = fs.realpathSync(root);
const port = Number.parseInt(process.env.PORT || '8099', 10);
const host = process.env.HOST || '127.0.0.1';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};
const headers = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
};
function resolveUrl(input) {
  let pathname;
  try { pathname = decodeURIComponent(new URL(input, 'http://local').pathname); }
  catch { return null; }
  if (pathname.includes('\0') || pathname.includes('\\')) return null;
  const safePath = path.resolve(root, '.' + pathname);
  if (safePath !== root && !safePath.startsWith(root + path.sep)) return null;
  return safePath === root ? path.join(root, 'index.html') : safePath;
}
const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { ...headers, Allow: 'GET, HEAD' });
    res.end();
    return;
  }
  const filepath = resolveUrl(req.url || '/');
  if (!filepath || /(^|[\\/])\.[^\\/]+/.test(path.relative(root, filepath))) {
    res.writeHead(403, headers); res.end('Forbidden'); return;
  }
  // A lexical path check alone does not stop symlinks that point outside
  // the static root. Resolve on disk before checking the final target.
  fs.realpath(filepath, (realError, realPath) => {
    if (realError) {
      res.writeHead(404, { ...headers, 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('NOIACORE · 404');
      return;
    }
    if (realPath !== canonicalRoot && !realPath.startsWith(canonicalRoot + path.sep)) {
      res.writeHead(403, headers); res.end('Forbidden'); return;
    }
    fs.stat(realPath, (error, stat) => {
      if (error || !stat.isFile()) {
        res.writeHead(404, { ...headers, 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('NOIACORE · 404');
        return;
      }
      const extension = path.extname(realPath).toLowerCase();
      const type = types[extension];
      if (!type) { res.writeHead(403, headers); res.end(); return; }
      res.writeHead(200, {
        ...headers,
        'Content-Type': type,
        'Content-Length': stat.size,
        'Cache-Control': 'no-cache'
      });
      if (req.method === 'HEAD') { res.end(); return; }
      const stream = fs.createReadStream(realPath);
      stream.on('error', () => res.destroy());
      stream.pipe(res);
    });
  });
});
if (require.main === module) {
  server.listen(port, host, () => {
    console.log(`NOIACORE BLACK WATER → http://${host}:${port}`);
    console.log('Local only. No third-party platform, telemetry or external calls.');
  });
}
module.exports = { server, resolveUrl, headers };
