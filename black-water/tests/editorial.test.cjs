'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pages = ['index','universos','portal','laboratorio','sistemas','manifiesto','contacto'];
test('seven Black Water pages share usable editorial navigation', () => {
  const stylesheet = fs.readFileSync(path.join(root, 'assets/css/editorial.css'), 'utf8');
  assert.match(stylesheet, /prefers-reduced-motion/);
  for (const page of pages) {
    const content = fs.readFileSync(path.join(root, page + '.html'), 'utf8');
    assert.match(content, /href="assets\/css\/editorial\.css"/, page);
    assert.match(content, /<section class="editorial-section shell"/, page);
    assert.match(content, /aria-labelledby="[^"]+"/, page);
    assert.match(content, /<main id="main">/);
    assert.ok(content.indexOf('editorial-section') < content.indexOf('</main>'));
    const ids = [...content.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.length, new Set(ids).size, 'duplicate IDs: ' + page);
  }
});
test('editorial links target a real sibling page or on-page anchor', () => {
  for (const page of pages) {
    const content = fs.readFileSync(path.join(root, page + '.html'), 'utf8');
    const block = content.match(/<section class="editorial-section shell"[\s\S]*?<\/section>/);
    assert.ok(block, 'no editorial region: ' + page);
    for (const m of block[0].matchAll(/href="([^"]+)"/g)) {
      const href = m[1];
      if (href.startsWith('#')) assert.ok(content.includes('id="' + href.slice(1) + '"'));
      else assert.ok(fs.existsSync(path.join(root, href)), 'broken link: ' + page + ': ' + href);
    }
  }
});
