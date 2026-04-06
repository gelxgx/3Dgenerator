<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const prompt = ref('')
const quality = ref<'standard' | 'ultra'>('standard')
const textureEnabled = ref(true)
const modelVersion = ref('v2.0')

const {
  isGenerating,
  progress,
  currentTask,
  error,
  startGeneration,
  clearError,
} = useModelGenerate()

async function handleGenerate() {
  if (!prompt.value.trim())
    return

  const params: GenerateParams = {
    prompt: prompt.value,
    quality: quality.value,
    textureEnabled: textureEnabled.value,
    modelVersion: modelVersion.value,
  }

  await startGeneration(params)

  if (currentTask.value?.id && currentTask.value.status === 'completed') {
    setTimeout(() => {
      navigateTo(`/workspace/viewer/${currentTask.value!.id}`)
    }, 2000)
  }
}

const canGenerate = computed(() => prompt.value.trim().length > 0 && !isGenerating.value)

const downloadUrl = computed(() => {
  const modelUrl = currentTask.value?.modelUrl
  if (!modelUrl)
    return ''
  if (modelUrl.startsWith('/api/proxy-model?url=')) {
    const realUrl = decodeURIComponent(modelUrl.replace('/api/proxy-model?url=', ''))
    return `/api/download?url=${encodeURIComponent(realUrl)}`
  }
  return `/api/download?url=${encodeURIComponent(modelUrl)}`
})
</script>

<template>
  <div class="w-full h-full flex overflow-hidden">
    <AppSidebar />

    <div class="flex-1 flex h-full min-w-0">
      <!-- Left Panel - Input & Config -->
      <div class="w-[380px] flex-shrink-0 border-r border-border flex flex-col h-full overflow-hidden bg-dark-surface/40">
        <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 pt-5 pb-4 scrollbar-thin">
          <h2 class="text-base font-600 text-text">
            {{ $t('generate.title') }}
          </h2>
          <p class="text-xs text-text-tertiary mt-1 mb-5">
            {{ $t('generate.subtitle') }}
          </p>

          <PromptInput v-model="prompt" />

          <div class="h-px bg-border my-5" />

          <ParamPanel
            v-model:quality="quality"
            v-model:texture-enabled="textureEnabled"
            v-model:model-version="modelVersion"
          />
        </div>

        <!-- Fixed Bottom -->
        <div class="flex-shrink-0 px-6 py-4 border-t border-border bg-dark-surface/60">
          <div
            v-if="error"
            class="mb-3 bg-error/8 border border-error/20 rounded-lg p-3 text-xs"
          >
            <div class="flex items-start gap-2">
              <i class="i-carbon-warning-filled text-error flex-shrink-0 mt-0.5 text-sm" />
              <div class="flex-1 min-w-0">
                <p class="text-error/90 leading-relaxed line-clamp-2">
                  {{ error }}
                </p>
                <button
                  class="text-error/50 hover:text-error underline mt-1"
                  @click="clearError"
                >
                  {{ $t('generate.dismiss') }}
                </button>
              </div>
            </div>
          </div>

          <button
            :disabled="!canGenerate"
            class="w-full h-11 rounded-xl font-600 text-sm transition-all duration-300 flex items-center justify-center gap-2.5"
            :class="[
              canGenerate
                ? 'bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
                : 'bg-dark-surface-alt text-text-tertiary cursor-not-allowed border border-border',
            ]"
            @click="handleGenerate"
          >
            <i v-if="!isGenerating" class="i-carbon-play-filled text-base" />
            <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {{ isGenerating ? $t('generate.generating') : $t('generate.generateButton') }}
          </button>
        </div>
      </div>

      <!-- Right Panel - 3D Viewport / Preview -->
      <div class="flex-1 flex flex-col items-center justify-center relative bg-dark min-w-0 h-full overflow-hidden">
        <div class="absolute inset-0 opacity-[0.03]" style="background-image: radial-gradient(circle, rgba(108,92,231,0.5) 1px, transparent 1px); background-size: 32px 32px;" />

        <!-- Generating State -->
        <template v-if="isGenerating">
          <div class="w-full flex-1 relative min-h-0">
            <ClientOnly>
              <PointCloud :progress="progress" />
            </ClientOnly>
          </div>
          <div class="absolute bottom-6 left-1/2 -translate-x-1/2 w-[420px] max-w-[calc(100%-3rem)] z-10">
            <ProgressBar
              :progress="progress"
              :status="$t('generate.generating')"
            />
          </div>
        </template>

        <!-- Success State -->
        <div v-else-if="currentTask?.modelUrl" class="text-center animate-slide-up px-6">
          <div class="w-16 h-16 rounded-2xl bg-success/12 flex-center mx-auto mb-5 border border-success/20">
            <i class="i-carbon-checkmark-filled text-3xl text-success" />
          </div>
          <p class="text-xl text-text font-600 mb-2">
            {{ $t('common.success') }}
          </p>
          <p class="text-sm text-text-secondary mb-8">
            {{ $t('generate.successMessage') }}
          </p>
          <div class="flex items-center justify-center gap-3">
            <NuxtLink
              :to="`/workspace/viewer/${currentTask.id}`"
              class="btn-glow inline-flex items-center gap-2 px-6 py-3"
            >
              <i class="i-carbon-view" />
              {{ $t('generate.viewIn3D') }}
            </NuxtLink>
            <a
              :href="downloadUrl"
              download="model.glb"
              class="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-500 border border-border text-text-secondary hover:text-text hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
            >
              <i class="i-carbon-download" />
              {{ $t('generate.download') }}
            </a>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center px-6">
          <div class="w-24 h-24 rounded-3xl bg-dark-surface-alt/40 flex-center mx-auto mb-6 border border-border/50">
            <i class="i-carbon-cube text-4xl text-text-tertiary/60" />
          </div>
          <p class="text-lg text-text/80 font-500 mb-2">
            {{ $t('generate.title') }}
          </p>
          <p class="text-sm text-text-tertiary mt-2 max-w-xs mx-auto leading-relaxed">
            {{ $t('generate.promptPlaceholder') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(108, 92, 231, 0.15);
  border-radius: 4px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(108, 92, 231, 0.3);
}
</style>
