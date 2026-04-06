<script setup lang="ts">
definePageMeta({
  layout: 'default',
  pageTransition: false,
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

const heroReady = ref(false)
const progressBarRef = ref<HTMLElement | null>(null)

onMounted(async () => {
  await nextTick()
  heroReady.value = true

  const g = (window as any).gsap
  const ST = (window as any).ScrollTrigger
  if (!g || !ST)
    return

  // Scroll progress bar (purely scroll-driven, no visibility conflict)
  if (progressBarRef.value) {
    g.to(progressBarRef.value, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3,
      },
    })
  }
})

onUnmounted(() => {
  const ST = (window as any).ScrollTrigger
  if (ST)
    ST.getAll().forEach((t: any) => t.kill())
})
</script>

<template>
  <div class="w-full flex flex-col overflow-y-auto">
    <!-- Scroll Progress Indicator -->
    <div
      ref="progressBarRef"
      class="fixed top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary via-accent to-primary origin-left z-50"
      style="transform: scaleX(0)"
    />

    <!-- Hero Section with 3D Background -->
    <section class="relative min-h-[480px] flex items-center justify-center overflow-hidden">
      <!-- 3D Particle Background -->
      <ClientOnly>
        <HeroScene />
      </ClientOnly>

      <!-- Gradient overlays -->
      <div class="absolute inset-0 bg-gradient-to-b from-dark/30 via-transparent to-dark z-10 pointer-events-none" />
      <div class="absolute inset-0 bg-gradient-to-r from-dark/50 via-transparent to-dark/50 z-10 pointer-events-none" />

      <!-- Hero Content — animations gated by heroReady to avoid double-play -->
      <div class="relative z-20 text-center px-6 max-w-3xl mx-auto">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-500 text-primary-light mb-6" :class="[heroReady ? 'hero-anim hero-anim-1' : 'opacity-0']">
          <span class="w-1.5 h-1.5 rounded-full bg-accent animate-glow-pulse" />
          AI-Powered 3D Generation
        </div>

        <h1 class="text-5xl md:text-6xl font-700 tracking-tight mb-5 leading-tight">
          <span class="inline-block text-text" :class="[heroReady ? 'hero-anim hero-anim-2' : 'opacity-0']">{{ $t('home.hero').split('3D')[0] }}</span>
          <span class="inline-block text-gradient" :class="[heroReady ? 'hero-anim hero-anim-3' : 'opacity-0']">3D</span>
          <span class="inline-block text-text" :class="[heroReady ? 'hero-anim hero-anim-4' : 'opacity-0']">{{ $t('home.hero').split('3D')[1] || '' }}</span>
        </h1>

        <p class="text-lg text-text-secondary mb-8 max-w-xl mx-auto leading-relaxed" :class="[heroReady ? 'hero-anim hero-anim-5' : 'opacity-0']">
          {{ $t('home.description') }}
        </p>

        <div class="flex items-center justify-center gap-4">
          <NuxtLink to="/workspace/generate" class="btn-glow text-sm" :class="[heroReady ? 'hero-anim hero-anim-6' : 'opacity-0']">
            <i class="i-carbon-flash-filled inline-block mr-2" />
            {{ $t('generate.generateButton') }}
          </NuxtLink>
          <a href="#gallery" class="btn-outline text-sm" :class="[heroReady ? 'hero-anim hero-anim-7' : 'opacity-0']">
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
      <div class="max-w-7xl mx-auto mb-2">
        <h2 class="text-2xl font-600 text-text" :class="[heroReady ? 'gallery-anim gallery-anim-1' : 'opacity-0']">
          {{ $t('gallery.all') }}
        </h2>
      </div>

      <div class="max-w-7xl mx-auto" :class="[heroReady ? 'gallery-anim gallery-anim-2' : 'opacity-0']">
        <CategoryFilter
          v-model="selectedCategory"
          @select="selectedCategory = $event"
        />
      </div>

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
              v-for="(model, idx) in models"
              :key="model.id"
              :model="model"
              :class="heroReady ? 'card-anim' : 'opacity-0'"
              :style="heroReady ? `animation-delay: ${1000 + idx * 50}ms` : ''"
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

<style scoped>
/* === Hero entrance animations === */
.hero-anim {
  animation-fill-mode: both;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-anim-1 { animation: hero-fade-down 0.8s 0.2s both; }
.hero-anim-2 { animation: hero-fade-up 0.7s 0.35s both; }
.hero-anim-3 { animation: hero-scale-in 0.7s 0.45s both; }
.hero-anim-4 { animation: hero-fade-up 0.7s 0.55s both; }
.hero-anim-5 { animation: hero-fade-up 0.7s 0.65s both; }
.hero-anim-6 { animation: hero-scale-in 0.6s 0.8s both; }
.hero-anim-7 { animation: hero-scale-in 0.6s 0.9s both; }

@keyframes hero-fade-down {
  from { opacity: 0; transform: translateY(-20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes hero-fade-up {
  from { opacity: 0; transform: translateY(25px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes hero-scale-in {
  from { opacity: 0; transform: scale(0.88); }
  to   { opacity: 1; transform: scale(1); }
}

/* === Gallery entrance animations (gated by heroReady) === */
.gallery-anim {
  animation-fill-mode: both;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
.gallery-anim-1 { animation: hero-fade-up 0.6s 0.85s both; }
.gallery-anim-2 { animation: hero-fade-up 0.5s 0.95s both; }

/* === Card stagger animation === */
.card-anim {
  animation: card-enter 0.5s both;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes card-enter {
  from { opacity: 0; transform: translateY(30px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
