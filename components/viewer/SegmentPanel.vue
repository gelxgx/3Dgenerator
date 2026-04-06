<script setup lang="ts">
import type { Segment } from '~/composables/useSegmentation'

defineProps<{
  segments: Segment[]
  isActive: boolean
}>()

const emit = defineEmits<{
  toggle: []
  toggleVisibility: [index: number]
  highlight: [index: number]
  unhighlight: [index: number]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="p-4 space-y-3">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-600 text-text flex items-center gap-2">
        <i class="i-carbon-chart-treemap text-primary-light" />
        {{ t('viewer.segments') }}
      </h4>
      <button
        class="text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer"
        :class="isActive
          ? 'bg-primary/15 text-primary-light border-primary/30'
          : 'bg-dark-surface-alt text-text-tertiary border-border hover:text-text'"
        @click="emit('toggle')"
      >
        {{ isActive ? t('viewer.deactivate') : t('viewer.activate') }}
      </button>
    </div>

    <template v-if="isActive && segments.length > 0">
      <div class="space-y-0.5">
        <div
          v-for="(seg, i) in segments"
          :key="i"
          class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-dark-surface-hover cursor-pointer text-xs transition-colors"
          @mouseenter="emit('highlight', i)"
          @mouseleave="emit('unhighlight', i)"
        >
          <button
            class="w-4 h-4 flex-center shrink-0"
            :class="seg.visible ? 'text-text-secondary' : 'text-text-tertiary/40'"
            @click.stop="emit('toggleVisibility', i)"
          >
            <i :class="seg.visible ? 'i-carbon-view' : 'i-carbon-view-off'" class="text-xs" />
          </button>

          <div
            class="w-3 h-3 rounded-sm shrink-0 border border-white/10"
            :style="{ backgroundColor: seg.color }"
          />

          <span class="text-text-secondary truncate flex-1">{{ seg.name }}</span>

          <span class="text-text-tertiary/60 tabular-nums text-[11px]">
            {{ seg.faceCount.toLocaleString() }}
          </span>
        </div>
      </div>

      <div class="border-t border-border pt-2 text-[10px] text-text-tertiary flex justify-between">
        <span>{{ segments.length }} {{ t('viewer.parts') }}</span>
        <span>{{ segments.reduce((sum, s) => sum + s.faceCount, 0).toLocaleString() }} {{ t('viewer.totalFaces') }}</span>
      </div>
    </template>

    <div v-else-if="!isActive" class="text-text-tertiary text-xs py-2">
      {{ t('viewer.segmentHint') }}
    </div>
  </div>
</template>
