import { dailyFractalsForDate, fractalSource, type FractalRow } from '../domain/fractals';
import { translator, type Language } from '../i18n';

/** Localized content shared by the homepage and both sharing formats. */
export function buildDailyFractalModel(date: string, language: Language) {
  const I = translator(language);
  const summary = dailyFractalsForDate(date);
  const section = (id: string, title: string, rows: FractalRow[]) => ({
    id, title,
    items: rows.map(row => ({
      scale: row.scale,
      name: I.fractalName(row.type),
      ar: I.t('fractalAr', { n: row.ar }),
      badges: id === 'cm' && row.daily ? [I.t('dailyView')] : id === 'daily' && row.cm ? ['CM'] : [],
      instabilities: row.instabilityIds.map(I.instabilityName),
      noInstabilities: I.t('noInstabilities')
    }))
  });
  return {
    title: I.t('dailyFractalsHeading'),
    note: `${I.t('dataVersion', { date: fractalSource.validFrom })} · ${I.t('predictionShort')}`,
    attribution: I.t('sourceAttribution'),
    unavailable: summary ? '' : I.t('dataOlder', { date: fractalSource.validFrom }),
    sections: summary ? [
      section('cm', I.t('cmView'), summary.challengeModes),
      section('daily', I.t('dailyView'), summary.dailies),
      section('recommended', I.t('recommendedHeading'), summary.recommended)
    ] : []
  };
}
