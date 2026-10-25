import { readFile, stat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const base = new URL('https://example.invalid/GW2-Daily-Tools/');
const checked = new Set();
async function checkAsset(value, owner) {
  if (/^(data:|https?:|#)/i.test(value)) return;
  if (value.startsWith('/')) throw new Error(`Root-relative asset in ${owner}: ${value}`);
  const url = new URL(value, new URL(owner, base));
  if (!url.pathname.startsWith(base.pathname)) throw new Error(`Asset escapes the repository subpath: ${value}`);
  const name = decodeURIComponent(url.pathname.slice(base.pathname.length));
  const target = resolve(dist, name);
  if (relative(dist, target).startsWith('..')) throw new Error(`Asset escapes dist: ${name}`);
  if (!(await stat(target)).isFile()) throw new Error(`Missing built asset: ${name}`);
  if (checked.has(name)) return;
  checked.add(name);
  if (name.endsWith('.css')) {
    const css = await readFile(target, 'utf8');
    for (const match of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/g)) await checkAsset(match[2], name);
  }
}
for (const page of ['index.html', 'rotation.html', 'fractals.html']) {
  const html = await readFile(resolve(dist, page), 'utf8');
  if (/\/src\/|\.vue["']/.test(html)) throw new Error(`${page} still references unbuilt application source`);
  if (!/<script\b[^>]*\bsrc=["'][^"']+\.js["']/i.test(html)) throw new Error(`${page} has no built JavaScript entry`);
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) await checkAsset(match[1], page);
}
console.log(`Pages build passed: 3 entries and ${checked.size} local assets resolve under ${base.pathname}.`);
