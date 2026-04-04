<script setup lang="ts">
import type { GalleryModel, ModelTask } from '~/types/model'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const modelId = route.params.id as string
const selectedMaterial = ref('originalPbr')
const modelStore = useModelStore()

// Check if it's a demo model from gallery
const isDemoModel = modelId.startsWith('demo-')

// For demo models, fetch from the gallery API
const { data: galleryData } = isDemoModel
  ? await useFetch<{ items: GalleryModel[] }>('/api/models')
  : { data: ref(null) }

const demoModel = computed(() => {
  if (!isDemoModel || !galleryData.value)
    return null
  const found = galleryData.value.items.find((m: GalleryModel) => m.id === modelId)
  if (!found)
    return null
  // Convert GalleryModel to ModelTask-like object
  return {
    id: found.id,
    status: 'completed' as const,
    progress: 100,
    prompt: found.name,
    quality: 'standard' as const,
    modelUrl: found.modelUrl || found.thumbnailUrl,
    thumbnailUrl: found.thumbnailUrl,
    faces: 0,
    vertices: 0,
    createdAt: new Date().toISOString(),
  }
})

// For real models, check store first then API
const storeModel = !isDemoModel ? modelStore.getModelById(modelId) : null

const { data: apiModel, pending } = !isDemoModel && !storeModel
  ? await useFetch<ModelTask>(`/api/models/${modelId}`)
  : { data: ref(null), pending: ref(false) }

const modelTask = computed(() => {
  return demoModel.value || storeModel || apiModel.value || null
})
</script>

<template>
  <div class="w-full flex overflow-hidden">
    <!-- Left Sidebar -->
    <AppSidebar />

    <!-- Left Panel - Navigation & Controls -->
    <div class="w-64 bg-dark-surface/70 backdrop-blur-xl border-r border-border overflow-y-auto p-5 flex flex-col gap-6">
      <NuxtLink
        to="/"
        class="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors group"
      >
        <i class="i-carbon-arrow-left group-hover:-translate-x-0.5 transition-transform" />
        {{ $t('common.back') }}
      </NuxtLink>

      <div>
        <h2 class="text-base font-600 text-text mb-1">
          {{ modelTask?.prompt?.slice(0, 25) || $t('nav.workspace') }}
        </h2>
        <p class="text-xs text-text-tertiary">
          3D Model Viewer
        </p>
      </div>

      <!-- Material Switcher -->
      <div class="border-t border-border pt-5">
        <MaterialSwitcher
          v-model="selectedMaterial"
          @change="selectedMaterial = $event"
        />
      </div>

      <!-- Quick Nav -->
      <div class="border-t border-border pt-5">
        <p class="text-xs text-text-tertiary uppercase tracking-wider font-500 mb-3">
          Navigation
        </p>
        <nav class="space-y-1">
          <NuxtLink
            to="/workspace/generate"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-dark-surface-hover hover:text-text transition-all"
          >
            <i class="i-carbon-flash-filled text-primary-light text-xs" />
            {{ $t('generate.title') }}
          </NuxtLink>
          <NuxtLink
            to="/workspace/history"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-dark-surface-hover hover:text-text transition-all"
          >
            <i class="i-carbon-recently-viewed text-xs" />
            {{ $t('history.title') }}
          </NuxtLink>
          <NuxtLink
            to="/"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-dark-surface-hover hover:text-text transition-all"
          >
            <i class="i-carbon-grid text-xs" />
            {{ $t('nav.home') }}
          </NuxtLink>
        </nav>
      </div>
    </div>

    <!-- Center - 3D Viewport -->
    <div v-if="modelTask" class="flex-1 relative">
      <ModelViewer
        :model-url="modelTask.modelUrl || null"
        :material-mode="selectedMaterial"
      />

      <!-- Model name overlay -->
      <div class="absolute top-4 left-4 z-10">
        <div class="px-3 py-1.5 rounded-lg bg-dark/60 backdrop-blur-md text-xs text-text-secondary border border-border/50">
          {{ modelTask.prompt?.slice(0, 40) }}
        </div>
      </div>
    </div>

    <div v-else-if="pending" class="flex-1 flex-col-center">
      <div class="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
      <p class="text-text-secondary text-sm">
        {{ $t('common.loading') }}
      </p>
    </div>

    <div v-else class="flex-1 flex-col-center text-text-secondary">
      <div class="w-16 h-16 rounded-2xl bg-error/10 flex-center mb-4">
        <i class="i-carbon-warning-filled text-2xl text-error" />
      </div>
      <p class="text-lg font-500 text-text mb-2">
        Model not found
      </p>
      <p class="text-sm text-text-tertiary mb-6">
        The model you're looking for doesn't exist
      </p>
      <NuxtLink to="/" class="btn-primary">
        {{ $t('common.back') }}
      </NuxtLink>
    </div>

    <!-- Right Panel - Model Info -->
    <div
      v-if="modelTask"
      class="w-80 bg-dark-surface/70 backdrop-blur-xl border-l border-border overflow-y-auto"
    >
      <ModelInfo :model-data="modelTask" />
    </div>
  </div>
</template>
