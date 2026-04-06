<script setup lang="ts">
const route = useRoute()
const modelStore = useModelStore()

function isActive(name: string) {
  return route.path.includes(name)
}

const lastViewerPath = computed(() => {
  const task = modelStore.currentTask
  return task?.id ? `/workspace/viewer/${task.id}` : null
})
</script>

<template>
  <aside class="w-14 bg-dark-surface/50 backdrop-blur-md border-r border-border flex flex-col items-center py-5 gap-3">
    <NuxtLink
      to="/"
      class="btn-icon text-text-secondary hover:text-text"
      title="Home"
    >
      <i class="i-carbon-home text-lg" />
    </NuxtLink>

    <div class="w-6 h-px bg-border my-1" />

    <NuxtLink
      to="/workspace/generate"
      class="btn-icon relative"
      :class="[
        isActive('generate')
          ? 'bg-primary/10 text-primary-light ring-1 ring-primary/30'
          : 'text-text-secondary hover:text-text',
      ]"
      title="Generate"
    >
      <i class="i-carbon-flash-filled text-lg" />
    </NuxtLink>

    <NuxtLink
      to="/workspace/history"
      class="btn-icon relative"
      :class="[
        isActive('history')
          ? 'bg-primary/10 text-primary-light ring-1 ring-primary/30'
          : 'text-text-secondary hover:text-text',
      ]"
      title="History"
    >
      <i class="i-carbon-recently-viewed text-lg" />
      <!-- Badge for model count -->
      <span
        v-if="modelStore.generatedModels.length > 0"
        class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full text-[9px] text-white flex items-center justify-center font-600"
      >
        {{ modelStore.generatedModels.length > 9 ? '9+' : modelStore.generatedModels.length }}
      </span>
    </NuxtLink>

    <NuxtLink
      v-if="lastViewerPath"
      :to="lastViewerPath"
      class="btn-icon relative"
      :class="[
        isActive('viewer')
          ? 'bg-primary/10 text-primary-light ring-1 ring-primary/30'
          : 'text-text-secondary hover:text-text',
      ]"
      title="View Model"
    >
      <i class="i-carbon-view text-lg" />
    </NuxtLink>
  </aside>
</template>
