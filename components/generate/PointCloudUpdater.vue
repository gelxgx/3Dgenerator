<script setup lang="ts">
import type { Points, ShaderMaterial } from 'three'
import { useRenderLoop } from '@tresjs/core'
import { toRaw } from 'vue'

const props = defineProps<{
  points: Points
  material: ShaderMaterial
  progress: number
}>()

const { onLoop } = useRenderLoop()

const rawMaterial = computed(() => toRaw(props.material))
const rawPoints = computed(() => toRaw(props.points))

onLoop(({ delta }) => {
  const mat = rawMaterial.value
  const pts = rawPoints.value
  mat.uniforms.uTime.value += delta
  mat.uniforms.uProgress.value = props.progress / 100
  pts.rotation.y += 0.003
})
</script>

<template>
  <slot />
</template>
