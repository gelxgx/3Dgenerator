<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const modelStore = useModelStore()
const models = computed(() => [...modelStore.generatedModels].reverse())

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr)
    return d.toLocaleString()
  }
  catch {
    return dateStr
  }
}

function removeModel(id: string) {
  modelStore.removeModel(id)
}
</script>

<template>
  <div class="w-full h-full flex overflow-hidden">
    <AppSidebar />

    <div class="flex-1 flex flex-col h-full min-w-0">
      <!-- Header -->
      <div class="flex-shrink-0 px-8 pt-6 pb-4 border-b border-border">
        <h1 class="text-lg font-600 text-text">
          {{ $t('history.title') }}
        </h1>
        <p class="text-xs text-text-tertiary mt-1">
          {{ models.length }} {{ models.length === 1 ? 'model' : 'models' }}
        </p>
      </div>

      <!-- Content -->
      <div class="flex-1 min-h-0 overflow-y-auto px-8 py-6">
        <!-- Empty state -->
        <div v-if="models.length === 0" class="h-full flex flex-col items-center justify-center text-center">
          <div class="w-20 h-20 rounded-2xl bg-dark-surface-alt/50 flex items-center justify-center mb-5 border border-border/50">
            <i class="i-carbon-recently-viewed text-3xl text-text-tertiary/50" />
          </div>
          <p class="text-text-secondary font-500 mb-2">
            {{ $t('history.empty') }}
          </p>
          <p class="text-sm text-text-tertiary mb-6">
            {{ $t('history.emptyHint') }}
          </p>
          <NuxtLink
            to="/workspace/generate"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-500 bg-primary/10 text-primary-light border border-primary/25 hover:bg-primary/20 transition-all"
          >
            <i class="i-carbon-flash-filled" />
            {{ $t('generate.title') }}
          </NuxtLink>
        </div>

        <!-- History list -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="model in models"
            :key="model.id"
            class="group bg-dark-surface/60 border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-200"
          >
            <!-- Thumbnail -->
            <div class="aspect-square bg-dark-surface-alt/40 relative overflow-hidden">
              <img
                v-if="model.thumbnailUrl"
                :src="model.thumbnailUrl"
                :alt="model.prompt"
                class="w-full h-full object-cover"
              >
              <div v-else class="w-full h-full flex items-center justify-center">
                <i class="i-carbon-cube text-4xl text-text-tertiary/30" />
              </div>

              <!-- Hover overlay -->
              <div class="absolute inset-0 bg-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <NuxtLink
                  :to="`/workspace/viewer/${model.id}`"
                  class="px-3 py-1.5 rounded-lg bg-primary/90 text-white text-xs font-500 hover:bg-primary transition-colors"
                >
                  <i class="i-carbon-view mr-1" />
                  {{ $t('history.viewModel') }}
                </NuxtLink>
              </div>
            </div>

            <!-- Info -->
            <div class="p-3">
              <p class="text-sm text-text font-500 truncate">
                {{ model.prompt || 'Untitled' }}
              </p>
              <div class="flex items-center justify-between mt-2">
                <span class="text-[11px] text-text-tertiary">
                  {{ formatTime(model.createdAt) }}
                </span>
                <div class="flex items-center gap-1">
                  <span
                    class="px-1.5 py-0.5 rounded text-[10px] font-500"
                    :class="model.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'"
                  >
                    {{ model.status === 'completed' ? '✓' : '...' }}
                  </span>
                  <button
                    class="w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-error hover:bg-error/10 transition-colors opacity-0 group-hover:opacity-100"
                    :title="$t('history.deleteConfirm')"
                    @click="removeModel(model.id)"
                  >
                    <i class="i-carbon-trash-can text-xs" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
