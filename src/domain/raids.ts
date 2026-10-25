import data from '../data/raids.json';
import { dayNumber, dateFromDayNumber, dayOffset, positiveMod } from './dates';

export interface RaidEncounter { id: string; group: number; bounty: string; boss: string; instance: string; wing: number | null }
const encounters: Record<string, Omit<RaidEncounter, 'id' | 'group'>> = data.encounters;
const anchor = dayNumber(data.anchorDate);
export const cycleIndex = (date: string) => positiveMod(dayNumber(date) - anchor, 12);
export const currentCycleStart = (date: string) => dateFromDayNumber(anchor + Math.floor((dayNumber(date) - anchor) / 12) * 12);
export function bountiesForDate(date: string): RaidEncounter[] {
  const index = cycleIndex(date);
  return data.groups.map((group, i) => { const id = group[index % group.length]; return { id, group: i + 1, ...encounters[id] }; });
}
export const rotationDays = (date: string) => Array.from({ length: 12 }, (_, i) => {
  const value = dayOffset(currentCycleStart(date), i);
  return { date: value, index: i, items: bountiesForDate(value), isToday: value === date };
});
