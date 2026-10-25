import { ref, computed, onMounted, onUnmounted } from 'vue';
import { utcToday, secondsUntilReset } from './domain/dates';

export function useClock() {
  const now = ref(new Date());
  const refresh = () => { now.value = new Date(); };
  let timer: ReturnType<typeof setInterval>;
  onMounted(() => { timer = setInterval(refresh, 1000); window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh); });
  onUnmounted(() => { clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); });
  return {
    today: computed(() => utcToday(now.value)), refresh,
    countdown: computed(() => { const n = secondsUntilReset(now.value); return [Math.floor(n / 3600), Math.floor(n % 3600 / 60), n % 60].map(x => String(x).padStart(2, '0')).join(':'); })
  };
}
