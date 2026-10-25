import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyFractalsForDate, searchFractalDates, type FractalDateQuery } from '../src/domain/fractals';
import { fractalSearchCopyText } from '../src/lib/fractal-search';

const scalesOn = (query: FractalDateQuery) => searchFractalDates('2026-10-25', { ...query, days: 1 }).results[0]?.matches.map(row => row.scale) || [];

test('combination search requires all or any instability within each individual fractal', () => {
  // Snapshot fixture: 94=[15,7,10], 95=[7,0,1] on 2026-10-25.
  assert.deepEqual(scalesOn({ scales: [94, 95], include: [7, 0] }), [95]);
  assert.deepEqual(scalesOn({ scales: [94, 95], include: [7, 0], includeMatch: 'any' }), [95, 94]);
  assert.deepEqual(scalesOn({ scales: [94, 95], include: [0, 15] }), []);
  assert.deepEqual(scalesOn({ scales: [94, 95], include: [0, 15], includeMatch: 'any', groupMatch: 'all' }), [95, 94]);
  assert.deepEqual(scalesOn({ scales: [94, 95], include: [0], exclude: [1] }), []);
  assert.deepEqual(scalesOn({ scales: [94, 95], exclude: [0] }), [94]);
  assert.deepEqual(scalesOn({ scales: [94, 95], include: [], includeMatch: 'any' }), [95, 94]);
});

test('whole-group matching never silently drops an excluded or inaccessible fractal', () => {
  assert.deepEqual(scalesOn({ exclude: [0] }), [100, 99, 98, 97, 96, 94]);
  assert.deepEqual(scalesOn({ exclude: [0], groupMatch: 'all' }), []);
  assert.deepEqual(scalesOn({ maxAr: 139 }), [94]);
  assert.deepEqual(scalesOn({ maxAr: 149, groupMatch: 'all' }), []);
  assert.equal(scalesOn({ maxAr: 150, groupMatch: 'all' }).length, 7);
  assert.deepEqual(scalesOn({ scales: [94, 94], groupMatch: 'all' }), [94]);
});

test('searches only cover challenge modes, with empty selections meaning every CM', () => {
  const result = searchFractalDates('2026-10-25', { days: 15 });
  assert.equal(result.results.length, 15);
  for (const day of result.results) {
    assert.deepEqual(day.matches.map(row => row.scale), [100, 99, 98, 97, 96, 95, 94]);
    assert.ok(day.matches.every(row => row.cm));
    assert.equal(day.total, 7);
  }
  assert.deepEqual(scalesOn({ scales: [] }), [100, 99, 98, 97, 96, 95, 94]);
  assert.deepEqual(scalesOn({ scales: [94, 95] }), [95, 94]);
  assert.deepEqual(scalesOn({ maxAr: 0 }), []);
});

test('date scope includes every calendar day and re-evaluates CM release dates', () => {
  const query = { scales: [94], days: 7 };
  assert.deepEqual(searchFractalDates('2026-10-25', query).results.map(row => row.date), ['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31']);
  const release = searchFractalDates('2026-09-28', { days: 2 });
  assert.deepEqual(release.results.map(day => day.matches.length), [6, 7]);
  assert.deepEqual(searchFractalDates('2026-09-28', { days: 2, maxAr: 139 }).results.map(day => day.date), ['2026-09-29']);
  assert.deepEqual(searchFractalDates('2026-09-28', { scales: [94], days: 2 }).results.map(day => day.date), ['2026-09-29']);
  const selectedGroup = searchFractalDates('2026-09-28', { scales: [94, 95], days: 2, groupMatch: 'all' });
  assert.deepEqual(selectedGroup.results.map(day => [day.date, day.total]), [['2026-09-29', 2]]);
  assert.equal(searchFractalDates('2026-09-28', { scales: [94, 95], days: 1 }).results[0].total, 2);
  assert.equal(searchFractalDates('2026-10-25', { days: 366 }).days, 366);
});

test('search uses leap-calendar schedules across years and handles the final supported calendar date', () => {
  const end = searchFractalDates('9999-12-31', { days: 366 });
  assert.equal(end.end, '9999-12-31');
  assert.equal(end.days, 1);
  assert.equal(end.results.length, 1);
  assert.deepEqual(searchFractalDates('2026-12-31', { days: 2 }).results.map(row => row.date), ['2026-12-31', '2027-01-01']);
  for (const start of ['2027-02-28', '2028-02-28']) {
    const result = searchFractalDates(start, { scales: [94], days: 3 });
    for (const day of result.results) assert.deepEqual(day.matches[0], dailyFractalsForDate(day.date)!.challengeModes.find(row => row.scale === 94));
  }
});

test('invalid, conflicting or incomplete search conditions fail explicitly', () => {
  for (const query of [
    { days: 0 }, { days: 367 }, { days: 1.5 }, { scales: [1] }, { scales: [50] }, { scales: [93] }, { scales: [101] }, { scales: [1.5] },
    { include: [999] }, { exclude: [-1] }, { include: [0], exclude: [0] }, { maxAr: -1 }, { maxAr: 1.5 },
    { groupMatch: 'bad' }, { includeMatch: 'bad' }
  ]) assert.throws(() => searchFractalDates('2026-10-25', query as FractalDateQuery), RangeError);
  assert.throws(() => searchFractalDates('2026-09-14'), RangeError);
  assert.throws(() => searchFractalDates('bad-date'), RangeError);
});

test('copied searches include every date and row, with bilingual conditions and prediction attribution', () => {
  const query: FractalDateQuery = { scales: [94], days: 30, exclude: [0], maxAr: 150, groupMatch: 'all' };
  const result = searchFractalDates('2026-10-25', query);
  assert.ok(result.results.length > 5);
  for (const language of ['en', 'zh'] as const) {
    const text = fractalSearchCopyText(result, query, language);
    assert.ok(text.includes('2026-10-25 — 2026-11-23 · UTC'));
    assert.ok(text.includes(language === 'zh' ? '排除的异变: 怒气迸发' : 'Excluded instabilities: Adrenaline Rush'));
    assert.ok(text.includes(language === 'zh' ? '整组关卡全部符合' : 'Every fractal must match'));
    assert.ok(text.includes(language === 'zh' ? '查询范围: 挑战模式' : 'Search scope: Challenge modes'));
    assert.ok(!text.includes(language === 'zh' ? '星期（按 UTC 日期）:' : 'Days of week (UTC):'));
    assert.ok(text.includes('150'));
    assert.ok(text.includes('CC BY-NC 4.0'));
    for (const day of result.results) {
      assert.ok(text.includes(day.date));
      for (const row of day.matches) assert.ok(text.includes(`${row.scale} · `));
    }
  }
  const zeroAr = fractalSearchCopyText(searchFractalDates('2026-10-25', { days: 1, maxAr: 0 }), { maxAr: 0 }, 'en');
  assert.ok(zeroAr.includes('My available AR: 0'));
  assert.ok(zeroAr.includes('All challenge modes'));
  assert.ok(zeroAr.includes('0 dates · 0 matching fractals'));
});
