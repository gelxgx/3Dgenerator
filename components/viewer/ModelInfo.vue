<script setup lang="ts">
import type { ModelTask } from '~/types/model'

const props = defineProps<{
  modelData: ModelTask
  isExporting?: boolean
}>()

const emit = defineEmits<{
  export: [format: string]
}>()

const { t, locale } = useI18n()

const animatedFaces = useAnimatedNumber(() => props.modelData.faces || 0)
const animatedVertices = useAnimatedNumber(() => props.modelData.vertices || 0)

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  catch {
    return '-'
  }
}

function downloadModel() {
  if (!props.modelData.modelUrl)
    return

  let downloadUrl = props.modelData.modelUrl
  if (downloadUrl.startsWith('/api/proxy-model?url=')) {
    const realUrl = decodeURIComponent(downloadUrl.replace('/api/proxy-model?url=', ''))
    downloadUrl = `/api/download?url=${encodeURIComponent(realUrl)}`
  }
  else if (!downloadUrl.startsWith('/api/download')) {
    downloadUrl = `/api/download?url=${encodeURIComponent(downloadUrl)}`
  }

  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = `model-${props.modelData.id}.glb`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>

<template>
  <div class="p-6 space-y-5">
    <h3 class="text-lg font-600 text-text">
      {{ $t('viewer.modelInfo') }}
    </h3>

    <div class="space-y-4">
      <div>
        <p class="text-xs text-text-tertiary uppercase tracking-wider mb-1.5 font-500">
          {{ $t('viewer.name') }}
        </p>
        <p class="text-sm text-text font-500">
          {{ modelData.prompt?.slice(0, 30) || t('viewer.unnamed') }}
        </p>
      </div>

      <div>
        <p class="text-xs text-text-tertiary uppercase tracking-wider mb-1.5 font-500">
          {{ $t('viewer.prompt') }}
        </p>
        <p class="text-sm text-text-secondary break-words leading-relaxed">
          {{ modelData.prompt }}
        </p>
      </div>

      <div v-if="modelData.faces" class="grid grid-cols-2 gap-4">
        <div class="bg-dark-surface-alt/40 rounded-lg p-3 border border-border">
          <p class="text-xs text-text-tertiary uppercase tracking-wider mb-1 font-500">
            {{ $t('viewer.faces') }}
          </p>
          <p class="text-lg text-text font-600 tabular-nums">
            {{ animatedFaces.toLocaleString() }}
          </p>
        </div>
        <div v-if="modelData.vertices" class="bg-dark-surface-alt/40 rounded-lg p-3 border border-border">
          <p class="text-xs text-text-tertiary uppercase tracking-wider mb-1 font-500">
            {{ $t('viewer.vertices') }}
          </p>
          <p class="text-lg text-text font-600 tabular-nums">
            {{ animatedVertices.toLocaleString() }}
          </p>
        </div>
      </div>

      <div>
        <p class="text-xs text-text-tertiary uppercase tracking-wider mb-1.5 font-500">
          {{ $t('viewer.qualityLabel') }}
        </p>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-500 bg-primary/10 text-primary-light border border-primary/20">
          <i :class="modelData.quality === 'ultra' ? 'i-carbon-star-filled' : 'i-carbon-star'" class="text-xs" />
          {{ modelData.quality === 'ultra' ? $t('generate.qualityUltra') : $t('generate.qualityStandard') }}
        </span>
      </div>

      <div>
        <p class="text-xs text-text-tertiary uppercase tracking-wider mb-1.5 font-500">
          {{ $t('viewer.created') }}
        </p>
        <p class="text-sm text-text-secondary">
          {{ formatDate(modelData.createdAt) }}
        </p>
      </div>
    </div>

    <div v-if="modelData.modelUrl" class="pt-4 border-t border-border space-y-2">
      <button
        :disabled="isExporting"
        class="btn-primary w-full text-sm flex items-center justify-center gap-2"
        :class="isExporting ? 'opacity-60 cursor-not-allowed' : ''"
        @click="emit('export', 'glb')"
      >
        <div v-if="isExporting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <i v-else class="i-carbon-download" />
        {{ isExporting ? t('viewer.exporting') : t('viewer.exportGLB') }}
      </button>
      <div class="flex gap-2">
        <button
          :disabled="isExporting"
          class="flex-1 py-2 rounded-lg text-xs font-500 border border-border text-text-secondary hover:text-text hover:border-primary/40 transition-colors cursor-pointer"
          @click="emit('export', 'obj')"
        >
          OBJ
        </button>
        <button
          :disabled="isExporting"
          class="flex-1 py-2 rounded-lg text-xs font-500 border border-border text-text-secondary hover:text-text hover:border-primary/40 transition-colors cursor-pointer"
          @click="emit('export', 'stl')"
        >
          STL
        </button>
      </div>
      <button
        class="w-full py-2 rounded-lg text-xs font-500 border border-border text-text-secondary hover:text-text hover:border-primary/40 transition-colors cursor-pointer"
        @click="downloadModel"
      >
        <i class="i-carbon-download text-xs mr-1" />
        {{ $t('viewer.downloadOriginal') }}
      </button>
    </div>
  </div>
</template>
