<script setup lang="ts">
const props = defineProps<{
  isExploded: boolean
  canExplode: boolean
  showGrid: boolean
}>()

const emit = defineEmits<{
  'toggleExplode': []
  'update:showGrid': [val: boolean]
}>()

const { t } = useI18n()

const tools = computed(() => [
  {
    key: 'explode' as const,
    icon: 'i-carbon-assembly-cluster',
    label: t('viewer.explode'),
    active: props.isExploded,
    disabled: !props.canExplode,
    action: () => emit('toggleExplode'),
  },
  {
    key: 'grid' as const,
    icon: 'i-carbon-grid',
    label: t('viewer.grid'),
    active: props.showGrid,
    action: () => emit('update:showGrid', !props.showGrid),
  },
])
</script>

<template>
  <div
    class="absolute top-4 left-1/2 -translate-x-1/2 z-20
           flex items-center gap-1 px-2 py-1.5
           bg-dark-surface/70 backdrop-blur-xl border border-border rounded-xl shadow-lg"
  >
    <button
      v-for="tool in tools"
      :key="tool.key"
      :title="tool.label"
      :disabled="tool.disabled"
      class="w-9 h-9 rounded-lg flex-center text-sm transition-all duration-200"
      :class="[
        tool.active
          ? 'bg-primary/15 text-primary-light shadow-sm shadow-primary/10'
          : 'text-text-secondary hover:text-text hover:bg-dark-surface-hover',
        tool.disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
      ]"
      @click="tool.action"
    >
      <i :class="tool.icon" />
    </button>
  </div>
</template>
