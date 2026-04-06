<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: string
  }>(),
  {
    modelValue: 'originalPbr',
  },
)

const emit = defineEmits<{
  'update:modelValue': [mode: string]
  'change': [mode: string]
}>()

const { t } = useI18n()

const materialModes = computed(() => [
  { key: 'originalPbr', label: t('viewer.originalPbr'), color: '#666666', icon: 'i-carbon-cube' },
  { key: 'matcapSilver', label: t('viewer.matcapSilver'), color: '#c0c0c0', icon: 'i-carbon-circle-filled' },
  { key: 'whiteClay', label: t('viewer.whiteClay'), color: '#f5f5f5', icon: 'i-carbon-circle-filled' },
  { key: 'wireframe', label: t('viewer.wireframe'), color: '#00CEC9', icon: 'i-carbon-network-3' },
  { key: 'normal', label: t('viewer.normal'), color: '#A29BFE', icon: 'i-carbon-gradient' },
])

const activeMaterial = computed(() => props.modelValue)
</script>

<template>
  <div class="space-y-3">
    <span class="text-xs text-text-tertiary uppercase tracking-wider font-500">
      {{ $t('viewer.material') }}
    </span>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="mode in materialModes"
        :key="mode.key"
        class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-500 transition-all duration-200 border"
        :class="[
          activeMaterial === mode.key
            ? 'bg-primary/15 text-primary-light border-primary/30'
            : 'bg-dark-surface-alt/40 text-text-secondary border-border hover:border-border-light hover:text-text',
        ]"
        :title="mode.label"
        @click="emit('update:modelValue', mode.key); emit('change', mode.key)"
      >
        <div
          class="w-3.5 h-3.5 rounded-full border"
          :class="activeMaterial === mode.key ? 'border-primary/50' : 'border-border'"
          :style="{ backgroundColor: mode.color }"
        />
        {{ mode.label }}
      </button>
    </div>
  </div>
</template>
