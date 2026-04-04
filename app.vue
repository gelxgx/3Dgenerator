<script setup lang="ts">
useHead({
  htmlAttrs: {
    class: 'dark',
  },
  bodyAttrs: {
    class: 'bg-dark text-text antialiased',
  },
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
  ],
})
</script>

<template>
  <div class="h-screen overflow-hidden font-[Inter,system-ui,sans-serif]">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
/* Prevent page-level scrolling */
html, body, #__nuxt {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* Global scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(108, 92, 231, 0.3);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(108, 92, 231, 0.5);
}

/* Smooth transitions for page navigation */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Selection color */
::selection {
  background: rgba(108, 92, 231, 0.3);
  color: #E8E8F0;
}
</style>
