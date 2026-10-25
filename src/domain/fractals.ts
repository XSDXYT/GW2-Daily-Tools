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
export interface FractalDateQuery {
  /** Empty or omitted selects all challenge modes; only CM scales are accepted. */
  scales?: number[];
  days?: number;
  include?: number[];
  exclude?: number[];
  includeMatch?: 'all' | 'any';
  groupMatch?: 'all' | 'any';
  maxAr?: number;
}
interface Detail { name: { en: string }; scales: number[] }
const details: Record<string, Detail> = fractals.fractal_details;
const schedules: Record<string, number[][]> = instabilities.instabilities;
const cmDates: Record<string, string> = Object.fromEntries([
  ...challengeModes.availableAtSnapshot.map(id => [id, meta.validFrom]),
  ...Object.entries(challengeModes.availableFrom)
]);
export const instabilityDetails = instabilities.instability_details;
export const fractalDetails = details;
export const challengeModeScales = fractals.scales.filter(row =>
  cmDates[row.type] && row.scale === Math.max(...details[row.type].scales)
).sort((a, b) => b.scale - a.scale);

function allFractalsForDate(date: string): FractalRow[] {
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
  })).sort((a, b) => b.scale - a.scale);
}

export function fractalsForDate(date: string, view: FractalView = 'cm'): FractalRow[] {
  return allFractalsForDate(date).filter(row => {
    if (view === 'cm') return row.cm;
    if (view === 'daily') return row.scale > 75 && row.daily;
    const tier = Number(view.slice(1));
    return row.scale > (tier - 1) * 25 && row.scale <= tier * 25;
  });
}

/** A single date snapshot for the homepage, copy text and daily PNG. */
export function dailyFractalsForDate(date: string) {
  dayNumber(date);
  if (date < meta.validFrom) return null;
  const rows = allFractalsForDate(date);
  return {
    challengeModes: rows.filter(row => row.cm),
    dailies: rows.filter(row => row.scale > 75 && row.daily),
    // Recommended achievements require these exact scales, ordered T1 → T3.
    recommended: rows.filter(row => row.recommended).sort((a, b) => a.scale - b.scale)
  };
}

export function upcomingInstability(date: string, scale: number, instabilityId: number, days = 30): string[] {
  if (!Number.isInteger(instabilityId) || !instabilityDetails[instabilityId] || !schedules[String(scale)]) throw new RangeError('Invalid scale or instability');
  return searchFractalDates(date, { scales: [scale], include: [instabilityId], days }).results.map(row => row.date);
}

/** Reverse searches only consider challenge modes available on each date. */
export function searchFractalDates(start: string, query: FractalDateQuery = {}) {
  dayNumber(start);
  if (start < meta.validFrom) throw new RangeError('This dataset does not cover older game versions');
  const { scales = [], days = 30, include = [], exclude = [],
    includeMatch = 'all', groupMatch = 'any', maxAr } = query;
  if (!Number.isInteger(days) || days < 1 || days > 366) throw new RangeError('Invalid search range');
  if (!['all', 'any'].includes(includeMatch) || !['all', 'any'].includes(groupMatch)) throw new RangeError('Invalid matching mode');
  if (scales.some(scale => !Number.isInteger(scale) || !challengeModeScales.some(row => row.scale === scale))) throw new RangeError('Invalid challenge mode scale');
  if ([...include, ...exclude].some(id => !Number.isInteger(id) || !instabilityDetails[id])) throw new RangeError('Invalid instability');
  if (include.some(id => exclude.includes(id))) throw new RangeError('Conflicting instability conditions');
  if (maxAr !== undefined && (!Number.isInteger(maxAr) || maxAr < 0)) throw new RangeError('Invalid agony resistance');
  const availableDays = Math.min(days, dayNumber('9999-12-31') - dayNumber(start) + 1);
  const results: { date: string; matches: FractalRow[]; total: number }[] = [];
  for (let i = 0; i < availableDays; i++) {
    const date = dayOffset(start, i);
    const candidates = allFractalsForDate(date).filter(row => row.cm && (!scales.length || scales.includes(row.scale)));
    // Explicit selections must also be available before the entire group can qualify.
    const total = scales.length ? new Set(scales).size : candidates.length;
    const matches = candidates.filter(row =>
      (maxAr === undefined || row.ar <= maxAr) &&
      !exclude.some(id => row.instabilityIds.includes(id)) &&
      (!include.length || (includeMatch === 'all' ? include.every(id => row.instabilityIds.includes(id)) : include.some(id => row.instabilityIds.includes(id))))
    );
    // An empty candidate group never qualifies, even with "all" selected.
    if (matches.length && (groupMatch === 'any' || matches.length === total)) results.push({ date, matches, total });
  }
  return { start, end: dayOffset(start, availableDays - 1), days: availableDays, results };
}
