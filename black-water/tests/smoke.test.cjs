'use strict';
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { server } = require('../server.cjs');

const root = path.resolve(__dirname, '..');
const pages = ['index', 'universos', 'portal', 'laboratorio', 'sistemas', 'manifiesto', 'contacto'];
const scripts = ['content', 'i18n', 'core', 'water', 'eye', 'nave', 'atlas', 'lab', 'regex-worker'];
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
let origin;

async function setupServer() {
  if (origin) return origin;
  if (server.listening) {
    const addr = server.address();
    origin = `http://127.0.0.1:${addr.port}`;
    return origin;
  }
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const addr = server.address();
  origin = `http://127.0.0.1:${addr.port}`;
  return origin;
}

async function get(uri, method = 'GET') {
  const base = await setupServer();
  const url = new URL(uri, base);
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({
        status: res.statusCode,
        headers: res.headers,
        body: Buffer.concat(chunks).toString('utf8')
      }));
    });
    req.on('error', reject);
    req.end();
  });
}

after(async () => {
  if (server.listening) await new Promise((resolve) => server.close(resolve));
});

test('every real HTML page has semantic structure and metadata', () => {
  for (const page of pages) {
    const text = read(page + '.html');
    assert.match(text, /<!doctype html>/i, page);
    assert.match(text, /<main\s+id="main"/i, page);
    assert.match(text, /<h1\b/i, page);
    assert.match(text, /<nav\b[^>]*aria-label/i, page);
    assert.match(text, /<title>NOIACORE/i, page);
    assert.match(text, /<footer\b/i, page);
    assert.match(text, /name="viewport"/i, page);
    assert.match(text, /href="assets\/css\/base.css"/, page);
    assert.match(text, /src="assets\/js\/nave.js"/, page);
  }
});

test('navigation target HTMLs are present, no third-party scripts', () => {
  for (const page of pages) {
    const html = read(page + '.html');
    assert.doesNotMatch(html, /<script\b[^>]*\bsrc="https?:\/\//i);
    for (const tag of html.matchAll(/<link\b[^>]*>/gi)) {
      // Canonical and hreflang URLs are metadata, not third-party network dependencies.
      if (/\brel="(?:stylesheet|preload|modulepreload|preconnect|dns-prefetch)"/i.test(tag[0])) {
        assert.doesNotMatch(tag[0], /\bhref="https?:\/\//i, `${page}: remote asset dependency`);
      }
    }
    for (const match of html.matchAll(/\bhref="([a-z-]+\.html)(?:#[^"]+)?"/g)) {
      assert.ok(fs.existsSync(path.join(root, match[1])), `${page}: ${match[1]}`);
    }
    for (const match of html.matchAll(/\b(?:src|href)="(assets\/[^"]+)"/g)) {
      assert.ok(fs.existsSync(path.join(root, match[1])), `${page}: ${match[1]}`);
    }
  }
});

test('substantive original implementation exceeds 3000 source lines', () => {
  const dirs = ['.', 'assets/css', 'assets/js', 'assets/data'];
  const lines = dirs.flatMap((folder) => {
    return fs.readdirSync(path.join(root, folder), { withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.(html|css|js|cjs)$/.test(entry.name))
      .map((entry) => read(path.join(folder, entry.name)).split('\n').length);
  });
  assert.ok(lines.reduce((sum, next) => sum + next, 0) > 3000);
});

test('functional UI engines and local toolset are embedded', () => {
  const water = read('assets/js/water.js');
  const eye = read('assets/js/eye.js');
  const nave = read('assets/js/nave.js');
  const lab = read('assets/js/lab.js');
  assert.match(water, /getContext\('webgl'/);
  assert.match(water, /gl\.drawArrays/);
  assert.match(eye, /pointermove|mousemove/);
  assert.match(nave, /function interpret/);
  assert.match(nave, /Señales|confidence/);
  assert.match(lab, /csvToJson/);
  assert.match(lab, /jsonToCsv/);
  assert.match(lab, /b64Encode/);
  assert.match(lab, /contrast\(/);
  const count = [...lab.matchAll(/^\s*tool\('[a-z0-9-]+'/gm)].length;
  assert.equal(count, 32);
  for (const engine of scripts) {
    assert.ok(fs.existsSync(path.join(root, engine === 'content' ? 'assets/data/content.js' : `assets/js/${engine}.js`)));
  }
});

test('server serves all independent pages successfully', async () => {
  for (const page of pages) {
    const response = await get('/' + page + '.html');
    assert.equal(response.status, 200, page);
    assert.match(response.headers['content-type'], /text\/html/);
    assert.match(response.body, /<h1\b/);
    assert.match(response.headers['content-security-policy'], /default-src 'self'/);
  }
});

test('server root, assets and HEAD are handled correctly', async () => {
  const home = await get('/');
  assert.equal(home.status, 200);
  assert.match(home.body, /BLACK WATER/);
  const asset = await get('/assets/css/base.css');
  assert.equal(asset.status, 200);
  assert.match(asset.body, /--milky/);
  const worker = await get('/assets/js/regex-worker.js');
  assert.equal(worker.status, 200);
  assert.match(worker.headers['content-type'], /javascript/);
  const head = await get('/index.html', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
});

test('server rejects unsafe methods, missing routes and private inputs', async () => {
  assert.equal((await get('/does-not-exist.html')).status, 404);
  assert.equal((await get('/index.html', 'POST')).status, 405);
  assert.equal((await get('/.git/config')).status, 403);
  assert.equal((await get('/server.cjs')).status, 403);
  assert.equal((await get('/%5cprivate%5csecret')).status, 403);
  assert.equal((await get('/..%2f..%2fetc%2fpasswd')).status, 403);
});

test('static server refuses a symlink that escapes its public root', async (t) => {
  const os = require('node:os');
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'noia-isolation-'));
  const target = path.join(scratch, 'private.html');
  const link = path.join(root, 'test-symlink-outside.html');
  try {
    fs.writeFileSync(target, 'sensitive content - never public');
    try {
      fs.symlinkSync(target, link);
    } catch (err) {
      if (err.code === 'EPERM') {
        // Windows sin privilegio de symlinks no puede montar este escenario;
        // la cobertura se mantiene en CI (ubuntu-latest), donde el test sí corre.
        t.skip('symlink creation not permitted on this platform');
        return;
      }
      throw err;
    }
    const response = await get('/test-symlink-outside.html');
    assert.equal(response.status, 403);
    assert.doesNotMatch(response.body, /sensitive content/);
  } finally {
    fs.rmSync(link, { force: true });
    fs.rmSync(scratch, { force: true, recursive: true });
  }
});

test('server response has no analytics and blocks unnecessary capabilities', async () => {
  const response = await get('/');
  assert.match(response.headers['permissions-policy'], /camera=\(\)/);
  assert.match(response.headers['permissions-policy'], /microphone=\(\)/);
  assert.match(response.headers['referrer-policy'], /no-referrer/);
  assert.match(response.headers['x-content-type-options'], /nosniff/);
});
