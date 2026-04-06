<script setup lang="ts">
import { OrbitControls } from '@tresjs/cientos'
import type { Group } from 'three'
import { Box3, Vector3 } from 'three'
import { toRaw } from 'vue'
import type { MeshInfo } from '~/composables/useModelInteraction'

const props = withDefaults(defineProps<{
  modelUrl: string | null
  materialMode?: string
  showGrid?: boolean
}>(), {
  materialMode: 'originalPbr',
  showGrid: true,
})

const emit = defineEmits<{
  meshSelected: [info: MeshInfo | null]
}>()

const { model, isLoading, error: loadError } = useGLTFLoader(toRef(() => props.modelUrl))

const modelScene = shallowRef<Group | null>(null)

watch(model, (gltf) => {
  if (!gltf) {
    modelScene.value = null
    return
  }

  const scene = toRaw(gltf).scene
  if (!scene) {
    modelScene.value = null
    return
  }

  const box3 = new Box3().setFromObject(scene)
  const center = box3.getCenter(new Vector3())
  scene.position.sub(center)

  modelScene.value = scene as Group
}, { immediate: true })

const materialModeRef = toRef(() => props.materialMode)
useMaterialSwitcher(modelScene, materialModeRef)

defineExpose({
  modelScene,
  model,
})
</script>

<template>
  <ClientOnly>
    <div class="w-full h-full relative">
      <TresCanvas
        v-if="modelUrl"
        clear-color="#0A0A0F"
      >
        <TresPerspectiveCamera
          :position="[0, 2, 5]"
          :fov="50"
        />

        <OrbitControls
          :auto-rotate="false"
          :enable-zoom="true"
          :enable-pan="true"
          :enable-damping="true"
          :damping-factor="0.08"
        />

        <TresAmbientLight :intensity="0.6" />
        <TresDirectionalLight
          :position="[5, 10, 7]"
          :intensity="1.2"
        />
        <TresDirectionalLight
          :position="[-5, 3, -3]"
          :intensity="0.4"
          color="#6C5CE7"
        />

        <TresGridHelper v-if="showGrid" :args="[10, 10, '#1A1A2E', '#151528']" />

        <primitive v-if="!isLoading && modelScene" :object="modelScene" />

        <ViewerInteractionHandler
          v-if="modelScene"
          :scene="modelScene"
          @mesh-selected="(info) => emit('meshSelected', info)"
        />
      </TresCanvas>

      <!-- Empty state -->
      <div
        v-if="!modelUrl"
        class="w-full h-full flex-col-center text-text-tertiary"
      >
        <div class="w-20 h-20 rounded-2xl bg-dark-surface-alt/60 flex-center mb-5 border border-border">
          <i class="i-carbon-cube text-3xl" />
        </div>
        <p class="text-text-secondary font-500">
          {{ $t('viewer.noModel') }}
        </p>
      </div>

      <!-- Loading Overlay -->
      <div
        v-if="isLoading"
        class="absolute inset-0 bg-dark/60 backdrop-blur-sm flex-col-center z-10"
      >
        <div class="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <p class="text-text-secondary text-sm">
          {{ $t('common.loading') }}
        </p>
      </div>

      <!-- Error Display -->
      <div
        v-if="loadError"
        class="absolute inset-0 bg-dark/80 backdrop-blur-md flex-col-center text-center px-4 z-10"
      >
        <div class="w-14 h-14 rounded-2xl bg-error/10 flex-center mb-4">
          <i class="i-carbon-warning-filled text-2xl text-error" />
        </div>
        <p class="text-text text-sm font-500 mb-2">
          {{ $t('viewer.loadFailed') }}
        </p>
        <p class="text-text-tertiary text-xs max-w-sm">
          {{ loadError }}
        </p>
      </div>
    </div>
  </ClientOnly>
</template>
