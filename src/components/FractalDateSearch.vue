<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from '../i18n';
import { challengeModeScales, fractalSource, instabilityDetails, searchFractalDates } from '../domain/fractals';
import { copyText } from '../lib/clipboard';
import { fractalSearchCopyText } from '../lib/fractal-search';

const props = defineProps<{ date: string }>();
const emit = defineEmits<{ select: [date: string] }>();
const { t, language, dateLabel, fractalName, instabilityName } = useI18n();
const opened = ref(false);
const initialized = ref(false);
const scales = ref<number[]>([]);
const range = ref('30');
const customDays = ref<number | string>(14);
const days = computed(() => Number(range.value === 'custom' ? customDays.value : range.value));
const include = ref<number[]>([]);
const exclude = ref<number[]>([]);
const includeMatch = ref<'all' | 'any'>('all');
const groupMatch = ref<'all' | 'any'>('any');
const maxAr = ref<number | string>('');
const page = ref(1);
const status = ref('');
const copying = ref(false);
const resultHeading = ref<HTMLElement>();
const scaleOptions = computed(() => challengeModeScales.map(row => ({ scale: row.scale, name: fractalName(row.type) })));
const options = computed(() => instabilityDetails.map((_, id) => ({ id, label: instabilityName(id) })));
const invalidAr = computed(() => maxAr.value !== '' && (!Number.isInteger(Number(maxAr.value)) || Number(maxAr.value) < 0));
const invalidDays = computed(() => !Number.isInteger(days.value) || days.value < 1 || days.value > 366);
const query = computed(() => ({
  scales: scales.value, days: days.value, include: include.value, exclude: exclude.value,
  includeMatch: includeMatch.value, groupMatch: groupMatch.value,
  maxAr: maxAr.value === '' ? undefined : Number(maxAr.value)
}));
const result = computed(() => !opened.value || props.date < fractalSource.validFrom || invalidAr.value || invalidDays.value ? null : searchFractalDates(props.date, query.value));
const totalMatches = computed(() => result.value?.results.reduce((sum, day) => sum + day.matches.length, 0) || 0);
// Keep a page near 30 fractal rows, while preserving complete date groups.
const pageSize = computed(() => Math.min(5, Math.max(1, Math.floor(30 / Math.max(1, ...(result.value?.results.map(day => day.matches.length) || []))))));
const pages = computed(() => Math.max(1, Math.ceil((result.value?.results.length || 0) / pageSize.value)));
const visibleDays = computed(() => result.value?.results.slice((page.value - 1) * pageSize.value, page.value * pageSize.value) || []);
const copyContent = computed(() => result.value ? fractalSearchCopyText(result.value, query.value, language.value) : '');
watch(result, () => { page.value = 1; status.value = ''; });
watch(language, () => { status.value = ''; });

function toggle(event: Event) {
  opened.value = (event.target as HTMLDetailsElement).open;
  if (opened.value) initialized.value = true;
}
function add(event: Event, target: 'scales' | 'include' | 'exclude') {
  const input = event.target as HTMLSelectElement;
  if (input.value === '') return;
  const value = Number(input.value);
  const destination = target === 'scales' ? scales : target === 'include' ? include : exclude;
  if (!destination.value.includes(value)) destination.value = [...destination.value, value];
  input.value = '';
}
function reset() {
  scales.value = []; range.value = '30'; customDays.value = 14; include.value = []; exclude.value = [];
  includeMatch.value = 'all'; groupMatch.value = 'any'; maxAr.value = '';
}
async function copy() {
  const content = copyContent.value;
  copying.value = true;
  const success = await copyText(content);
  status.value = content === copyContent.value ? (success ? 'copied' : 'copyManual') : '';
  copying.value = false;
}
async function changePage(next: number) {
  page.value = Math.max(1, Math.min(next, pages.value));
  await nextTick();
  resultHeading.value?.focus({ preventScroll: true });
  resultHeading.value?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
}
</script>

