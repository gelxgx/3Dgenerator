<script setup lang="ts">
import type { GalleryModel } from '~/types/model'

defineProps<{
  model: GalleryModel
}>()
</script>

<template>
  <NuxtLink
    :to="`/workspace/viewer/${model.id}`"
    class="group relative overflow-hidden rounded-2xl bg-dark-surface-alt/40 backdrop-blur-sm border border-border hover:border-primary/40 transition-all duration-400 cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
  >
    <!-- 3D Preview or Image Thumbnail -->
    <div class="relative w-full aspect-3/4 overflow-hidden bg-dark-surface">
      <!-- 3D Model Preview with Clip Reveal (if modelUrl is a GLB) -->
      <ModelPreview3D
        v-if="model.modelUrl && model.modelUrl.endsWith('.glb')"
        :model-url="model.modelUrl"
        :face-angle="model.faceAngle ?? 0"
        class="absolute inset-0"
      />

      <!-- Fallback image -->
      <img
        v-else
        :src="model.thumbnailUrl"
        :alt="model.name"
        class="w-full h-full object-cover"
        loading="lazy"
      >

      <!-- Bottom gradient overlay -->
      <div class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-dark-surface-alt/80 to-transparent pointer-events-none z-1" />

      <!-- Category badge -->
      <div class="absolute top-3 left-3 z-10">
        <span class="px-2.5 py-1 rounded-full text-xs font-500 bg-dark/60 backdrop-blur-md text-text-secondary border border-border/50">
          {{ model.category }}
        </span>
      </div>
    </div>

    <!-- Info -->
    <div class="p-4 space-y-2">
      <h3 class="text-sm font-600 text-text truncate group-hover:text-primary-light transition-colors duration-200">
        {{ model.name }}
      </h3>

      <div class="flex items-center justify-between">
        <p class="text-xs text-text-tertiary flex items-center gap-1.5">
          <i class="i-carbon-user-avatar text-xs" />
          {{ model.author }}
        </p>
        <div class="flex items-center gap-1 text-xs text-text-tertiary group-hover:text-primary-light transition-colors duration-200">
          <i class="i-carbon-favorite-filled text-xs" />
          {{ model.likes }}
        </div>
      </div>
    </div>

    <!-- Bottom glow line on hover -->
    <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
  </NuxtLink>
</template>
