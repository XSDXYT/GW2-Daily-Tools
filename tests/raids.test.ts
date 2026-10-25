import test from 'node:test';
import assert from 'node:assert/strict';
import { bountiesForDate, currentCycleStart, cycleIndex, rotationDays } from '../src/domain/raids';
import { dailyCopyText } from '../src/lib/share';

test('migrated raids retain the anchor, negative offsets, 12-day cycle and four targets', () => {
  assert.equal(cycleIndex('2026-10-15'), 0);
  assert.equal(cycleIndex('2026-10-14'), 11);
  assert.equal(currentCycleStart('2026-10-27'), '2026-10-27');
  assert.deepEqual(bountiesForDate('2026-10-15').map(row => row.id), ['shiverpeaks', 'aetherblade', 'slothasor', 'qadim']);
  assert.deepEqual(bountiesForDate('2026-10-15'), bountiesForDate('2026-10-27'));
  assert.equal(rotationDays('2026-10-25').flatMap(day => day.items).length, 48);
});
test('copy models preserve selected dates, Chinese names, instance wings and English fallback', () => {
  const zh = dailyCopyText('2026-10-25', 'zh');
  assert.match(zh, /2026-10-25 UTC/);
  assert.match(zh, /信仰要塞/);
  assert.match(zh, /4\. Boss：德姆/);
  assert.match(zh, /W5/);
  assert.match(dailyCopyText('2026-10-25', 'en'), /Keep Construct/);
});
