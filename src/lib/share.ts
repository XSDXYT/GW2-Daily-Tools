import { bountiesForDate, currentCycleStart, cycleIndex } from '../domain/raids';
import { dayNumber, dayOffset, utcToday } from '../domain/dates';
import { translator, type Language } from '../i18n';
import { siteSource } from './site-url';
import { buildDailyFractalModel } from './daily-fractals';

export type ShareMode = 'daily' | 'cycle';
export function buildShareModel(mode: ShareMode, date: string, language: Language, today = utcToday()) {
  if (!['daily', 'cycle'].includes(mode)) throw new RangeError('Invalid image mode');
  dayNumber(date); dayNumber(today);
  const I = translator(language);
  const start = mode === 'cycle' ? currentCycleStart(date) : date;
  const end = mode === 'cycle' ? dayOffset(start, 11) : start;
  dayNumber(end);
  return {
    mode, language, start, end,
    raidTitle: I.t('dailyRaidsHeading'),
    raidCycle: mode === 'daily' ? I.t('cycleLabel', { n: cycleIndex(date) + 1 }) : '',
    fractals: mode === 'daily' ? buildDailyFractalModel(date, language) : null,
    days: Array.from({ length: mode === 'cycle' ? 12 : 1 }, (_, index) => {
      const value = dayOffset(start, index);
      return {
        date: value, day: I.t('day', { n: String(cycleIndex(value) + 1).padStart(2, '0') }), isToday: value === today,
        items: bountiesForDate(value).map(item => ({
          group: item.group, label: I.t('groupLabel', { n: item.group }), boss: I.encounter(item, 'boss'),
          instance: `${item.wing == null ? '' : `W${item.wing} · `}${I.encounter(item, 'instance')}`,
          bounty: item.bounty !== item.boss ? I.t('bountyLabel', { name: I.encounter(item, 'bounty') }) : ''
        }))
      };
    }),
    title: I.t(mode === 'cycle' ? 'exportCycleTitle' : 'exportDailyTitle'),
    subtitle: mode === 'cycle' ? I.t('exportCycleSubtitle', { start, end }) : I.t('exportDailySubtitle', { date }),
    footer: I.t('exportFooter'), todayLabel: I.t('currentDay'), instanceLabel: I.t('instanceColumn'),
    columns: [I.t('dateColumn'), ...[1, 2, 3, 4].map(n => I.t('groupLabel', { n }))],
    source: siteSource(),
    alt: mode === 'cycle' ? I.t('exportAltCycle', { start, end }) : I.t('exportAltDaily', { date }),
    filename: `gw2-${mode === 'cycle' ? 'rotation' : 'daily'}-${start}${mode === 'cycle' ? `_${end}` : ''}-${language}.png`
  };
}
export type ShareModel = ReturnType<typeof buildShareModel>;

export function dailyCopyText(date: string, language: Language, today = utcToday()): string {
  const I = translator(language);
  const fractals = buildDailyFractalModel(date, language);
  return [I.t(date === today ? 'copyHeading' : 'copyHeadingSelected', { date }), '', I.t('dailyRaidsHeading'), ...bountiesForDate(date).flatMap((item, i) => [
    I.t('copyBoss', { n: i + 1, name: I.encounter(item, 'boss') }),
    I.t('copyInstance', { name: `${item.wing == null ? '' : `W${item.wing} · `}${I.encounter(item, 'instance')}` })
  ]), '', fractals.title, fractals.note,
  ...(fractals.unavailable ? [fractals.unavailable] : fractals.sections.flatMap(section => [
    '', section.title,
    ...section.items.flatMap(item => [
      `${item.scale} · ${item.name} · ${item.ar}${item.badges.length ? ` · ${item.badges.join(' / ')}` : ''}`,
      `   ${item.instabilities.join(' / ') || item.noInstabilities}`
    ])
  ])), '', fractals.attribution].join('\n');
}
