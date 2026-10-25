<script setup lang="ts">
import { ref } from 'vue';
import { dayNumber } from '../domain/dates';
import { useI18n } from '../i18n';
const props = withDefaults(defineProps<{ date: string; pinned: boolean; min?: string }>(), { min: '0100-01-01' });
const emit = defineEmits<{ select: [date: string]; today: [] }>();
const { t } = useI18n();
const invalid = ref(false);
function change(event: Event) {
  const input = event.target as HTMLInputElement;
  try {
    dayNumber(input.value);
    if (input.value < props.min || input.value > '9999-12-31') throw new RangeError('Out of range');
    invalid.value = false;
    emit('select', input.value);
  } catch { invalid.value = true; input.value = props.date; }
}
</script>

<template>
  <div class="date-toolbar">
    <label for="bounty-date">{{ t('chooseDate') }}</label>
    <input id="bounty-date" type="date" :value="date" :min="min" max="9999-12-31" required :aria-invalid="invalid" :aria-describedby="invalid ? 'date-error' : undefined" @change="change">
    <button id="return-today" class="language-toggle" type="button" :disabled="!pinned" @click="invalid = false; emit('today')">{{ t('returnToday') }}</button>
    <slot />
  </div>
  <p v-if="invalid" id="date-error" class="date-error" role="status">{{ min === '0100-01-01' ? t('invalidDate') : t('dataOlder', { date: min }) }}</p>
</template>
