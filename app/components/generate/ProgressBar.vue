<script setup lang="ts">
defineProps<{
  progress: number
  status: string
}>()

const { t } = useI18n()

const tips = computed(() => [
  t('generate.tip1'),
  t('generate.tip2'),
  t('generate.tip3'),
  t('generate.tip4'),
])

const tipIndex = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    tipIndex.value = (tipIndex.value + 1) % tips.value.length
  }, 4000)
})

onUnmounted(() => {
  if (timer)
    clearInterval(timer)
})
</script>

<template>
  <div class="bg-dark-surface/85 backdrop-blur-xl border border-border rounded-xl px-5 py-4 shadow-2xl shadow-black/40">
    <!-- Header Row -->
    <div class="flex justify-between items-center mb-3">
      <div class="flex items-center gap-2.5">
        <div v-if="progress < 100" class="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
        <i v-else class="i-carbon-checkmark-filled text-base text-success" />
        <span class="text-sm font-500 text-text">{{ status }}</span>
      </div>
      <span class="text-sm font-600 tabular-nums" :class="progress >= 100 ? 'text-success' : 'text-primary-light'">
        {{ progress }}%
      </span>
    </div>

    <!-- Progress Track -->
    <div class="w-full h-1.5 bg-dark-surface-alt rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-700 ease-out relative"
        :class="progress >= 100 ? 'bg-success' : 'bg-gradient-to-r from-primary to-accent'"
        :style="{ width: `${progress}%` }"
      >
        <div
          v-if="progress < 100"
          class="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer bg-[length:200%_100%]"
        />
      </div>
    </div>

    <!-- Tip -->
    <p class="text-[11px] text-text-tertiary/60 mt-3 text-center transition-opacity duration-300">
      {{ tips[tipIndex] }}
    </p>
  </div>
</template>
