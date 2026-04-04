<script setup lang="ts">
import type { GalleryModel } from '~/types/model'

definePageMeta({
  layout: 'default',
})

const selectedCategory = ref('all')
const currentPage = ref(1)

const { data, pending, execute } = await useFetch<{ items: GalleryModel[], total: number }>('/api/models', {
  query: computed(() => ({
    category: selectedCategory.value !== 'all' ? selectedCategory.value : undefined,
    page: currentPage.value,
    limit: 20,
  })),
  default: () => ({ items: [], total: 0 }),
})

const models = ref<GalleryModel[]>([])
const totalModels = ref(0)

// Sync fetched data into models list (supports pagination append)
watch(data, (val) => {
  if (!val)
    return
  if (currentPage.value === 1) {
    models.value = val.items
  }
  else {
    models.value.push(...val.items)
  }
  totalModels.value = val.total
}, { immediate: true })

const hasMore = computed(() => models.value.length < totalModels.value)

function loadMore() {
  currentPage.value++
  execute()
}

watch(selectedCategory, () => {
  currentPage.value = 1
  models.value = []
  execute()
})
</script>

<template>
  <div class="w-full flex flex-col overflow-y-auto">
    <!-- Hero Section with 3D Background -->
    <section class="relative min-h-[480px] flex items-center justify-center overflow-hidden">
      <!-- 3D Particle Background -->
      <HeroScene />

      <!-- Gradient overlays -->
      <div class="absolute inset-0 bg-gradient-to-b from-dark/30 via-transparent to-dark z-10 pointer-events-none" />
      <div class="absolute inset-0 bg-gradient-to-r from-dark/50 via-transparent to-dark/50 z-10 pointer-events-none" />

      <!-- Hero Content -->
      <div class="relative z-20 text-center px-6 max-w-3xl mx-auto">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-500 text-primary-light mb-6">
          <span class="w-1.5 h-1.5 rounded-full bg-accent animate-glow-pulse" />
          AI-Powered 3D Generation
        </div>

        <h1 class="text-5xl md:text-6xl font-700 tracking-tight mb-5 leading-tight">
          <span class="text-text">{{ $t('home.hero').split('3D')[0] }}</span>
          <span class="text-gradient">3D</span>
          <span class="text-text">{{ $t('home.hero').split('3D')[1] || '' }}</span>
        </h1>

        <p class="text-lg text-text-secondary mb-8 max-w-xl mx-auto leading-relaxed">
          {{ $t('home.description') }}
        </p>

        <div class="flex items-center justify-center gap-4">
          <NuxtLink to="/workspace/generate" class="btn-glow text-sm">
            <i class="i-carbon-flash-filled inline-block mr-2" />
            {{ $t('generate.generateButton') }}
          </NuxtLink>
          <a href="#gallery" class="btn-outline text-sm">
            {{ $t('gallery.all') }}
            <i class="i-carbon-arrow-down inline-block ml-2" />
          </a>
        </div>
      </div>

      <!-- Bottom gradient fade -->
      <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark to-transparent z-10" />
    </section>

    <!-- Gallery Section -->
    <section id="gallery" class="px-6 pb-12">
      <!-- Section header -->
      <div class="max-w-7xl mx-auto mb-2">
        <h2 class="text-2xl font-600 text-text">
          {{ $t('gallery.all') }}
        </h2>
      </div>

      <!-- Category Filter -->
      <div class="max-w-7xl mx-auto">
        <CategoryFilter
          v-model="selectedCategory"
          @select="selectedCategory = $event"
        />
      </div>

      <!-- Gallery Grid -->
      <div class="max-w-7xl mx-auto mt-4">
        <div v-if="pending && models.length === 0" class="flex-center h-64">
          <div class="text-center">
            <div class="inline-block w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p class="text-sm text-text-secondary">
              {{ $t('common.loading') }}
            </p>
          </div>
        </div>

        <div v-else-if="models.length === 0" class="flex-center h-64">
          <div class="text-center">
            <i class="i-carbon-no-image text-4xl text-text-tertiary mb-3" />
            <p class="text-text-secondary">
              No models found
            </p>
          </div>
        </div>

        <template v-else>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <ModelCard
              v-for="model in models"
              :key="model.id"
              :model="model"
            />
          </div>

          <div v-if="hasMore" class="flex-center py-10">
            <button
              :disabled="pending"
              class="btn-outline flex items-center gap-2"
              @click="loadMore"
            >
              <i v-if="pending" class="i-carbon-hourglass inline-block animate-spin" />
              <i v-else class="i-carbon-add" />
              {{ pending ? $t('common.loading') : 'Load More' }}
            </button>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>
