import test from 'node:test';
import assert from 'node:assert/strict';
import { siteSource } from '../src/lib/site-url';

test('Pages share attribution resolves the new repository from every page', () => {
  for (const page of ['', 'index.html', 'rotation.html', 'fractals.html']) {
    assert.equal(siteSource(`https://xsdxyt.github.io/GW2-Daily-Tools/${page}?date=2026-10-25#main-content`), 'xsdxyt.github.io/GW2-Daily-Tools/');
  }
});
test('site attribution supports repository renames, custom domains and local subpath previews', () => {
  assert.equal(siteSource('https://example.github.io/another-repo/rotation.html'), 'example.github.io/another-repo/');
  assert.equal(siteSource('https://daily.example.com/index.html'), 'daily.example.com/');
  assert.equal(siteSource('http://127.0.0.1:8766/GW2-Daily-Tools/fractals.html'), '127.0.0.1:8766/GW2-Daily-Tools/');
});
test('missing or unsupported locations have a readable attribution fallback', () => {
  assert.equal(siteSource(undefined), 'GW2 Daily Tools');
  assert.equal(siteSource('file:///tmp/index.html'), 'GW2 Daily Tools');
  assert.equal(siteSource('not-a-url'), 'GW2 Daily Tools');
});
