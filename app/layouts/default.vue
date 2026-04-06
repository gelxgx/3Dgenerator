<script setup lang="ts">
// Modern layout with ambient glow effects
</script>

<template>
  <div class="flex flex-col h-screen bg-dark relative overflow-hidden">
    <!-- Background ambient glow effects -->
    <div class="fixed inset-0 pointer-events-none z-0">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div class="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
    </div>

    <!-- Header -->
    <AppHeader class="relative z-40" />

    <!-- Main Content Area -->
    <div class="flex-1 flex overflow-hidden relative z-10">
      <slot />
    </div>
  </div>
</template>
