<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from '../i18n';
import { useClock } from '../useClock';
import { dayNumber, dayOffset } from '../domain/dates';
import { fractalsForDate, fractalSource, instabilityDetails, type FractalView } from '../domain/fractals';
import { copyText } from '../lib/clipboard';
import DateControls from './DateControls.vue';
import FractalDateSearch from './FractalDateSearch.vue';
const { t, language, dateLabel, fractalName, instabilityName } = useI18n();
const { today, countdown, refresh } = useClock();
const selectedDate = ref<string | null>(null);
const date = computed(() => selectedDate.value || today.value);
const view = ref<FractalView>('cm');
const search = ref('');
const filterId = ref('');
const status = ref('');
const copying = ref(false);
const supported = computed(() => date.value >= fractalSource.validFrom);
const rows = computed(() => {
  if (!supported.value) return [];
  const query = search.value.toLocaleLowerCase();
  return fractalsForDate(date.value, view.value).filter(row =>
    (filterId.value === '' || row.instabilityIds.includes(Number(filterId.value))) &&
    (!query || `${row.scale} ${fractalName(row.type)} ${row.type}`.toLocaleLowerCase().includes(query))
  ).sort((a, b) => a.scale - b.scale);
});
const options = computed(() => instabilityDetails.map((_, id) => ({ id, label: instabilityName(id) })));
const copyContent = computed(() => [t('fractalCopyHeading', { date: date.value }), ...rows.value.map(row => `${row.scale} · ${fractalName(row.type)}: ${row.instabilityIds.map(instabilityName).join(' / ') || t('noInstabilities')}`)].join('\n'));
watch([date, view, search, filterId, language], () => { status.value = ''; });
async function copy() { refresh(); copying.value = true; status.value = await copyText(copyContent.value) ? 'copied' : 'copyManual'; copying.value = false; }
function shift(amount: number) {
  try { const value = dayOffset(date.value, amount); dayNumber(value); if (value >= fractalSource.validFrom) selectedDate.value = value; } catch { /* Boundaries remain on the last valid date. */ }
}
</script>

<template>
  <section class="fractal-section" aria-labelledby="fractals-heading">
    <div class="today-summary fractal-summary">
      <div class="fractal-titlebar">
        <h1 id="fractals-heading">{{ t('fractalsHeading') }}</h1>
        <button class="secondary-button" type="button" :disabled="copying || !rows.length" @click="copy">{{ t(copying ? 'copying' : 'copyFractals') }}</button>
      </div>
      <div class="fractal-heading-meta">
        <p class="date-line">{{ dateLabel(date, true) }} · UTC</p>
        <p class="reset-line">{{ t('resetRemaining') }} <span id="countdown" role="timer" :aria-label="t('resetTimer')">{{ countdown }}</span></p>
      </div>
    </div>
    <div class="fractal-date-bar">
      <DateControls :date="date" :pinned="selectedDate !== null" :min="fractalSource.validFrom" @select="selectedDate = $event" @today="selectedDate = null">
        <button class="language-toggle" type="button" :disabled="date <= fractalSource.validFrom" @click="shift(-1)">{{ t('previousDay') }}</button>
        <button class="language-toggle" type="button" :disabled="date >= '9999-12-31'" @click="shift(1)">{{ t('nextDay') }}</button>
      </DateControls>
      <p class="dataset-stamp">{{ t('dataVersion', { date: fractalSource.validFrom }) }} · {{ t('predictionShort') }}</p>
    </div>
    <p v-if="!supported" class="date-error" role="status">{{ t('dataOlder', { date: fractalSource.validFrom }) }}</p>
    <div class="fractal-query-bar">
      <div class="fractal-view-tabs" role="group" :aria-label="t('fractalsHeading')">
        <button v-for="mode in (['cm', 'daily', 'T4', 'T3', 'T2', 'T1'] as FractalView[])" :key="mode" type="button" :aria-pressed="view === mode" @click="view = mode">{{ mode === 'cm' ? t('cmView') : mode === 'daily' ? t('dailyView') : t('tierView', { n: mode.slice(1) }) }}</button>
      </div>
      <div class="fractal-filters">
        <div><label for="fractal-search">{{ t('fractalSearch') }}</label><input id="fractal-search" v-model.trim="search" type="search" name="fractal-search" autocomplete="off" :placeholder="t('fractalSearchPlaceholder')"></div>
        <div><label for="instability-filter">{{ t('filterInstability') }}</label><select id="instability-filter" v-model="filterId" name="instability-filter"><option value="">{{ t('allInstabilities') }}</option><option v-for="option in options" :key="option.id" :value="String(option.id)">{{ option.label }}</option></select></div>
        <p class="result-count" role="status">{{ t('resultCount', { n: rows.length }) }}</p>
      </div>
    </div>
    <p v-if="status" class="copy-status" role="status">{{ t(status) }}</p>
    <div v-if="status === 'copyManual'" class="copy-fallback"><label for="fractal-copy-text">{{ t('manualHelp') }}</label><textarea id="fractal-copy-text" :value="copyContent" rows="10" readonly /></div>
    <div v-if="rows.length" class="fractal-grid">
      <article v-for="row in rows" :key="row.scale" class="fractal-card" :class="{ 'new-fractal': row.type === 'solitary_throne' }">
        <div class="fractal-identity">
          <span class="fractal-scale">{{ row.scale }}</span>
          <div class="fractal-name"><h2>{{ fractalName(row.type) }}</h2><p class="fractal-ar">{{ t('fractalAr', { n: row.ar }) }}</p></div>
          <div class="fractal-badges"><span v-if="row.cm">CM</span><span v-if="row.daily">{{ t('dailyBadge') }}</span><span v-if="row.recommended">{{ t('recommendedBadge') }}</span></div>
        </div>
        <ul v-if="row.instabilityIds.length" class="instability-list"><li v-for="id in row.instabilityIds" :key="id"><span class="instability-dot" aria-hidden="true"></span>{{ instabilityName(id) }}</li></ul>
        <p v-else class="fractal-no-instabilities">{{ t('noInstabilities') }}</p>
      </article>
    </div>
    <p v-else class="empty-state">{{ t('noResults') }}</p>

    <FractalDateSearch :date="date" @select="selectedDate = $event" />
    <details class="source-details"><summary>{{ t('sourceDetails') }} · {{ t('dataVersion', { date: fractalSource.validFrom }) }}</summary><p>{{ t('predictionNote') }}</p><p>{{ t('sourceExplain') }}</p><p>{{ t('sourceFallback') }}</p><p><a :href="fractalSource.repository" target="_blank" rel="noopener noreferrer">{{ t('sourceAttribution') }}</a> · <a :href="fractalSource.licenseUrl" target="_blank" rel="noopener noreferrer">CC BY-NC 4.0</a></p><p><a href="https://api.guildwars2.com/v2/achievements/9388?lang=zh" target="_blank" rel="noopener noreferrer">{{ t('officialApiSource') }} ↗</a> · <a href="https://www.guildwars2.com/en/news/code-of-creation-concludes-visions-of-eternity-on-september-15/" target="_blank" rel="noopener noreferrer">{{ t('releaseSource') }} ↗</a></p></details>
  </section>
</template>
