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

// Gallery GSAP refs (only for scroll-driven animations — below the fold)
const galleryRef = ref<HTMLElement | null>(null)
const filterRef = ref<HTMLElement | null>(null)
const cardsContainerRef = ref<HTMLElement | null>(null)
const progressBarRef = ref<HTMLElement | null>(null)

// GSAP ScrollTrigger for gallery only (below the fold — no hydration conflict)
onMounted(async () => {
  await nextTick()
  // Give GSAP CDN time to load + SSR hydration to fully settle
  await new Promise(resolve => setTimeout(resolve, 500))

  const g = (window as any).gsap
  const ST = (window as any).ScrollTrigger

  if (!g || !ST)
    return

  // Scroll progress bar
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

  // Gallery title
  if (galleryRef.value) {
    const title = galleryRef.value.querySelector('h2')
    if (title) {
      g.fromTo(title, { opacity: 0, x: -30 }, {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: title, start: 'top 85%', toggleActions: 'play none none reverse' },
      })
    }
  }

  // Filter chips
  if (filterRef.value) {
    const chips = filterRef.value.querySelectorAll('button')
    if (chips.length) {
      g.fromTo(chips, { opacity: 0, y: 12 }, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        stagger: 0.05,
        ease: 'power2.out',
        scrollTrigger: { trigger: filterRef.value, start: 'top 88%', toggleActions: 'play none none reverse' },
      })
    }
  }

  // Card batch animations
  if (cardsContainerRef.value) {
    const cards = cardsContainerRef.value.querySelectorAll('a')
    if (cards.length) {
      ST.batch(cards, {
        onEnter: (batch: Element[]) => {
          g.fromTo(batch, { opacity: 0, y: 40, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06, ease: 'power2.out', overwrite: true })
        },
        start: 'top 92%',
      })
    }
  }
})

onUnmounted(() => {
  const ST = (window as any).ScrollTrigger
  if (ST)
    ST.getAll().forEach((t: any) => t.kill())
})

watch(models, async () => {
  if (currentPage.value > 1) {
    await nextTick()
    const ST = (window as any).ScrollTrigger
    if (ST)
      ST.refresh()
  }
}, { deep: true })
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

      <!-- Hero Content — CSS animations for SSR reliability -->
      <div class="relative z-20 text-center px-6 max-w-3xl mx-auto">
        <div class="hero-anim hero-anim-1 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-500 text-primary-light mb-6">
          <span class="w-1.5 h-1.5 rounded-full bg-accent animate-glow-pulse" />
          AI-Powered 3D Generation
        </div>

        <h1 class="text-5xl md:text-6xl font-700 tracking-tight mb-5 leading-tight">
          <span class="hero-anim hero-anim-2 inline-block text-text">{{ $t('home.hero').split('3D')[0] }}</span>
          <span class="hero-anim hero-anim-3 inline-block text-gradient">3D</span>
          <span class="hero-anim hero-anim-4 inline-block text-text">{{ $t('home.hero').split('3D')[1] || '' }}</span>
        </h1>

        <p class="hero-anim hero-anim-5 text-lg text-text-secondary mb-8 max-w-xl mx-auto leading-relaxed">
          {{ $t('home.description') }}
        </p>

        <div class="flex items-center justify-center gap-4">
          <NuxtLink to="/workspace/generate" class="hero-anim hero-anim-6 btn-glow text-sm">
            <i class="i-carbon-flash-filled inline-block mr-2" />
            {{ $t('generate.generateButton') }}
          </NuxtLink>
          <a href="#gallery" class="hero-anim hero-anim-7 btn-outline text-sm">
            {{ $t('gallery.all') }}
            <i class="i-carbon-arrow-down inline-block ml-2" />
          </a>
        </div>
      </div>

      <!-- Bottom gradient fade -->
      <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark to-transparent z-10" />
    </section>

    <!-- Gallery Section -->
    <section id="gallery" ref="galleryRef" class="px-6 pb-12">
      <div class="max-w-7xl mx-auto mb-2">
        <h2 class="text-2xl font-600 text-text">
          {{ $t('gallery.all') }}
        </h2>
      </div>

      <div ref="filterRef" class="max-w-7xl mx-auto">
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
          <div ref="cardsContainerRef" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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

<style scoped>
/* Hero entrance animations — pure CSS, SSR-safe */
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
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hero-fade-up {
  from {
    opacity: 0;
    transform: translateY(25px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hero-scale-in {
  from {
    opacity: 0;
    transform: scale(0.88);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
