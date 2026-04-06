<script setup lang="ts">
import type { Mesh, MeshStandardMaterial } from 'three'

const props = defineProps<{
  selectedMesh: Mesh | null
}>()

const { t } = useI18n()

const color = ref('#ffffff')
const roughness = ref(0.5)
const metalness = ref(0.5)
const opacity = ref(1.0)
const wireframe = ref(false)

let currentMaterial: MeshStandardMaterial | null = null

function getMaterial(mesh: Mesh): MeshStandardMaterial | null {
  const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
  if (mat && 'roughness' in mat)
    return mat as MeshStandardMaterial
  return null
}

watch(() => props.selectedMesh, (mesh) => {
  if (!mesh) {
    currentMaterial = null
    return
  }
  currentMaterial = getMaterial(mesh)
  if (currentMaterial) {
    color.value = `#${currentMaterial.color.getHexString()}`
    roughness.value = currentMaterial.roughness
    metalness.value = currentMaterial.metalness
    opacity.value = currentMaterial.opacity
    wireframe.value = currentMaterial.wireframe
  }
}, { immediate: true })

watch(color, (val) => {
  if (currentMaterial)
    currentMaterial.color.setStyle(val)
})
watch(roughness, (val) => {
  if (currentMaterial)
    currentMaterial.roughness = val
})
watch(metalness, (val) => {
  if (currentMaterial)
    currentMaterial.metalness = val
})
watch(opacity, (val) => {
  if (currentMaterial) {
    currentMaterial.opacity = val
    currentMaterial.transparent = val < 1
    currentMaterial.needsUpdate = true
  }
})
watch(wireframe, (val) => {
  if (currentMaterial)
    currentMaterial.wireframe = val
})
</script>

<template>
  <div class="p-4 space-y-4">
    <h4 class="text-sm font-600 text-text flex items-center gap-2">
      <i class="i-carbon-paint-brush text-primary-light" />
      {{ t('viewer.materialEditor') }}
    </h4>

    <template v-if="selectedMesh && currentMaterial">
      <div class="space-y-3">
        <div>
          <label class="text-[10px] text-text-tertiary uppercase tracking-wider font-500 mb-1.5 block">
            {{ t('viewer.color') }}
          </label>
          <div class="flex items-center gap-2">
            <input v-model="color" type="color" class="w-8 h-8 rounded border border-border cursor-pointer">
            <span class="text-xs text-text-secondary font-mono">{{ color }}</span>
          </div>
        </div>

        <div>
          <div class="flex justify-between mb-1">
            <label class="text-[10px] text-text-tertiary uppercase tracking-wider font-500">
              {{ t('viewer.roughness') }}
            </label>
            <span class="text-[10px] text-text-secondary tabular-nums">{{ roughness.toFixed(2) }}</span>
          </div>
          <input
            v-model.number="roughness"
            type="range"
            min="0"
            max="1"
            step="0.01"
            class="w-full h-1 bg-dark-surface-alt rounded-full appearance-none cursor-pointer accent-primary"
          >
        </div>

        <div>
          <div class="flex justify-between mb-1">
            <label class="text-[10px] text-text-tertiary uppercase tracking-wider font-500">
              {{ t('viewer.metalness') }}
            </label>
            <span class="text-[10px] text-text-secondary tabular-nums">{{ metalness.toFixed(2) }}</span>
          </div>
          <input
            v-model.number="metalness"
            type="range"
            min="0"
            max="1"
            step="0.01"
            class="w-full h-1 bg-dark-surface-alt rounded-full appearance-none cursor-pointer accent-primary"
          >
        </div>

        <div>
          <div class="flex justify-between mb-1">
            <label class="text-[10px] text-text-tertiary uppercase tracking-wider font-500">
              {{ t('viewer.opacity') }}
            </label>
            <span class="text-[10px] text-text-secondary tabular-nums">{{ opacity.toFixed(2) }}</span>
          </div>
          <input
            v-model.number="opacity"
            type="range"
            min="0"
            max="1"
            step="0.01"
            class="w-full h-1 bg-dark-surface-alt rounded-full appearance-none cursor-pointer accent-primary"
          >
        </div>

        <div class="flex items-center justify-between">
          <label class="text-[10px] text-text-tertiary uppercase tracking-wider font-500">
            {{ t('viewer.wireframe') }}
          </label>
          <button
            class="w-8 h-5 rounded-full transition-colors relative cursor-pointer"
            :class="wireframe ? 'bg-primary' : 'bg-dark-surface-alt border border-border'"
            @click="wireframe = !wireframe"
          >
            <span
              class="absolute w-3.5 h-3.5 bg-white rounded-full top-[3px] transition-transform"
              :class="wireframe ? 'translate-x-3.5' : 'translate-x-0.5'"
            />
          </button>
        </div>
      </div>
    </template>

    <div v-else class="text-text-tertiary text-xs flex items-center gap-2 py-2">
      <i class="i-carbon-information" />
      {{ t('viewer.materialEditorHint') }}
    </div>
  </div>
</template>
