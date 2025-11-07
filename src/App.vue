<template>
  <HeroCarousel>
    <div class="space-y-6 max-w-4xl">
      <!-- Language Switcher -->
      <LanguageSwitcher />
      
      <!-- Main Title -->
      <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg">
        {{ i18n.t('title') }}
      </h1>
      
      <!-- Subtitle -->
      <p class="text-xl md:text-2xl lg:text-3xl text-white/95 drop-shadow-md">
        {{ i18n.t('subtitle') }}
      </p>
      
      <!-- Tagline -->
      <p class="text-lg md:text-xl text-white/90 drop-shadow-md">
        {{ i18n.t('tagline') }}
      </p>
      
      <!-- Start Button -->
      <StartButton />
    </div>
  </HeroCarousel>
</template>

<script setup>
import { i18n } from './i18n.js';
import HeroCarousel from './components/HeroCarousel.vue';
import LanguageSwitcher from './components/LanguageSwitcher.vue';
import StartButton from './components/StartButton.vue';
</script>
