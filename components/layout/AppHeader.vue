<script setup lang="ts">
const { locale, locales } = useI18n()
const route = useRoute()

const currentLocale = computed({
  get: () => locale.value,
  set: (val) => {
    locale.value = val
  },
})

function switchLocale() {
  const availableLocales = (locales.value as any).map((l: any) => l.code || l)
  const currentIndex = availableLocales.indexOf(currentLocale.value)
  const nextIndex = (currentIndex + 1) % availableLocales.length
  currentLocale.value = availableLocales[nextIndex]
}

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <header class="h-16 bg-dark-surface/60 backdrop-blur-xl border-b border-border flex-between px-8 sticky top-0">
    <!-- Logo -->
    <NuxtLink to="/" class="flex items-center gap-3 group">
      <div class="w-9 h-9 flex-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
        <span class="text-white font-bold text-lg">3D</span>
      </div>
      <h1 class="text-lg font-600 text-text tracking-tight">
        3D<span class="text-gradient">Generator</span>
      </h1>
    </NuxtLink>

    <!-- Nav Links -->
    <nav class="flex items-center gap-1">
      <NuxtLink
        to="/"
        class="relative px-4 py-2 rounded-lg text-sm font-500 transition-all duration-200"
        :class="isActive('/') && !isActive('/workspace')
          ? 'text-text bg-dark-surface-hover'
          : 'text-text-secondary hover:text-text hover:bg-dark-surface-hover/50'"
      >
        <i class="i-carbon-home inline-block mr-1.5 text-xs" />
        {{ $t('nav.home') }}
      </NuxtLink>
      <NuxtLink
        to="/workspace/generate"
        class="relative px-4 py-2 rounded-lg text-sm font-500 transition-all duration-200"
        :class="isActive('/workspace')
          ? 'text-text bg-dark-surface-hover'
          : 'text-text-secondary hover:text-text hover:bg-dark-surface-hover/50'"
      >
        <i class="i-carbon-flash-filled inline-block mr-1.5 text-xs text-primary-light" />
        {{ $t('nav.workspace') }}
      </NuxtLink>
    </nav>

    <!-- Right Controls -->
    <div class="flex items-center gap-3">
      <button
        class="h-8 px-3 rounded-lg text-xs font-500 border border-border text-text-secondary hover:text-text hover:border-border-light transition-all duration-200"
        @click="switchLocale"
      >
        <i class="i-carbon-translate inline-block mr-1" />
        {{ currentLocale === 'zh-CN' ? '中文' : 'EN' }}
      </button>
    </div>
  </header>
</template>
