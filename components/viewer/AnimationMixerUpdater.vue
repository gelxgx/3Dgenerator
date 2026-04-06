<script setup lang="ts">
import { useRenderLoop } from '@tresjs/core'

const props = defineProps<{
  updateFn: (delta: number) => void
}>()

const { onLoop } = useRenderLoop()

onLoop(({ delta }) => {
  props.updateFn(delta)
})
</script>

<template>
  <slot />
</template>
