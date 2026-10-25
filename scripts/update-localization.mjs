import { readFile, writeFile, rename, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { API_BASE, resolveOfficialNames } from './official-localization.mjs';

const root = fileURLToPath(new URL('../src/data/', import.meta.url));
const read = async file => JSON.parse(await readFile(resolve(root, file), 'utf8'));
const [fractals, raids, raidIds, oldFractalNames, oldRaidNames] = await Promise.all([
  read('fractals/fractals.json'), read('raids.json'), read('raid-bounty-api-ids.json'), read('fractals/names-zh.json'), read('raid-names-zh.json')
]);
const fractalIds = Object.entries(fractals.fractal_details).map(([id, detail]) => fractals.scales.find(row => row.type === id && row.scale === Math.max(...detail.scales)).daily_achievement_id);
const ids = [...new Set([...fractalIds, ...Object.values(raidIds)])];
async function fetchLanguage(language) {
  const records = [];
  for (let offset = 0; offset < ids.length; offset += 200) {
    const url = `${API_BASE}/achievements?ids=${ids.slice(offset, offset + 200).join(',')}&lang=${language}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`Official API ${language}: HTTP ${response.status}`);
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error(`Invalid official API ${language} response`);
    records.push(...batch);
  }
  return records;
}
const [english, chinese] = await Promise.all([fetchLanguage('en'), fetchLanguage('zh')]);
const result = resolveOfficialNames(fractals, raids, raidIds, english, chinese);
const counts = `${Object.keys(result.fractalNames).length} fractal names and ${Object.keys(result.raidOverrides).length} raid bounty names`;
if (process.argv.includes('--dry-run')) { console.log(`Validated ${counts}; no files changed.`); process.exit(0); }
const mergedRaids = structuredClone(oldRaidNames);
for (const [id, fields] of Object.entries(result.raidOverrides)) mergedRaids[id] = { ...mergedRaids[id], ...fields };
const files = {
  'fractals/names-zh.json': { ...oldFractalNames, fractals: { ...oldFractalNames.fractals, ...result.fractalNames } },
  'raid-names-zh.json': mergedRaids,
  'official-name-sources.json': {
    schemaVersion: 1, source: API_BASE, retrievedAt: new Date().toISOString().slice(0, 10), languages: ['en', 'zh'],
    fractals: result.fractalSources, raidBounties: result.raidSources,
    unresolved: { instabilityNames: 'Existing community translations; EVTC IDs are not exposed in the public skill ID list', bossFullNames: 'Existing curated translations; bounty labels do not establish full NPC names' }
  }
};
// Fetch and validate everything before replacing any existing local dictionary.
try {
  for (const [file, value] of Object.entries(files)) await writeFile(resolve(root, `${file}.next`), JSON.stringify(value, null, 2) + '\n');
  for (const file of Object.keys(files)) await rename(resolve(root, `${file}.next`), resolve(root, file));
} finally { await Promise.all(Object.keys(files).map(file => rm(resolve(root, `${file}.next`), { force: true }))); }
console.log(`Updated ${counts}. Existing boss full names and instability translations were preserved.`);
