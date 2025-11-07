<template>
  <div class="relative h-screen w-screen overflow-hidden">
    <!-- Carousel Slides -->
    <TransitionGroup name="fade">
      <div
        v-for="(image, index) in images"
        v-if="currentSlide === index"
        :key="`slide-${index}`"
        class="absolute inset-0 bg-cover bg-center"
        :style="{ backgroundImage: `url(${image})` }"
      >
        <!-- Dark gradient overlay for text readability -->
        <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60"></div>
      </div>
    </TransitionGroup>
    
    <!-- Content Overlay -->
    <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-4 backdrop-blur-sm">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import hero1 from '../assets/hero1.webp';
import hero2 from '../assets/hero2.webp';
import hero3 from '../assets/hero3.webp';

const images = [hero1, hero2, hero3];
const currentSlide = ref(0);
const intervalId = ref(null);

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % images.length;
};

onMounted(() => {
  intervalId.value = setInterval(nextSlide, 5000);
});

onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value);
  }
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease-in-out;
}

.fade-enter-from {
  opacity: 0;
}

.fade-enter-to {
  opacity: 1;
}

.fade-leave-from {
  opacity: 1;
}

.fade-leave-to {
  opacity: 0;
}
</style>
