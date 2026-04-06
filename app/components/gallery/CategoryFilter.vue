<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: string
  }>(),
  {
    modelValue: 'all',
  },
)

const emit = defineEmits<{
  select: [category: string]
}>()

const categories = [
  { key: 'all', icon: 'i-carbon-grid' },
  { key: 'character', icon: 'i-carbon-user-avatar' },
  { key: 'animal', icon: 'i-carbon-bee' },
  { key: 'architecture', icon: 'i-carbon-building' },
  { key: 'furniture', icon: 'i-carbon-workspace' },
]

const activeCategory = computed(() => props.modelValue)
</script>

<template>
  <div class="flex gap-2 overflow-x-auto px-6 py-5 scrollbar-hide">
    <button
      v-for="cat in categories"
      :key="cat.key"
      class="relative px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-300 font-500 text-sm flex items-center gap-2 shrink-0"
      :class="[
        activeCategory === cat.key
          ? 'bg-primary/15 text-primary-light border border-primary/30 shadow-sm shadow-primary/10'
          : 'bg-dark-surface-alt/40 text-text-secondary border border-border hover:text-text hover:bg-dark-surface-hover hover:border-border-light',
      ]"
      @click="emit('select', cat.key)"
    >
      <i :class="cat.icon" class="text-sm" />
      {{ $t(`gallery.${cat.key}`) }}
    </button>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
