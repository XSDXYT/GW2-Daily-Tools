const DAY_MS = 86_400_000;

export function dayNumber(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError('Invalid date');
  const [year, month, day] = value.split('-').map(Number);
  if (year < 100 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) throw new RangeError('Invalid date');
  const time = Date.UTC(year, month - 1, day);
  if (new Date(time).toISOString().slice(0, 10) !== value) throw new RangeError('Invalid date');
  return time / DAY_MS;
}

export const dateFromDayNumber = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10);
export const dayOffset = (date: string, amount: number) => dateFromDayNumber(dayNumber(date) + amount);
export const utcToday = (now = new Date()) => now.toISOString().slice(0, 10);
export const positiveMod = (value: number, length: number) => ((value % length) + length) % length;
export const secondsUntilReset = (now = new Date()) => Math.max(0, Math.ceil(((dayNumber(utcToday(now)) + 1) * DAY_MS - now.getTime()) / 1000));

/** Upstream uses a fixed leap-year calendar, not elapsed days modulo 366. */
export function leapCalendarIndex(date: string): number {
  dayNumber(date);
  const [, month, day] = date.split('-').map(Number);
  return (Date.UTC(2024, month - 1, day) - Date.UTC(2024, 0, 1)) / DAY_MS;
}
