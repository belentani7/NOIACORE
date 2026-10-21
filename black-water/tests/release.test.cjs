'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('semantic organization and NAVE identity are machine-readable', () => {
  const home = read('index.html');
  const match = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(match, 'JSON-LD required for discovery');
  const data = JSON.parse(match[1]);
  assert.equal(data['@context'], 'https://schema.org');
  assert.ok(data['@graph'].some((entity) => entity['@type'] === 'Organization' && entity.name === 'NOIACORE LAB'));
  assert.ok(data['@graph'].some((entity) => entity['@type'] === 'SoftwareApplication' && /no es un chatbot generativo/.test(entity.description)));
  assert.match(home, /name="description"/);
  assert.match(home, /property="og:title"/);
});
test('sitemap references every shipped page and never a non-existent route', () => {
  const sitemap = read('sitemap.xml');
  const pages = ['/', '/universos.html', '/portal.html', '/laboratorio.html', '/sistemas.html', '/manifiesto.html', '/contacto.html'];
  for (const uri of pages) {
    assert.ok(sitemap.includes('https://noiacore.com' + uri));
    if (uri !== '/') assert.ok(fs.existsSync(path.join(root, uri.slice(1))));
  }
  assert.match(read('robots.txt'), /Sitemap: https:\/\/noiacore\.com\/sitemap\.xml/);
});
test('Linux container runs as an unprivileged user', () => {
  assert.match(read('Dockerfile'), /\bUSER node\b/);
  assert.match(read('Dockerfile'), /HEALTHCHECK/);
  assert.match(read('docker-compose.yml'), /read_only:\s*true/);
  assert.match(read('docker-compose.yml'), /no-new-privileges:true/);
});
