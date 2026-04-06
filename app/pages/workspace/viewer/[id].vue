<script setup lang="ts">
import type { Mesh, Object3D } from 'three'
import type { MeshInfo } from '~/composables/useModelInteraction'
import type { ExportFormat } from '~/composables/useModelExport'

definePageMeta({
  layout: 'default',
})

const { t } = useI18n()
const route = useRoute()
const modelId = route.params.id as string
const selectedMaterial = ref('originalPbr')
const modelStore = useModelStore()

const isDemoModel = modelId.startsWith('demo-')

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

const storeModel = computed(() => {
  if (isDemoModel)
    return null
  return modelStore.getModelById(modelId) || null
})

const apiModel = ref<ModelTask | null>(null)
const pending = ref(false)

if (!isDemoModel && import.meta.server) {
  try {
    pending.value = true
    const { data } = await useFetch<ModelTask>(`/api/models/${modelId}`)
    apiModel.value = data.value ?? null
  }
  catch {
    // Model might be in client-side store
  }
  finally {
    pending.value = false
  }
}

const modelTask = computed(() => {
  return demoModel.value || storeModel.value || apiModel.value || null
})

const viewerRef = ref<{ modelScene: any, model: any } | null>(null)
const viewerScene = computed(() => viewerRef.value?.modelScene ?? null)
const viewerGltf = computed(() => viewerRef.value?.model ?? null)

const selectedMeshInfo = ref<MeshInfo | null>(null)
const selectedMeshObj = shallowRef<Mesh | null>(null)
const showGrid = ref(true)
const activeTab = ref<'info' | 'scene' | 'animation' | 'segments' | 'material'>('info')

const explode = useExplodeView(viewerScene)
const skeleton = useSkeletonViewer(viewerScene)
const animation = useAnimationPlayer(viewerGltf)
const segmentation = useSegmentation(viewerScene)
const modelExport = useModelExport(viewerScene)

function handleMeshSelected(info: MeshInfo | null) {
  selectedMeshInfo.value = info
}

function handleSceneNodeSelect(obj: Object3D) {
  const mesh = obj as Mesh
  if (mesh.isMesh) {
    const geo = mesh.geometry
    const pos = geo.attributes.position
    if (!pos)
      return
    const faceCount = geo.index
      ? geo.index.count / 3
      : pos.count / 3
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    selectedMeshInfo.value = {
      name: mesh.name || t('viewer.unnamed'),
      faceCount: Math.floor(faceCount),
      vertexCount: pos.count,
      materialName: mat?.name || mat?.type || t('viewer.material'),
    }
    selectedMeshObj.value = mesh
  }
}

function handleExport(format: string) {
  const name = modelTask.value?.prompt?.slice(0, 20) || 'model'
  modelExport.exportModel(format as ExportFormat, name)
}

const tabs = computed(() => [
  { key: 'info' as const, icon: 'i-carbon-information', label: t('viewer.tabInfo') },
  { key: 'scene' as const, icon: 'i-carbon-tree-view-alt', label: t('viewer.tabScene') },
  { key: 'animation' as const, icon: 'i-carbon-video', label: t('viewer.tabAnimation') },
  { key: 'segments' as const, icon: 'i-carbon-chart-treemap', label: t('viewer.tabSegments') },
  { key: 'material' as const, icon: 'i-carbon-paint-brush', label: t('viewer.tabMaterial') },
])
</script>

