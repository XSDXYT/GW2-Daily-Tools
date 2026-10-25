import { ref } from 'vue';
import messages from './data/messages.json';
import toolMessages from './data/tool-messages';
import raidNames from './data/raid-names-zh.json';
import names from './data/fractals/names-zh.json';
import { fractalDetails, instabilityDetails } from './domain/fractals';
import type { RaidEncounter } from './domain/raids';

export type Language = 'zh' | 'en';
const storageKey = 'gw2-raids-language';
const language = ref<Language>('zh');
try { if (globalThis.localStorage?.getItem(storageKey) === 'en') language.value = 'en'; } catch { /* Private browsing. */ }
const dictionary: Record<Language, Record<string, string>> = { zh: { ...messages.zh, ...toolMessages.zh }, en: { ...messages.en, ...toolMessages.en } };
const raidZh: Record<string, Partial<Record<'boss' | 'instance' | 'bounty', string>>> = raidNames;
const fractalZh: Record<string, string> = names.fractals;
const instabilityZh: Record<string, string> = names.instabilities;

export function translator(lang: Language) {
  return {
    language: lang,
    t(key: string, values: Record<string, string | number> = {}) {
      return (dictionary[lang][key] || dictionary.en[key] || key).replace(/\{(\w+)\}/g, (match, field: string) => values[field] === undefined ? match : String(values[field]));
    },
    dateLabel(date: string, withYear = false) {
      return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', weekday: 'long', ...(withYear ? { year: 'numeric' } : {}) }).format(new Date(date + 'T00:00:00Z'));
    },
    encounter(item: RaidEncounter, field: 'boss' | 'instance' | 'bounty') { return lang === 'zh' ? raidZh[item.id]?.[field] || item[field] : item[field]; },
    fractalName(id: string) { return (lang === 'zh' && fractalZh[id]) || fractalDetails[id]?.name.en || id; },
    instabilityName(id: number) { return (lang === 'zh' && instabilityZh[String(id)]) || instabilityDetails[id]?.name.en || `#${id}`; }
  };
}

function setLanguage(next: Language, persist = true) {
  language.value = next;
  if (typeof document !== 'undefined') document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
  if (persist) { try { globalThis.localStorage?.setItem(storageKey, next); } catch { /* Switching still works. */ } }
}
if (typeof window !== 'undefined') {
  setLanguage(language.value, false);
  window.addEventListener('storage', event => { if (event.key === storageKey) setLanguage(event.newValue === 'en' ? 'en' : 'zh', false); });
}
export function useI18n() {
  return {
    language, setLanguage,
    t: (key: string, values: Record<string, string | number> = {}) => translator(language.value).t(key, values),
    name: (item: RaidEncounter, field: 'boss' | 'instance' | 'bounty') => translator(language.value).encounter(item, field),
    dateLabel: (date: string, year = false) => translator(language.value).dateLabel(date, year),
    fractalName: (id: string) => translator(language.value).fractalName(id),
    instabilityName: (id: number) => translator(language.value).instabilityName(id)
  };
}
