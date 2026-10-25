<script setup lang="ts">
import { watchEffect } from 'vue';
import AppHeader from './components/AppHeader.vue';
import RaidPage from './components/RaidPage.vue';
import FractalsPage from './components/FractalsPage.vue';
import { useI18n } from './i18n';
const page = location.pathname.endsWith('/fractals.html') ? 'fractals' : location.pathname.endsWith('/rotation.html') ? 'rotation' : 'today';
const { t } = useI18n();
watchEffect(() => { document.title = t(page === 'fractals' ? 'fractalsTitle' : page === 'rotation' ? 'rotationTitle' : 'todayTitle').replace('GW2 Raid Bounties', 'GW2 Daily Tools'); });
</script>

<template>
  <a class="skip-link" href="#main-content">{{ t('skip') }}</a>
  <div class="site-shell">
    <AppHeader :page="page" />
    <main id="main-content" tabindex="-1"><FractalsPage v-if="page === 'fractals'" /><RaidPage v-else :page="page" /></main>
    <footer class="site-footer"><span>{{ t('footerTools') }}</span><a v-if="page === 'fractals'" href="https://github.com/Invisi/gw2-fotm-instabilities" target="_blank" rel="noopener noreferrer">{{ t('fractalSource') }} · CC BY-NC 4.0 ↗</a><a v-else href="https://wiki.guildwars2.com/wiki/Daily_Raid_Bounties" target="_blank" rel="noopener noreferrer">{{ t('wikiSource') }}</a></footer>
  </div>
</template>
