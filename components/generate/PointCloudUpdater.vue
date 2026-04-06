<script setup lang="ts">
import type { Points, ShaderMaterial } from 'three'
import { useRenderLoop } from '@tresjs/core'
import { toRaw } from 'vue'

const props = defineProps<{
  points: Points
  material: ShaderMaterial
  progress: number
  maxParticles: number
}>()

const { onLoop } = useRenderLoop()

const rawMaterial = computed(() => toRaw(props.material))
const rawPoints = computed(() => toRaw(props.points))

let currentCount = 0

onLoop(({ delta }) => {
  const mat = rawMaterial.value
  const pts = rawPoints.value

  mat.uniforms.uTime.value += delta

  const targetProgress = props.progress / 100
  const currentProgress = mat.uniforms.uProgress.value
  mat.uniforms.uProgress.value += (targetProgress - currentProgress) * 0.04

  const targetCount = Math.floor(targetProgress * props.maxParticles)
  currentCount += (targetCount - currentCount) * 0.04
  const drawCount = Math.max(0, Math.round(currentCount))
  pts.geometry.setDrawRange(0, drawCount)

  pts.rotation.y += 0.001
})
</script>

<template>
  <slot />
</template>
