import type { FractalDateQuery, searchFractalDates } from '../domain/fractals';
import { translator, type Language } from '../i18n';

/** Copies the entire result set, including criteria, rather than only the visible page. */
export function fractalSearchCopyText(result: ReturnType<typeof searchFractalDates>, query: FractalDateQuery, language: Language) {
  const I = translator(language);
  return [I.t('reverseTitle'), `${result.start} — ${result.end} · UTC`,
    `${I.t('reverseScope')}: ${I.t('cmView')}`,
    `${I.t('reverseScales')}: ${query.scales?.length ? query.scales.join(', ') : I.t('reverseAllCm')}`,
    `${I.t('reverseInclude')} (${I.t(query.includeMatch === 'any' ? 'reverseIncludeAny' : 'reverseIncludeAll')}): ${query.include?.map(I.instabilityName).join(' / ') || I.t('reverseUnrestricted')}`,
    `${I.t('reverseExclude')}: ${query.exclude?.map(I.instabilityName).join(' / ') || I.t('reverseUnrestricted')}`,
    `${I.t('reverseGroupMatch')}: ${I.t(query.groupMatch === 'all' ? 'reverseGroupAll' : 'reverseGroupAny')}`,
    `${I.t('reverseMaxAr')}: ${query.maxAr === undefined ? I.t('reverseUnrestricted') : query.maxAr}`,
    I.t('reverseSummary', { dates: result.results.length, count: result.results.reduce((sum, day) => sum + day.matches.length, 0) }),
    ...result.results.flatMap(day => ['', `${day.date} · ${I.dateLabel(day.date)}`,
      ...day.matches.map(row => `${row.scale} · ${I.fractalName(row.type)} · ${I.t('fractalAr', { n: row.ar })}: ${row.instabilityIds.map(I.instabilityName).join(' / ') || I.t('noInstabilities')}`)]),
    '', I.t('predictionNote'), I.t('sourceAttribution')].join('\n');
}
