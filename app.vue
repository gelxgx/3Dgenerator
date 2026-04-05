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

/* ============================================
   Page Transition — GSAP-enhanced
   使用 CSS 作为 fallback, JS hooks 增强
   ============================================ */

/* 基础 CSS 过渡（GSAP 未加载时的 fallback） */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              filter 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
  filter: blur(4px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.98);
  filter: blur(4px);
}

/* Layout 切换过渡 */
.layout-enter-active,
.layout-leave-active {
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.layout-enter-from,
.layout-leave-to {
  opacity: 0;
}

/* 过渡遮罩层 */
.page-transition-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  background: linear-gradient(135deg, rgba(108, 92, 231, 0.15), rgba(0, 206, 201, 0.1));
  opacity: 0;
}

/* Selection color */
::selection {
  background: rgba(108, 92, 231, 0.3);
  color: #E8E8F0;
}
</style>
