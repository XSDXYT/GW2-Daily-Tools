export function validateFractalData({ fractals, instabilities, dailies, recommended }) {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  assert(Array.isArray(fractals.scales) && fractals.scales.length === 100, 'Expected 100 fractal scales');
  assert(instabilities.instability_details?.length >= 18, 'Missing instability definitions');
  for (let scale = 1; scale <= 100; scale++) {
    const row = fractals.scales.find(item => item.scale === scale);
    assert(row && Number.isFinite(row.ar) && row.ar >= 0, `Invalid scale ${scale}`);
    const detail = fractals.fractal_details[row.type];
    assert(detail?.name?.en && detail.scales.includes(scale), `Missing encounter for scale ${scale}`);
    if (scale <= 25) continue;
    const table = instabilities.instabilities[String(scale)];
    assert(Array.isArray(table) && table.length === 366, `Incomplete schedule at scale ${scale}`);
    const count = Math.ceil(scale / 25) - 1;
    for (const ids of table) {
      assert(Array.isArray(ids) && ids.length === count && new Set(ids).size === count, `Invalid instability tuple at scale ${scale}`);
      assert(ids.every(id => Number.isInteger(id) && instabilities.instability_details[id]?.name?.en), `Unknown instability at scale ${scale}`);
    }
  }
  for (const [id, detail] of Object.entries(fractals.fractal_details)) {
    assert(detail.scales.every(scale => fractals.scales.find(row => row.scale === scale)?.type === id), `Inconsistent scale mapping for ${id}`);
  }
  assert(dailies.dailies?.length === 15, 'Invalid daily rotation');
  assert(dailies.dailies.every(day => day.length === 3 && day.every(id => fractals.fractal_details[id])), 'Unknown daily encounter');
  assert(recommended.recommended?.length === 15, 'Invalid recommended rotation');
  assert(recommended.recommended.every(day => day.length === 3 && day.every(row => Number.isInteger(row.scale) && row.scale >= 1 && row.scale <= 75)), 'Invalid recommended scale');
  return true;
}
