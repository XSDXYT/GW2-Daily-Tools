import { readFile, writeFile, rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { validateFractalData } from './fractal-schema.mjs';

const root = fileURLToPath(new URL('../src/data/fractals/', import.meta.url));
const names = ['fractals', 'instabilities', 'dailies', 'recommended'];
const meta = JSON.parse(await readFile(resolve(root, 'meta.json'), 'utf8'));
const dryRun = process.argv.includes('--dry-run');
const args = process.argv.slice(2).filter(arg => arg !== '--dry-run');
const revision = args[0] || execFileSync(process.env.GIT_BINARY || 'git', ['ls-remote', 'https://github.com/Invisi/gw2-fotm-instabilities.git', 'refs/heads/master'], { encoding: 'utf8' }).split(/\s+/)[0];
if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('Expected a complete upstream commit SHA');
const patchDate = args[1] || meta.validFrom;
const build = args[2] ? Number(args[2]) : meta.gameBuild;
if (revision !== meta.commit && (!args[1] || !args[2])) throw new Error('For a new upstream revision, supply its game patch date and build: npm run data:update -- <sha> <YYYY-MM-DD> <build>');
if (!/^\d{4}-\d{2}-\d{2}$/.test(patchDate) || !Number.isInteger(build) || build < 1 || Number.isNaN(Date.parse(patchDate)) || new Date(patchDate).toISOString().slice(0, 10) !== patchDate) throw new Error('Invalid patch date or build');
const fetched = await Promise.all(names.map(async name => {
  const response = await fetch(`https://raw.githubusercontent.com/Invisi/gw2-fotm-instabilities/${revision}/${name}.json`, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  return [name, await response.json()];
}));
const dataset = Object.fromEntries(fetched);
validateFractalData(dataset);
if (dryRun) { console.log(`Downloaded and validated ${revision}; no files changed.`); process.exit(0); }
const oldFractals = JSON.parse(await readFile(resolve(root, 'fractals.json'), 'utf8'));
const newEncounters = Object.keys(dataset.fractals.fractal_details).filter(id => !oldFractals.fractal_details[id]);
// All files are downloaded and validated before any live dataset file is replaced.
try {
  for (const name of names) await writeFile(resolve(root, `${name}.json.next`), JSON.stringify(dataset[name], null, 2) + '\n');
  for (const name of names) await rename(resolve(root, `${name}.json.next`), resolve(root, `${name}.json`));
  await writeFile(resolve(root, 'meta.json'), JSON.stringify({ ...meta, commit: revision, validFrom: patchDate, gameBuild: build, retrievedAt: new Date().toISOString().slice(0, 10) }, null, 2) + '\n');
} finally { await Promise.all(names.map(name => rm(resolve(root, `${name}.json.next`), { force: true }))); }
console.log(`Updated and validated upstream ${revision}.`);
console.log('Review the upstream patch date/build in meta.json and the encounter-based challenge-modes.json before release.');
if (newEncounters.length) console.log('New encounters requiring CM/translation review:', newEncounters.join(', '));
