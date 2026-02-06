<template>
  <div class="relative min-h-screen overflow-hidden">
    <HeroCarousel />

    <div class="absolute inset-0 flex flex-col items-center justify-center px-6 text-center pointer-events-none">
      <div class="backdrop-blur-sm bg-neutral-900/40 rounded-2xl p-8 border border-neutral-700 pointer-events-auto">
        <LanguageSwitcher @change="changeLang" :active="i18n.state.locale" />
        <h1 class="mt-4 text-3xl md:text-4xl font-bold tracking-tight">{{ i18n.state.t.title }}</h1>
        <p class="mt-3 max-w-xl mx-auto text-neutral-300">{{ i18n.state.t.desc }}</p>
        <p class="mt-2 text-xs uppercase tracking-wide text-teal-400">{{ i18n.state.t.tagline }}</p>
        <StartButton class="mt-6" :label="i18n.state.t.start" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { i18n } from './i18n';
import HeroCarousel from './components/HeroCarousel.vue';
import LanguageSwitcher from './components/LanguageSwitcher.vue';
import StartButton from './components/StartButton.vue';

function changeLang(code) {
  i18n.setLocale(code);
}
</script>
