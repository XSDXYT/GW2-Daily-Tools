<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from '../i18n';
import { useClock } from '../useClock';
import { bountiesForDate, cycleIndex, rotationDays } from '../domain/raids';
import { dailyCopyText, buildShareModel, type ShareModel, type ShareMode } from '../lib/share';
import { copyText } from '../lib/clipboard';
import DateControls from './DateControls.vue';
import ShareDialog from './ShareDialog.vue';
const props = defineProps<{ page: 'today' | 'rotation' }>();
const { t, name, language, dateLabel } = useI18n();
const { today, countdown, refresh } = useClock();
const selectedDate = ref<string | null>(null);
const displayDate = computed(() => selectedDate.value || today.value);
const items = computed(() => bountiesForDate(displayDate.value));
const days = computed(() => rotationDays(today.value));
const copyState = ref('');
const copying = ref(false);
const copyContent = computed(() => dailyCopyText(displayDate.value, language.value, today.value));
const model = ref<ShareModel | null>(null);
watch(displayDate, () => { copyState.value = ''; });
async function copy() { refresh(); copying.value = true; copyState.value = await copyText(copyContent.value) ? 'copySuccess' : 'copyFailed'; copying.value = false; }
function share(mode: ShareMode) { refresh(); model.value = buildShareModel(mode, mode === 'daily' ? displayDate.value : today.value, language.value, today.value); }
function scrollToDay(index: number) {
  const prefix = matchMedia('(max-width: 780px)').matches ? 'mobile-day-' : 'rotation-day-';
  document.getElementById(prefix + index)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
}
</script>

