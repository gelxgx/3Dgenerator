<script setup lang="ts">
type ToolMode = 'select' | 'measure'

const props = defineProps<{
  activeMode: ToolMode
  isExploded: boolean
  canExplode: boolean
  showGrid: boolean
}>()

const emit = defineEmits<{
  'update:activeMode': [mode: ToolMode]
  'toggleExplode': []
  'update:showGrid': [val: boolean]
  'clearMeasurements': []
}>()

const tools = computed(() => [
  {
    key: 'select' as const,
    icon: 'i-carbon-cursor-1',
    label: 'Select',
    active: props.activeMode === 'select',
    action: () => emit('update:activeMode', 'select'),
  },
  {
    key: 'explode' as const,
    icon: 'i-carbon-assembly-cluster',
    label: 'Explode',
    active: props.isExploded,
    disabled: !props.canExplode,
    action: () => emit('toggleExplode'),
  },
  {
    key: 'measure' as const,
    icon: 'i-carbon-ruler',
    label: 'Measure',
    active: props.activeMode === 'measure',
    action: () => emit('update:activeMode', props.activeMode === 'measure' ? 'select' : 'measure'),
  },
  {
    key: 'grid' as const,
    icon: 'i-carbon-grid',
    label: 'Grid',
    active: props.showGrid,
    action: () => emit('update:showGrid', !props.showGrid),
  },
])
</script>

<template>
  <div
    class="absolute top-4 left-1/2 -translate-x-1/2 z-20
           flex items-center gap-0.5 px-1.5 py-1
           bg-dark/80 backdrop-blur-md rounded-xl border border-border/50 shadow-lg"
  >
    <button
      v-for="tool in tools"
      :key="tool.key"
      :title="tool.label"
      :disabled="tool.disabled"
      class="w-8 h-8 rounded-lg flex-center text-sm transition-all duration-150"
      :class="[
        tool.active
          ? 'bg-primary/20 text-primary-light'
          : 'text-text-secondary hover:text-text hover:bg-dark-surface-hover',
        tool.disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
      ]"
      @click="tool.action"
    >
      <i :class="tool.icon" />
    </button>

    <div
      v-if="activeMode === 'measure'"
      class="w-px h-5 bg-border mx-0.5"
    />
    <button
      v-if="activeMode === 'measure'"
      title="Clear measurements"
      class="w-8 h-8 rounded-lg flex-center text-sm text-text-secondary hover:text-error hover:bg-error/10 transition-all cursor-pointer"
      @click="emit('clearMeasurements')"
    >
      <i class="i-carbon-trash-can" />
    </button>
  </div>
</template>
