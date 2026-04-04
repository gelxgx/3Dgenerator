<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    quality?: 'standard' | 'ultra'
    textureEnabled?: boolean
    modelVersion?: string
  }>(),
  {
    quality: 'standard',
    textureEnabled: true,
    modelVersion: 'v2.0',
  },
)

const emit = defineEmits<{
  'update:quality': ['standard' | 'ultra']
  'update:textureEnabled': [boolean]
  'update:modelVersion': [string]
}>()

const quality = computed({
  get: () => props.quality,
  set: (val) => { emit('update:quality', val) },
})

const textureEnabled = computed({
  get: () => props.textureEnabled,
  set: (val) => { emit('update:textureEnabled', val) },
})

const modelVersion = computed({
  get: () => props.modelVersion,
  set: (val) => { emit('update:modelVersion', val) },
})

const versionOpen = ref(false)
const versions = [
  { value: 'v2.0', label: 'Tripo 2.0', badge: 'Economy' },
  { value: 'v2.5', label: 'Tripo 2.5', badge: '' },
  { value: 'v3.0', label: 'Tripo 3.0', badge: '' },
  { value: 'v3.1', label: 'Tripo 3.1', badge: 'Latest' },
  { value: 'turbo', label: 'Turbo', badge: 'Fast' },
]
const selectedVersionLabel = computed(() => versions.find(v => v.value === modelVersion.value)?.label || 'Tripo 2.0')

function selectVersion(val: string) {
  modelVersion.value = val
  versionOpen.value = false
}
</script>

<template>
  <div class="space-y-5">
    <!-- Quality Selector -->
    <div>
      <label class="block text-xs font-500 text-text-secondary mb-2.5 uppercase tracking-wider">
        {{ $t('generate.quality') }}
      </label>
      <div class="grid grid-cols-2 gap-2">
        <button
          class="relative px-3 py-2.5 rounded-lg text-xs font-500 transition-all duration-200 border text-center"
          :class="[
            quality === 'standard'
              ? 'bg-primary/10 text-primary-light border-primary/25'
              : 'bg-transparent text-text-tertiary border-border hover:border-border-light hover:text-text-secondary',
          ]"
          @click="quality = 'standard'"
        >
          <i class="i-carbon-star inline-block mr-1 text-[11px] align-middle" />
          {{ $t('generate.qualityStandard') }}
        </button>
        <button
          class="relative px-3 py-2.5 rounded-lg text-xs font-500 transition-all duration-200 border text-center"
          :class="[
            quality === 'ultra'
              ? 'bg-primary/10 text-primary-light border-primary/25'
              : 'bg-transparent text-text-tertiary border-border hover:border-border-light hover:text-text-secondary',
          ]"
          @click="quality = 'ultra'"
        >
          <i class="i-carbon-star-filled inline-block mr-1 text-[11px] align-middle text-warning/70" />
          {{ $t('generate.qualityUltra') }}
        </button>
      </div>
    </div>

    <!-- Texture Toggle -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs font-500 text-text-secondary">
          {{ $t('generate.texture') }}
        </p>
        <p class="text-[11px] text-text-tertiary/60 mt-0.5">
          Enable PBR texture generation
        </p>
      </div>
      <label class="relative cursor-pointer">
        <input
          v-model="textureEnabled"
          type="checkbox"
          class="sr-only peer"
        >
        <div class="w-9 h-5 bg-dark-surface-alt border border-border rounded-full peer-checked:bg-primary/25 peer-checked:border-primary/40 transition-all duration-200" />
        <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-text-tertiary rounded-full transition-all duration-200 peer-checked:translate-x-4 peer-checked:bg-primary-light" />
      </label>
    </div>

    <!-- Model Version -->
    <div>
      <label class="block text-xs font-500 text-text-secondary mb-2.5 uppercase tracking-wider">
        {{ $t('generate.version') }}
      </label>
      <div class="relative">
        <button
          class="w-full flex items-center justify-between px-3 py-2.5 bg-dark-surface-alt/40 border border-border rounded-lg text-xs text-text hover:border-border-light transition-all duration-200"
          @click="versionOpen = !versionOpen"
        >
          <span class="flex items-center gap-2">
            {{ selectedVersionLabel }}
            <span
              v-if="versions.find(v => v.value === modelVersion)?.badge"
              class="px-1.5 py-0.5 bg-primary/15 text-primary-light text-[10px] rounded font-500"
            >
              {{ versions.find(v => v.value === modelVersion)?.badge }}
            </span>
          </span>
          <i class="i-carbon-chevron-down text-text-tertiary transition-transform duration-200" :class="{ 'rotate-180': versionOpen }" />
        </button>

        <!-- Dropdown -->
        <Transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <div
            v-if="versionOpen"
            class="absolute left-0 right-0 mt-1 bg-dark-surface border border-border rounded-lg shadow-xl shadow-black/30 overflow-hidden z-50"
          >
            <button
              v-for="ver in versions"
              :key="ver.value"
              class="w-full px-3 py-2.5 text-left text-xs flex items-center justify-between transition-colors duration-150"
              :class="modelVersion === ver.value ? 'bg-primary/10 text-primary-light' : 'text-text-secondary hover:bg-dark-surface-hover hover:text-text'"
              @click="selectVersion(ver.value)"
            >
              <span class="flex items-center gap-2">
                {{ ver.label }}
                <span
                  v-if="ver.badge"
                  class="px-1.5 py-0.5 bg-primary/15 text-primary-light text-[10px] rounded font-500"
                >
                  {{ ver.badge }}
                </span>
              </span>
              <i v-if="modelVersion === ver.value" class="i-carbon-checkmark text-primary-light" />
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
