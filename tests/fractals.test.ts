import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyFractalsForDate, fractalsForDate, upcomingInstability } from '../src/domain/fractals';
import { dayOffset, leapCalendarIndex } from '../src/domain/dates';
import { translator } from '../src/i18n';
import { validateFractalData } from '../scripts/fractal-schema.mjs';
import fractals from '../src/data/fractals/fractals.json';
import instabilities from '../src/data/fractals/instabilities.json';
import dailies from '../src/data/fractals/dailies.json';
import recommended from '../src/data/fractals/recommended.json';

test('upstream snapshot is internally complete across all 100 scales and 366 calendar slots', () => {
  assert.equal(validateFractalData({ fractals, instabilities, dailies, recommended }), true);
  const incomplete = structuredClone(instabilities);
  incomplete.instabilities['94'].pop();
  assert.throws(() => validateFractalData({ fractals, instabilities: incomplete, dailies, recommended }), /Incomplete schedule/);
});
test('new Solitary Throne is scale 94 and becomes the seventh CM on September 29', () => {
  assert.equal(fractalsForDate('2026-09-28').length, 6);
  const rows = fractalsForDate('2026-09-29');
  assert.equal(rows.length, 7);
  assert.equal(rows.find(row => row.scale === 94)?.type, 'solitary_throne');
  assert.equal(rows.find(row => row.scale === 95)?.type, 'kinfall');
  assert.equal(fractalsForDate('2026-10-25', 'T4').find(row => row.scale === 93)?.type, 'cliffside');
});
test('each tier returns its own instability count and daily results resolve current scale mappings', () => {
  for (const [view, count] of [['T1', 0], ['T2', 1], ['T3', 2], ['T4', 3]] as const) {
    const rows = fractalsForDate('2026-10-25', view);
    assert.equal(rows.length, 25);
    assert.ok(rows.every(row => row.instabilityIds.length === count));
  }
  const rows = fractalsForDate('2026-10-25', 'daily');
  assert.equal(rows.length, 3);
  assert.ok(rows.every(row => row.daily && row.scale > 75));
  assert.throws(() => fractalsForDate('2026-09-14'), RangeError);
});
test('the same month and day retains its instability tuple across years', () => {
  const a = fractalsForDate('2026-10-25');
  const b = fractalsForDate('2027-10-25');
  assert.deepEqual(a.map(row => row.instabilityIds), b.map(row => row.instabilityIds));
  // Fixed fixture from upstream e7bef51, calendar index 298 (not the old elapsed-day index 297).
  assert.deepEqual(a.map(row => [row.scale, row.instabilityIds]), [
    [100, [4, 10, 6]], [99, [14, 2, 12]], [98, [6, 5, 2]], [97, [10, 9, 14]],
    [96, [9, 11, 13]], [95, [7, 0, 1]], [94, [15, 7, 10]]
  ]);
});
test('homepage summary preserves all CMs, T4 dailies and the three exact recommended scales', () => {
  const dates = [
    ...Array.from({ length: 15 }, (_, i) => dayOffset('2026-10-15', i)),
    '2026-09-15', '2026-09-28', '2026-09-29', '2026-12-31', '2027-01-01',
    '2027-02-28', '2027-03-01', '2028-02-28', '2028-02-29', '2028-03-01'
  ];
  for (const date of dates) {
    const summary = dailyFractalsForDate(date)!;
    assert.deepEqual(summary.challengeModes, fractalsForDate(date, 'cm'));
    assert.deepEqual(summary.dailies, fractalsForDate(date, 'daily'));
    assert.equal(summary.dailies.length, 3);
    const expected = recommended.recommended[leapCalendarIndex(date) % 15].map(row => row.scale);
    assert.deepEqual(summary.recommended.map(row => row.scale), expected, date);
    assert.deepEqual(summary.recommended.map(row => row.instabilityIds.length), [0, 1, 2]);
    for (const row of summary.recommended) {
      assert.equal(row.recommended, true);
      assert.deepEqual(row, fractalsForDate(date, `T${Math.ceil(row.scale / 25)}` as 'T1' | 'T2' | 'T3').find(item => item.scale === row.scale));
    }
  }
  assert.equal(dailyFractalsForDate('2026-09-14'), null);
  assert.throws(() => dailyFractalsForDate('not-a-date'), RangeError);
});

test('reverse lookup handles instability zero, crosses years, and validates its bounds', () => {
  const dates = upcomingInstability('2026-10-25', 94, 0);
  assert.deepEqual(dates, ['2026-10-26', '2026-11-05', '2026-11-09', '2026-11-16', '2026-11-19']);
  for (const date of dates) assert.ok(fractalsForDate(date).find(row => row.scale === 94)!.instabilityIds.includes(0));
  assert.doesNotThrow(() => upcomingInstability('2026-12-28', 94, 9));
  assert.doesNotThrow(() => upcomingInstability('9999-12-31', 94, 9));
  assert.throws(() => upcomingInstability('2026-10-25', 101, 0), RangeError);
  assert.throws(() => upcomingInstability('2026-10-25', 94, 999), RangeError);
});
test('official Chinese labels preserve English and unresolved identity fallbacks', () => {
  assert.equal(translator('zh').fractalName('solitary_throne'), '孤独王座');
  assert.equal(translator('en').fractalName('solitary_throne'), 'Solitary Throne');
  assert.equal(translator('zh').fractalName('future_untranslated_fractal'), 'future_untranslated_fractal');
  assert.equal(translator('en').instabilityName(0), 'Adrenaline Rush');
  assert.equal(translator('zh').instabilityName(0), '怒气迸发');
  assert.equal(translator('zh').t('navFractals'), '碎层异变');
});
