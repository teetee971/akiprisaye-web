<template>
  <div class="flex gap-3 justify-center mb-6">
    <button
      v-for="lang in languages"
      :key="lang.code"
      @click="changeLanguage(lang.code)"
      :class="[
        'px-4 py-2 rounded-lg font-medium transition-all duration-200',
        i18n.currentLang === lang.code
          ? 'bg-blue-600 text-white shadow-lg scale-105'
          : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md'
      ]"
    >
      {{ lang.flag }} {{ lang.label }}
    </button>
  </div>
</template>

<script setup>
import { i18n } from '../i18n.js';

const languages = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'creole', label: 'Kreyòl', flag: '🇬🇵' },
  { code: 'es', label: 'Español', flag: '🇪🇸' }
];

const changeLanguage = (lang) => {
  i18n.setLanguage(lang);
};
</script>
