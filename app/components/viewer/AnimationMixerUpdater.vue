<script setup lang="ts">
import { useLoop } from '@tresjs/core'

const props = defineProps<{
  updateFn: (delta: number) => void
}>()

const { onBeforeRender } = useLoop()

onBeforeRender(({ delta }) => {
  props.updateFn(delta)
})
</script>

<template>
  <slot />
</template>
