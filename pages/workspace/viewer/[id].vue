<script setup lang="ts">
import type { GalleryModel, ModelTask } from '~/types/model'
import type { MeshInfo } from '~/composables/useModelInteraction'

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

// --- Interaction state ---
const viewerRef = ref<{ modelScene: any, model: any } | null>(null)
const viewerScene = computed(() => viewerRef.value?.modelScene ?? null)

const selectedMeshInfo = ref<MeshInfo | null>(null)
const activeMode = ref<'select' | 'measure'>('select')
const showGrid = ref(true)
const activeTab = ref<'info' | 'scene'>('info')

// Composables driven by scene
const explode = useExplodeView(viewerScene)

function handleMeshSelected(info: MeshInfo | null) {
  selectedMeshInfo.value = info
}

function handleModeChange(mode: 'select' | 'measure') {
  activeMode.value = mode
}
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
        ref="viewerRef"
        :model-url="modelTask.modelUrl || null"
        :material-mode="selectedMaterial"
        @mesh-selected="handleMeshSelected"
      />

      <!-- Floating Toolbar -->
      <ViewerToolbar
        :active-mode="activeMode"
        :is-exploded="explode.isExploded.value"
        :can-explode="explode.canExplode.value"
        :show-grid="showGrid"
        @update:active-mode="handleModeChange"
        @toggle-explode="explode.toggleExplode()"
        @update:show-grid="showGrid = $event"
        @clear-measurements="() => {}"
      />

      <!-- Model name overlay -->
      <div class="absolute top-14 left-4 z-10">
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

    <!-- Right Panel - Tabbed -->
    <div
      v-if="modelTask"
      class="w-80 bg-dark-surface/70 backdrop-blur-xl border-l border-border flex flex-col overflow-hidden"
    >
      <!-- Tab Bar -->
      <div class="flex border-b border-border flex-shrink-0">
        <button
          v-for="tab in ([
            { key: 'info', icon: 'i-carbon-information', label: 'Info' },
            { key: 'scene', icon: 'i-carbon-tree-view-alt', label: 'Scene' },
          ] as const)"
          :key="tab.key"
          class="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-500 transition-colors border-b-2"
          :class="activeTab === tab.key
            ? 'text-primary-light border-primary'
            : 'text-text-tertiary border-transparent hover:text-text-secondary'"
          @click="activeTab = tab.key"
        >
          <i :class="tab.icon" class="text-sm" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 overflow-y-auto">
        <!-- Info Tab -->
        <template v-if="activeTab === 'info'">
          <ModelInfo :model-data="modelTask" />

          <!-- Selected Part Info -->
          <div
            v-if="selectedMeshInfo"
            class="p-6 border-t border-border space-y-3"
          >
            <h4 class="text-sm font-600 text-text flex items-center gap-2">
              <i class="i-carbon-touch-1 text-primary-light" />
              Selected Part
            </h4>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-text-tertiary">Name</span>
                <span class="text-text font-500">{{ selectedMeshInfo.name }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-tertiary">Faces</span>
                <span class="text-text font-500 tabular-nums">{{ selectedMeshInfo.faceCount.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-tertiary">Vertices</span>
                <span class="text-text font-500 tabular-nums">{{ selectedMeshInfo.vertexCount.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-tertiary">Material</span>
                <span class="text-text font-500">{{ selectedMeshInfo.materialName }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- Scene Tab -->
        <template v-if="activeTab === 'scene'">
          <SceneTree
            :scene="viewerScene"
          />
        </template>
      </div>
    </div>
  </div>
</template>
