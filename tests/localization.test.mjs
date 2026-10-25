import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveOfficialNames } from '../scripts/official-localization.mjs';

const read = path => JSON.parse(readFileSync(new URL('../src/data/' + path, import.meta.url), 'utf8'));
const fractals = read('fractals/fractals.json');
const raids = read('raids.json');
const ids = read('raid-bounty-api-ids.json');
const source = read('official-name-sources.json');
const records = [...Object.values(source.fractals), ...Object.values(source.raidBounties)];
const english = records.map(row => ({ id: row.achievementId, name: row.englishAchievementName }));
const chinese = records.map(row => ({ id: row.achievementId, name: row.chineseAchievementName }));

test('official localization handles both Chinese tier-label positions and all verified identities', () => {
  const result = resolveOfficialNames(fractals, raids, ids, english, chinese);
  assert.equal(Object.keys(result.fractalNames).length, 25);
  assert.equal(Object.keys(result.raidOverrides).length, 36);
  assert.equal(result.fractalNames.solitary_throne, '孤独王座');
  assert.equal(result.fractalNames.silent_surf, '寂静之浪');
  assert.equal(result.fractalNames.deepstone, '深石坑');
  assert.equal(result.fractalSources.solitary_throne.achievementId, 9388);
});
test('official bounty labels cannot overwrite separate boss full names', () => {
  const result = resolveOfficialNames(fractals, raids, ids, english, chinese);
  assert.deepEqual(result.raidOverrides.cairn, { bounty: '凯玲' });
  assert.equal(result.raidOverrides.kaineng.instance, '凯宁瞭望台');
  assert.ok(Object.values(result.raidOverrides).every(row => !Object.hasOwn(row, 'boss')));
  assert.equal(read('raid-names-zh.json').cairn.boss, '不屈的凯玲');
  assert.equal(read('fractals/names-zh.json').instabilities['0'], '怒气迸发');
});
test('mismatched, untranslated or incomplete official responses fail before names can be updated', () => {
  const badEnglish = structuredClone(english);
  badEnglish.find(row => row.id === 9388).name = 'Daily Tier 4 A Different Fractal';
  assert.throws(() => resolveOfficialNames(fractals, raids, ids, badEnglish, chinese), /identity mismatch/);
  const untranslated = structuredClone(chinese);
  untranslated.find(row => row.id === 9388).name = 'Daily Tier 4 Solitary Throne';
  assert.throws(() => resolveOfficialNames(fractals, raids, ids, english, untranslated), /Unrecognized Chinese/);
  assert.throws(() => resolveOfficialNames(fractals, raids, ids, english, chinese.filter(row => row.id !== 9388)), /Missing achievement/);
});
