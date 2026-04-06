<script setup lang="ts">
import type { ClipInfo } from '~/composables/useAnimationPlayer'

const props = defineProps<{
  clips: ClipInfo[]
  currentClipName: string
  isPlaying: boolean
  playbackSpeed: number
  currentTime: number
  duration: number
  hasAnimations: boolean
  hasSkeleton: boolean
  skeletonVisible: boolean
  boneCount: number
}>()

const emit = defineEmits<{
  selectClip: [name: string]
  togglePlay: []
  setSpeed: [speed: number]
  seek: [time: number]
  toggleSkeleton: []
}>()

const { t } = useI18n()
const speedOptions = [0.25, 0.5, 1, 1.5, 2]

const progressPercent = computed(() => {
  if (!props.duration)
    return 0
  return (props.currentTime / props.duration) * 100
})

function handleSeek(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  emit('seek', (val / 100) * props.duration)
}

function formatTime(sec: number): string {
  return `${sec.toFixed(1)}s`
}
</script>

<template>
  <div class="p-4 space-y-4">
    <h4 class="text-sm font-600 text-text flex items-center gap-2">
      <i class="i-carbon-video text-primary-light" />
      {{ t('viewer.animation') }}
    </h4>

    <template v-if="hasAnimations">
      <!-- Clip selector -->
      <div v-if="clips.length > 1">
        <label class="text-[10px] text-text-tertiary uppercase tracking-wider font-500 mb-1 block">
          {{ t('viewer.clip') }}
        </label>
        <select
          :value="currentClipName"
          class="w-full bg-dark-surface-alt border border-border rounded-lg px-2 py-1.5 text-xs text-text"
          @change="emit('selectClip', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="clip in clips" :key="clip.name" :value="clip.name">
            {{ clip.name }} ({{ formatTime(clip.duration) }})
          </option>
        </select>
      </div>

      <!-- Playback controls -->
      <div class="flex items-center gap-2">
        <button
          class="w-8 h-8 rounded-lg bg-primary/15 text-primary-light flex-center hover:bg-primary/25 transition-colors cursor-pointer"
          @click="emit('togglePlay')"
        >
          <i :class="isPlaying ? 'i-carbon-pause-filled' : 'i-carbon-play-filled'" />
        </button>

        <div class="flex-1">
          <input
            type="range"
            :value="progressPercent"
            min="0"
            max="100"
            step="0.1"
            class="w-full h-1 bg-dark-surface-alt rounded-full appearance-none cursor-pointer accent-primary"
            @input="handleSeek"
          >
        </div>

        <span class="text-[10px] text-text-tertiary tabular-nums w-10 text-right">
          {{ formatTime(currentTime) }}
        </span>
      </div>

      <!-- Speed -->
      <div>
        <label class="text-[10px] text-text-tertiary uppercase tracking-wider font-500 mb-1.5 block">
          {{ t('viewer.speed') }}
        </label>
        <div class="flex gap-1">
          <button
            v-for="s in speedOptions"
            :key="s"
            class="px-2 py-1 rounded text-[10px] font-500 transition-colors cursor-pointer"
            :class="playbackSpeed === s
              ? 'bg-primary/15 text-primary-light border border-primary/30'
              : 'bg-dark-surface-alt text-text-secondary border border-border hover:text-text'"
            @click="emit('setSpeed', s)"
          >
            {{ s }}x
          </button>
        </div>
      </div>
    </template>

    <div v-else class="text-text-tertiary text-xs flex items-center gap-2 py-2">
      <i class="i-carbon-information" />
      {{ t('viewer.noAnimations') }}
    </div>

    <!-- Skeleton -->
    <div class="border-t border-border pt-3 mt-3">
      <div class="flex items-center justify-between">
        <span class="text-xs text-text-secondary flex items-center gap-1.5">
          <i class="i-carbon-tree-view" />
          {{ t('viewer.skeleton') }}
        </span>
        <button
          v-if="hasSkeleton"
          class="text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer"
          :class="skeletonVisible
            ? 'bg-primary/15 text-primary-light border-primary/30'
            : 'bg-dark-surface-alt text-text-tertiary border-border hover:text-text'"
          @click="emit('toggleSkeleton')"
        >
          {{ skeletonVisible ? t('viewer.hide') : t('viewer.show') }}
        </button>
        <span v-else class="text-[10px] text-text-tertiary">N/A</span>
      </div>
      <p v-if="hasSkeleton" class="text-[10px] text-text-tertiary mt-1">
        {{ boneCount }} {{ t('viewer.bones') }}
      </p>
    </div>
  </div>
</template>
