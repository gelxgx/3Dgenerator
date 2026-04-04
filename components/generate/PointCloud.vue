<script setup lang="ts">
defineProps<{
  progress: number
}>()
</script>

<template>
  <div class="w-full h-full flex items-center justify-center bg-dark">
    <!-- Simple pulsing cube animation -->
    <div class="relative">
      <!-- Outer ring -->
      <div class="w-32 h-32 rounded-full border border-primary/20 animate-ping-slow absolute inset-0 m-auto" />
      <!-- Middle ring -->
      <div class="w-24 h-24 rounded-full border border-accent/15 animate-spin-slow absolute inset-0 m-auto" />
      <!-- Center icon -->
      <div class="w-32 h-32 flex items-center justify-center">
        <div class="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center animate-pulse">
          <i class="i-carbon-cube text-3xl text-primary-light" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes ping-slow {
  0% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.3); opacity: 0; }
  100% { transform: scale(1); opacity: 0.3; }
}
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.animate-ping-slow {
  animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
}
.animate-spin-slow {
  animation: spin-slow 8s linear infinite;
}
</style>