<template>
  <section v-if="props.page === 'today'" class="today-section" aria-labelledby="today-heading">
    <div class="today-summary">
      <div class="today-heading">
        <div><h1 id="today-heading">{{ t(displayDate === today ? 'today' : 'chosenDay') }}</h1><p class="date-line"><span>{{ dateLabel(displayDate, true) }} · UTC</span><span id="cycle-label">{{ t('cycleLabel', { n: cycleIndex(displayDate) + 1 }) }}</span></p></div>
        <div class="daily-actions"><button class="primary-button" type="button" :disabled="copying" @click="copy">{{ t(copying ? 'copying' : displayDate === today ? 'copy' : 'copySelected') }}</button><button class="secondary-button" type="button" @click="share('daily')">{{ t('shareDaily') }}</button></div>
      </div>
      <p class="reset-line">{{ t('resetRule') }} · {{ t('resetRemaining') }} <span id="countdown" role="timer">{{ countdown }}</span></p>
    </div>
    <DateControls :date="displayDate" :pinned="selectedDate !== null" @select="selectedDate = $event" @today="selectedDate = null" />
    <p v-if="copyState" class="copy-status" role="status">{{ t(copyState) }}</p>
    <div v-if="copyState === 'copyFailed'" class="copy-fallback"><label for="copy-text">{{ t('manualHelp') }}</label><textarea id="copy-text" :value="copyContent" rows="10" readonly /></div>
    <div class="boss-list">
      <article v-for="item in items" :key="item.id" class="boss-row" :class="`group-${item.group}`" :data-number="`0${item.group}`">
        <span class="group-number">{{ t('groupLabel', { n: item.group }) }}</span><h2 class="boss-name">{{ name(item, 'boss') }}</h2>
        <p class="boss-instance"><span class="instance-label">{{ t('instancePrefix') }}</span><span v-if="item.wing" class="instance-wing">W{{ item.wing }}</span>{{ name(item, 'instance') }}</p>
      </article>
    </div>
    <p class="rotation-link"><a href="./rotation.html">{{ t('fullRotation') }}</a></p>
  </section>

  <template v-else>
    <section class="rotation-hero" aria-labelledby="rotation-title"><p class="eyebrow">{{ t('rotationEyebrow') }}</p><h1 id="rotation-title">{{ t('rotation') }}</h1><p>{{ t('rotationIntro') }}</p><div class="rotation-meta"><span>{{ t('periodLabel', { start: days[0].date, end: days[11].date }) }}</span><span>{{ t('rotationToday', { n: cycleIndex(today) + 1 }) }}</span></div></section>
    <div class="cycle-track" :aria-label="t('cycleNav')"><button v-for="day in days" :key="day.date" class="cycle-step" type="button" :aria-current="day.isToday ? 'date' : undefined" :aria-label="t('viewDay', { n: day.index + 1, date: day.date, today: day.isToday ? t('todaySuffix') : '' })" @click="scrollToDay(day.index)"><span>{{ t('day', { n: day.index + 1 }) }}</span><strong>{{ day.date.slice(5) }}</strong><span v-if="day.isToday">{{ t('currentDay') }}</span></button></div>
    <section class="section" :aria-label="t('tableAria')">
      <div class="section-heading table-heading"><h2>{{ t('overview') }}</h2><div class="rotation-actions"><button class="secondary-button" type="button" @click="share('cycle')">{{ t('shareCycle') }}</button><button class="secondary-button" type="button" @click="scrollToDay(cycleIndex(today))">{{ t('jump') }}</button></div></div>
      <div class="table-scroll" role="region" :aria-label="t('scrollTable')" tabindex="0">
        <table class="rotation-table"><thead><tr><th scope="col">{{ t('dateColumn') }}</th><th v-for="n in 4" :key="n" scope="col">{{ t('groupLabel', { n }) }}</th></tr></thead>
          <tbody><tr v-for="day in days" :id="`rotation-day-${day.index}`" :key="day.date" :class="{ 'today-row': day.isToday }"><th scope="row" class="day-heading"><span class="day-number">{{ t('day', { n: day.index + 1 }) }}</span><strong class="day-date">{{ day.date.slice(5) }}</strong><span class="day-week">{{ dateLabel(day.date) }}</span><span v-if="day.isToday" class="today-chip">{{ t('currentDay') }}</span></th>
            <td v-for="item in day.items" :key="item.group" class="rotation-cell" :class="`group-${item.group}`"><strong class="rotation-boss">{{ name(item, 'boss') }}</strong><div class="rotation-instance"><span class="mini-wing">{{ item.wing ? `W${item.wing}` : t('independent') }}</span>{{ name(item, 'instance') }}</div><div v-if="item.bounty !== item.boss" class="rotation-bounty">{{ t('bountyLabel', { name: name(item, 'bounty') }) }}</div></td>
          </tr></tbody>
        </table>
      </div>
      <div class="mobile-rotation"><article v-for="day in days" :id="`mobile-day-${day.index}`" :key="day.date" class="mobile-rotation-day" :class="{ 'mobile-rotation-today': day.isToday }"><div class="mobile-day-heading"><div><span class="mobile-day-count">{{ t('day', { n: day.index + 1 }) }}</span><strong>{{ dateLabel(day.date) }}</strong></div><span v-if="day.isToday" class="today-chip">{{ t('currentDay') }}</span></div><div v-for="item in day.items" :key="item.group" class="mobile-rotation-row" :class="`group-${item.group}`"><span class="mobile-group">{{ t('groupLabel', { n: item.group }) }}</span><div class="mobile-rotation-row-main"><strong>{{ name(item, 'boss') }}</strong><span>{{ item.wing ? `W${item.wing} · ` : '' }}{{ name(item, 'instance') }}</span><small v-if="item.bounty !== item.boss">{{ t('bountyLabel', { name: name(item, 'bounty') }) }}</small></div></div></article></div>
      <p class="table-footnote">{{ t('footnote') }}</p>
    </section>
    <p class="rotation-link"><a href="./index.html">{{ t('backLink') }}</a></p>
  </template>
  <ShareDialog :model="model" @close="model = null" />
</template>
