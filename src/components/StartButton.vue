<template>
  <a
    href="/compare"
    class="inline-block mt-8 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-lg shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
  >
    {{ i18n.t('startButton') }}
  </a>
</template>

<script setup>
import { i18n } from '../i18n.js';
</script>
