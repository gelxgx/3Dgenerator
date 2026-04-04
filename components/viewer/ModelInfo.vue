<script setup lang="ts">
import type { ModelTask } from '~/types/model'

const props = defineProps<{
  modelData: ModelTask
}>()

const animatedFaces = useAnimatedNumber(() => props.modelData.faces || 0)
const animatedVertices = useAnimatedNumber(() => props.modelData.vertices || 0)

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  catch {
    return 'Unknown'
  }
}

function downloadModel() {
  if (!props.modelData.modelUrl)
    return

  // modelUrl is already a proxy URL like /api/proxy-model?url=...
  // Extract the real URL for the download endpoint, or use as-is
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
          Name
        </p>
        <p class="text-sm text-text font-500">
          {{ modelData.prompt?.slice(0, 30) || 'Unnamed' }}
        </p>
      </div>

      <div>
        <p class="text-xs text-text-tertiary uppercase tracking-wider mb-1.5 font-500">
          Prompt
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
          Quality
        </p>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-500 bg-primary/10 text-primary-light border border-primary/20">
          <i :class="modelData.quality === 'ultra' ? 'i-carbon-star-filled' : 'i-carbon-star'" class="text-xs" />
          {{ modelData.quality }}
        </span>
      </div>

      <div>
        <p class="text-xs text-text-tertiary uppercase tracking-wider mb-1.5 font-500">
          Created
        </p>
        <p class="text-sm text-text-secondary">
          {{ formatDate(modelData.createdAt) }}
        </p>
      </div>
    </div>

    <div class="pt-4 border-t border-border">
      <button
        v-if="modelData.modelUrl"
        class="btn-primary w-full text-sm flex items-center justify-center gap-2"
        @click="downloadModel"
      >
        <i class="i-carbon-download" />
        Download GLB
      </button>
    </div>
  </div>
</template>
