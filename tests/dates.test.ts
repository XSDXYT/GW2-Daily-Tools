import test from 'node:test';
import assert from 'node:assert/strict';
import { dayNumber, dayOffset, utcToday, secondsUntilReset, leapCalendarIndex } from '../src/domain/dates';

test('fractal index resets each year and reserves February 29 in every calendar', () => {
  for (const year of [2024, 2025, 2026, 2100]) {
    assert.equal(leapCalendarIndex(`${year}-01-01`), 0);
    assert.equal(leapCalendarIndex(`${year}-02-28`), 58);
    assert.equal(leapCalendarIndex(`${year}-03-01`), 60);
    assert.equal(leapCalendarIndex(`${year}-12-31`), 365);
  }
  assert.equal(leapCalendarIndex('2024-02-29'), 59);
  assert.equal(leapCalendarIndex('2026-10-25'), 298);
});
test('UTC rollover follows the 08:00 China reset, independent of device timezone', () => {
  const before = new Date('2026-10-25T07:59:59+08:00');
  const after = new Date('2026-10-25T08:00:00+08:00');
  assert.equal(utcToday(before), '2026-10-24');
  assert.equal(utcToday(after), '2026-10-25');
  assert.equal(secondsUntilReset(before), 1);
  assert.equal(secondsUntilReset(after), 86400);
  assert.equal(dayOffset('2026-12-31', 1), '2027-01-01');
});
test('invalid dates cannot silently normalize into another day', () => {
  for (const value of ['', '2025-02-29', '2100-02-29', '2026-02-30', '2026-2-1', '0099-12-31']) assert.throws(() => dayNumber(value), RangeError);
  assert.doesNotThrow(() => dayNumber('2400-02-29'));
});