<template>
  <details class="reverse-disclosure" @toggle="toggle">
    <summary><h2 id="reverse-heading">{{ t('reverseTitle') }}<span class="reverse-disclosure-action" aria-hidden="true">{{ t(opened ? 'reverseCollapse' : 'reverseExpand') }}</span></h2></summary>
    <section v-if="initialized" class="reverse-panel" aria-labelledby="reverse-heading">
    <div class="reverse-heading">
      <div><p class="fractal-help">{{ t('reverseHelp') }}</p></div>
      <button class="secondary-button" type="button" @click="reset">{{ t('reverseReset') }}</button>
    </div>
    <div class="reverse-conditions">
      <div class="reverse-field"><label for="reverse-days">{{ t('reverseDays') }}</label><select id="reverse-days" v-model="range" name="reverse-days"><option v-for="n in [7, 30, 90, 180, 366]" :key="n" :value="String(n)">{{ t('reverseDayCount', { n }) }}</option><option value="custom">{{ t('reverseCustomRange') }}</option></select><template v-if="range === 'custom'"><label for="reverse-custom-days">{{ t('reverseCustomDays') }}</label><input id="reverse-custom-days" v-model.number="customDays" name="reverse-custom-days" type="number" min="1" max="366" step="1" inputmode="numeric" autocomplete="off" :aria-invalid="invalidDays" :aria-describedby="invalidDays ? 'reverse-days-error' : undefined"><p v-if="invalidDays" id="reverse-days-error" class="date-error" role="status">{{ t('reverseInvalidDays') }}</p></template></div>
      <div class="reverse-field">
        <label for="reverse-scale-add">{{ t('reverseScales') }}</label>
        <select id="reverse-scale-add" name="reverse-scale-add" value="" aria-describedby="reverse-cm-help" @change="add($event, 'scales')"><option value="" disabled>{{ t('reverseAddScale') }}</option><option v-for="option in scaleOptions" :key="option.scale" :value="option.scale" :disabled="scales.includes(option.scale)">{{ option.scale }} · {{ option.name }}</option></select>
        <p id="reverse-cm-help" class="fractal-help">{{ t('reverseAllCmHint') }}</p>
        <ul class="query-chips"><li v-for="scale in scales" :key="scale"><button type="button" :aria-label="t('reverseRemove', { name: String(scale) })" @click="scales = scales.filter(value => value !== scale)">{{ scale }} · {{ scaleOptions.find(option => option.scale === scale)?.name }} <span aria-hidden="true">×</span></button></li></ul>
      </div>
    </div>
    <div class="reverse-conditions">
      <div class="reverse-field"><label for="reverse-include">{{ t('reverseInclude') }}</label><select id="reverse-include" name="reverse-include" value="" @change="add($event, 'include')"><option value="" disabled>{{ t('reverseAddInclude') }}</option><option v-for="option in options" :key="option.id" :value="option.id" :disabled="include.includes(option.id) || exclude.includes(option.id)">{{ option.label }}</option></select>
        <ul class="query-chips include-chips"><li v-for="id in include" :key="id"><button type="button" :aria-label="t('reverseRemove', { name: instabilityName(id) })" @click="include = include.filter(value => value !== id)">{{ t('reverseIncludeChip', { name: instabilityName(id) }) }} <span aria-hidden="true">×</span></button></li></ul>
      </div>
      <div class="reverse-field"><label for="reverse-exclude">{{ t('reverseExclude') }}</label><select id="reverse-exclude" name="reverse-exclude" value="" @change="add($event, 'exclude')"><option value="" disabled>{{ t('reverseAddExclude') }}</option><option v-for="option in options" :key="option.id" :value="option.id" :disabled="include.includes(option.id) || exclude.includes(option.id)">{{ option.label }}</option></select>
        <ul class="query-chips exclude-chips"><li v-for="id in exclude" :key="id"><button type="button" :aria-label="t('reverseRemove', { name: instabilityName(id) })" @click="exclude = exclude.filter(value => value !== id)">{{ t('reverseExcludeChip', { name: instabilityName(id) }) }} <span aria-hidden="true">×</span></button></li></ul>
      </div>
    </div>
    <div class="reverse-controls">
      <div class="reverse-field"><label for="reverse-include-match">{{ t('reverseIncludeMatch') }}</label><select id="reverse-include-match" v-model="includeMatch" name="reverse-include-match"><option value="all">{{ t('reverseIncludeAll') }}</option><option value="any">{{ t('reverseIncludeAny') }}</option></select></div>
      <div class="reverse-field"><label for="reverse-group-match">{{ t('reverseGroupMatch') }}</label><select id="reverse-group-match" v-model="groupMatch" name="reverse-group-match"><option value="any">{{ t('reverseGroupAny') }}</option><option value="all">{{ t('reverseGroupAll') }}</option></select></div>
      <div class="reverse-field"><label for="reverse-max-ar">{{ t('reverseMaxAr') }}</label><input id="reverse-max-ar" v-model.number="maxAr" name="reverse-max-ar" type="number" min="0" step="1" inputmode="numeric" autocomplete="off" :placeholder="t('reverseUnrestricted')" :aria-invalid="invalidAr" :aria-describedby="invalidAr ? 'reverse-ar-error' : undefined"><p v-if="invalidAr" id="reverse-ar-error" class="date-error" role="status">{{ t('reverseInvalidAr') }}</p></div>
    </div>
    <p class="fractal-help">{{ t('reverseLogicHelp') }}</p>
    <div ref="resultHeading" class="reverse-result-heading" tabindex="-1">
      <div><p v-if="result" class="reverse-range">{{ result.start }} — {{ result.end }} · UTC</p><p class="fractal-help" role="status">{{ t('reverseSummary', { dates: result?.results.length || 0, count: totalMatches }) }}</p></div>
      <button class="secondary-button" type="button" :disabled="copying || !totalMatches" @click="copy">{{ t(copying ? 'copying' : 'reverseCopy') }}</button>
    </div>
    <p v-if="status" class="copy-status" role="status">{{ t(status) }}</p>
    <div v-if="status === 'copyManual'" class="copy-fallback"><label for="reverse-copy-text">{{ t('manualHelp') }}</label><textarea id="reverse-copy-text" :value="copyContent" rows="8" readonly /></div>
    <p v-if="!visibleDays.length" class="empty-state">{{ t(invalidAr ? 'reverseInvalidAr' : invalidDays ? 'reverseInvalidDays' : props.date < fractalSource.validFrom ? 'dataOlder' : 'reverseEmpty', { date: fractalSource.validFrom }) }}</p>
    <div v-else class="reverse-results">
      <article v-for="day in visibleDays" :key="day.date" class="reverse-day">
        <div class="reverse-day-heading"><div><h3>{{ dateLabel(day.date, true) }}</h3><p>{{ t('reverseDayMatches', { n: day.matches.length, total: day.total }) }}</p></div><button class="language-toggle" type="button" :aria-label="t('showDate', { date: day.date })" @click="emit('select', day.date)">{{ t('reverseViewDate') }}</button></div>
        <div class="fractal-grid"><div v-for="row in day.matches" :key="row.scale" class="fractal-card reverse-match">
          <div class="fractal-identity"><span class="fractal-scale">{{ row.scale }}</span><div class="fractal-name"><h4>{{ fractalName(row.type) }}</h4><p class="fractal-ar">{{ t('fractalAr', { n: row.ar }) }}</p></div><div class="fractal-badges"><span>CM</span></div></div>
          <ul v-if="row.instabilityIds.length" class="instability-list"><li v-for="id in row.instabilityIds" :key="id" :class="{ 'matched-instability': include.includes(id) }"><span class="instability-dot" aria-hidden="true"></span>{{ instabilityName(id) }}</li></ul><p v-else class="fractal-no-instabilities">{{ t('noInstabilities') }}</p>
        </div></div>
      </article>
    </div>
    <nav v-if="pages > 1" class="reverse-pagination" :aria-label="t('reversePagination')"><button class="language-toggle" type="button" :disabled="page <= 1" @click="changePage(page - 1)">{{ t('reversePrevious') }}</button><span>{{ t('reversePage', { page, pages }) }}</span><button class="language-toggle" type="button" :disabled="page >= pages" @click="changePage(page + 1)">{{ t('reverseNext') }}</button></nav>
    </section>
  </details>
</template>
