export const API_BASE = 'https://api.guildwars2.com/v2';
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const normalize = value => value.normalize('NFKC').replace(/[’‘]/g, "'").trim();

function indexRecords(rows, language) {
  assert(Array.isArray(rows), `Invalid ${language} API response`);
  const map = new Map();
  for (const row of rows) {
    assert(Number.isInteger(row.id) && typeof row.name === 'string', `Invalid ${language} achievement`);
    assert(!map.has(row.id), `Duplicate ${language} achievement ${row.id}`);
    map.set(row.id, row);
  }
  return map;
}

/** Validate the English identity before deriving a Chinese label from that same achievement ID. */
export function resolveOfficialNames(fractalData, raidData, raidIds, englishRows, chineseRows) {
  const en = indexRecords(englishRows, 'English');
  const zh = indexRecords(chineseRows, 'Chinese');
  const fractalNames = {}, raidOverrides = {}, fractalSources = {}, raidSources = {};
  function resolve(id, expectedEnglish, pattern, key) {
    const english = en.get(id), chinese = zh.get(id);
    assert(english && chinese, `Missing achievement ${id} for ${key}`);
    assert(normalize(english.name) === normalize(expectedEnglish), `English identity mismatch for ${key} (${id})`);
    const match = pattern.exec(chinese.name);
    const value = (match?.[1] || match?.[2] || '').trim();
    assert(value && /[\u4e00-\u9fff]/u.test(value), `Unrecognized Chinese achievement name for ${key} (${id})`);
    return {
      value,
      source: {
        achievementId: id, englishAchievementName: english.name, chineseAchievementName: chinese.name,
        label: value, englishUrl: `${API_BASE}/achievements/${id}?lang=en`, chineseUrl: `${API_BASE}/achievements/${id}?lang=zh`
      }
    };
  }
  for (const [id, detail] of Object.entries(fractalData.fractal_details)) {
    const scale = Math.max(...detail.scales);
    const row = fractalData.scales.find(item => item.scale === scale && item.type === id);
    assert(row, `Missing highest scale for ${id}`);
    const result = resolve(row.daily_achievement_id, `Daily Tier 4 ${detail.name.en}`, /^日常(?:(.+)4级|4级(.+))$/u, id);
    fractalNames[id] = result.value;
    fractalSources[id] = { ...result.source, fields: ['fractalName'], method: 'Remove the daily/tier label from the official achievement name' };
  }
  for (const [id, encounter] of Object.entries(raidData.encounters)) {
    assert(Number.isInteger(raidIds[id]), `Missing verified raid achievement ID for ${id}`);
    const result = resolve(raidIds[id], `Raid Bounty: ${encounter.bounty}`, /^大型地下城赏金[：:]\s*(.+)$/u, id);
    const fields = ['bounty'];
    raidOverrides[id] = { bounty: result.value };
    // An encounter/instance may share the bounty identity. A boss's full NPC name is a separate field.
    if (encounter.instance === encounter.bounty) { raidOverrides[id].instance = result.value; fields.push('instance'); }
    raidSources[id] = { ...result.source, fields, method: 'Remove the bounty label; preserve the existing boss full name' };
  }
  return { fractalNames, raidOverrides, fractalSources, raidSources };
}