<template>
  <div class="w-full flex overflow-hidden">
    <AppSidebar />

    <!-- Left Panel -->
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
          {{ $t('viewer.subtitle') }}
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
          {{ $t('viewer.navigation') }}
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
        :show-grid="showGrid"
        :animation-update-fn="animation.hasAnimations.value ? animation.update : null"
        @mesh-selected="handleMeshSelected"
      />

      <ViewerToolbar
        :is-exploded="explode.isExploded.value"
        :can-explode="explode.canExplode.value"
        :show-grid="showGrid"
        @toggle-explode="explode.toggleExplode()"
        @update:show-grid="showGrid = $event"
      />
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
        {{ $t('viewer.modelNotFound') }}
      </p>
      <p class="text-sm text-text-tertiary mb-6">
        {{ $t('viewer.modelNotFoundDesc') }}
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
      <div class="flex items-center gap-1 px-2 py-2 bg-dark-surface border-b border-border flex-shrink-0">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :title="tab.label"
          class="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[10px] font-500 transition-all duration-200 cursor-pointer"
          :class="activeTab === tab.key
            ? 'bg-primary/12 text-primary-light shadow-sm shadow-primary/8'
            : 'text-text-tertiary hover:text-text-secondary hover:bg-dark-surface-hover'"
          @click="activeTab = tab.key"
        >
          <i :class="tab.icon" class="text-base" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 overflow-y-auto">
        <!-- Info Tab -->
        <template v-if="activeTab === 'info'">
          <ModelInfo
            :model-data="modelTask"
            :is-exporting="modelExport.isExporting.value"
            @export="handleExport"
          />

          <!-- Selected Part Info -->
          <div
            v-if="selectedMeshInfo"
            class="mx-4 mb-4 p-4 bg-dark-surface-alt/40 backdrop-blur-lg border border-border rounded-xl animate-fade-in space-y-3"
          >
            <h4 class="text-sm font-600 text-text flex items-center gap-2">
              <i class="i-carbon-touch-1 text-primary-light" />
              {{ $t('viewer.selectedPart') }}
            </h4>
            <div class="space-y-2 text-xs">
              <div class="flex justify-between">
                <span class="text-text-tertiary">{{ $t('viewer.name') }}</span>
                <span class="text-text font-500">{{ selectedMeshInfo.name }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-tertiary">{{ $t('viewer.faces') }}</span>
                <span class="text-text font-500 tabular-nums">{{ selectedMeshInfo.faceCount.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-tertiary">{{ $t('viewer.vertices') }}</span>
                <span class="text-text font-500 tabular-nums">{{ selectedMeshInfo.vertexCount.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-tertiary">{{ $t('viewer.material') }}</span>
                <span class="text-text font-500">{{ selectedMeshInfo.materialName }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- Scene Tab -->
        <template v-if="activeTab === 'scene'">
          <SceneTree
            :scene="viewerScene"
            @select-node="handleSceneNodeSelect"
          />
        </template>

        <!-- Animation Tab -->
        <template v-if="activeTab === 'animation'">
          <AnimationPanel
            :clips="[...animation.clips.value]"
            :current-clip-name="animation.currentClipName.value"
            :is-playing="animation.isPlaying.value"
            :playback-speed="animation.playbackSpeed.value"
            :current-time="animation.currentTime.value"
            :duration="animation.duration.value"
            :has-animations="animation.hasAnimations.value"
            :has-skeleton="skeleton.hasSkeleton.value"
            :skeleton-visible="skeleton.isVisible.value"
            :bone-count="skeleton.boneCount.value"
            @select-clip="animation.selectClip"
            @toggle-play="animation.togglePlay"
            @set-speed="animation.setSpeed"
            @seek="animation.seek"
            @toggle-skeleton="skeleton.toggle"
          />
        </template>

        <!-- Segments Tab -->
        <template v-if="activeTab === 'segments'">
          <SegmentPanel
            :segments="[...segmentation.segments.value]"
            :is-active="segmentation.isActive.value"
            @toggle="segmentation.toggle"
            @toggle-visibility="segmentation.toggleVisibility"
            @highlight="segmentation.highlightSegment"
            @unhighlight="segmentation.unhighlightSegment"
          />
        </template>

        <!-- Material Tab -->
        <template v-if="activeTab === 'material'">
          <MaterialEditor :selected-mesh="selectedMeshObj" />
        </template>
      </div>
    </div>
  </div>
</template>
