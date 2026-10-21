'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const names = ['universos', 'portal', 'laboratorio', 'sistemas', 'manifiesto', 'contacto'];

test('every Black Water page has a unique canonical, Open Graph URL and WebPage schema', () => {
  const observed = new Set();
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');

  for (const name of names) {
    const html = fs.readFileSync(path.join(root, name + '.html'), 'utf8');
    const canonical = 'https://noiacore.com/' + name + '.html';
    assert.ok(sitemap.includes(canonical), 'page missing from sitemap: ' + name);
    assert.match(html, new RegExp('<link rel="canonical" href="' + canonical.replaceAll('.', '\\.') + '"'));
    assert.ok(html.includes('<meta property="og:url" content="' + canonical + '"'));
    assert.match(html, /<meta property="og:title" content="NOIACORE/);
    assert.match(html, /<meta name="twitter:card" content="summary"/);

    const jsonLd = html.match(/<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/);
    assert.ok(jsonLd, 'structured page metadata missing: ' + name);
    const schema = JSON.parse(jsonLd[1]);
    assert.equal(schema['@context'], 'https://schema.org');
    assert.equal(schema['@type'], name === 'contacto' ? 'ContactPage' : 'WebPage');
    assert.equal(schema.url, canonical);
    assert.equal(schema.isPartOf['@id'], 'https://noiacore.com/#website');
    assert.equal(schema.publisher['@id'], 'https://noiacore.com/#organization');
    assert.ok(!observed.has(schema.url), 'duplicate canonical URL');
    observed.add(schema.url);
  }
  assert.equal(observed.size, names.length);
});

test('NAVE does not claim to be a generative chatbot', () => {
  const portal = fs.readFileSync(path.join(root, 'portal.html'), 'utf8');
  const data = portal.match(/<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/);
  assert.ok(data);
  const schema = JSON.parse(data[1]);
  assert.match(schema.description, /sin chatbot generativo/);
});
