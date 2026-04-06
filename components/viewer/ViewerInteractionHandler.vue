<script setup lang="ts">
import { useTresContext } from '@tresjs/core'
import type { Camera, Object3D } from 'three'
import type { Ref } from 'vue'
import type { MeshInfo } from '~/composables/useModelInteraction'

const props = defineProps<{
  scene: Object3D
}>()

const emit = defineEmits<{
  meshSelected: [info: MeshInfo | null]
}>()

const { camera, renderer } = useTresContext()

const canvasEl = computed(() => renderer.value?.domElement ?? null)

const {
  selectedMeshInfo,
  setup: setupInteraction,
  cleanup: cleanupInteraction,
} = useModelInteraction(
  toRef(() => props.scene),
  camera as Ref<Camera | null>,
  canvasEl,
)

watch(selectedMeshInfo, (info) => {
  emit('meshSelected', info ?? null)
})

onMounted(() => {
  setupInteraction()
})

onUnmounted(() => {
  cleanupInteraction()
})
</script>

<template>
  <slot />
</template>
