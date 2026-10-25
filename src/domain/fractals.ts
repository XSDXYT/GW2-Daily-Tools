import fractals from '../data/fractals/fractals.json';
import instabilities from '../data/fractals/instabilities.json';
import dailies from '../data/fractals/dailies.json';
import recommended from '../data/fractals/recommended.json';
import challengeModes from '../data/fractals/challenge-modes.json';
import meta from '../data/fractals/meta.json';
import { dayNumber, dayOffset, leapCalendarIndex } from './dates';

export { meta as fractalSource };
export interface FractalScale { scale: number; type: string; ar: number; daily_achievement_id: number }
export interface FractalRow extends FractalScale { instabilityIds: number[]; cm: boolean; daily: boolean; recommended: boolean }
export type FractalView = 'cm' | 'daily' | 'T4' | 'T3' | 'T2' | 'T1';
interface Detail { name: { en: string }; scales: number[] }
const details: Record<string, Detail> = fractals.fractal_details;
const schedules: Record<string, number[][]> = instabilities.instabilities;
const cmDates: Record<string, string> = Object.fromEntries([
  ...challengeModes.availableAtSnapshot.map(id => [id, meta.validFrom]),
  ...Object.entries(challengeModes.availableFrom)
]);
export const instabilityDetails = instabilities.instability_details;
export const fractalDetails = details;

export function fractalsForDate(date: string, view: FractalView = 'cm'): FractalRow[] {
  dayNumber(date);
  if (date < meta.validFrom) throw new RangeError('This dataset does not cover older game versions');
  const index = leapCalendarIndex(date);
  const dailyTypes = dailies.dailies[index % dailies.dailies.length];
  const recommendedScales = recommended.recommended[index % recommended.recommended.length].map(row => row.scale);
  return fractals.scales.map(row => ({
    ...row,
    instabilityIds: row.scale <= 25 ? [] : [...schedules[String(row.scale)][index]],
    // CM capability belongs to an encounter, never to a hard-coded scale range.
    cm: Boolean(cmDates[row.type] && date >= cmDates[row.type] && row.scale === Math.max(...details[row.type].scales)),
    daily: dailyTypes.includes(row.type),
    recommended: recommendedScales.includes(row.scale)
  })).filter(row => {
    if (view === 'cm') return row.cm;
    if (view === 'daily') return row.scale > 75 && row.daily;
    const tier = Number(view.slice(1));
    return row.scale > (tier - 1) * 25 && row.scale <= tier * 25;
  }).sort((a, b) => b.scale - a.scale);
}

export function upcomingInstability(date: string, scale: number, instabilityId: number, days = 30): string[] {
  if (!Number.isInteger(days) || days < 1 || days > 366) throw new RangeError('Invalid search range');
  if (!Number.isInteger(instabilityId) || !instabilityDetails[instabilityId] || !schedules[String(scale)]) throw new RangeError('Invalid scale or instability');
  const availableDays = Math.min(days, dayNumber('9999-12-31') - dayNumber(date) + 1);
  return Array.from({ length: availableDays }, (_, i) => dayOffset(date, i)).filter(value =>
    fractalsForDate(value, `T${Math.ceil(scale / 25)}` as FractalView).find(row => row.scale === scale)?.instabilityIds.includes(instabilityId)
  );
}
