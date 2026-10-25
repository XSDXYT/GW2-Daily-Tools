<script setup lang="ts">
import { useI18n } from '../i18n';
defineProps<{ page: 'today' | 'rotation' | 'fractals' }>();
const { t, language, setLanguage } = useI18n();
const pages = [{ id: 'today', href: './index.html', label: 'navToday' }, { id: 'rotation', href: './rotation.html', label: 'navRotation' }, { id: 'fractals', href: './fractals.html', label: 'navFractals' }];
</script>

<template>
  <header class="site-header">
    <a class="brand" href="./index.html" :aria-label="t('homeAria')">
      <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><path d="m20 3 15 9v16l-15 9L5 28V12Z" stroke="currentColor"/><path d="m12 27 5-14 3 6 3-6 5 14-8-5Z" fill="currentColor"/></svg></span>
      <span class="brand-copy"><strong>GW2 <span>TOOLS</span></strong><small>{{ t('toolsTagline') }}</small></span>
    </a>
    <nav class="nav" :aria-label="t('nav')">
      <a v-for="item in pages" :key="item.id" :href="item.href" class="nav-link" :class="{ active: page === item.id }" :aria-current="page === item.id ? 'page' : undefined">{{ t(item.label) }}</a>
    </nav>
    <button id="language-toggle" class="language-toggle" type="button" :aria-label="t('switchLanguage')" :lang="language === 'zh' ? 'en' : 'zh-CN'" @click="setLanguage(language === 'zh' ? 'en' : 'zh')">{{ language === 'zh' ? 'English' : '中文' }}</button>
  </header>
</template>
