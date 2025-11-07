<template>
  <div class="absolute inset-0">
    <transition-group name="fade" tag="div">
      <div
        v-for="(bg,i) in images"
        :key="`slide-${i}`"
        v-if="currentIndex === i"
        class="absolute inset-0 bg-cover bg-center"
        :style="{ backgroundImage: bg }"
      >
        <div class="absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-neutral-950/70 to-neutral-950"></div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

// Dégradés fluides (aucun asset requis)
const images = [
  'linear-gradient(135deg,#0ea5e9 0%,#22d3ee 100%)',
  'linear-gradient(135deg,#14b8a6 0%,#10b981 100%)',
  'linear-gradient(135deg,#8b5cf6 0%,#22d3ee 100%)'
];

const currentIndex = ref(0);
let timer;

onMounted(() => {
  timer = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % images.length;
  }, 5000);
});

onBeforeUnmount(() => { if (timer) clearInterval(timer); });
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 1s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
