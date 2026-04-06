<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: string
  }>(),
  {
    modelValue: '',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const inputMode = ref<'text' | 'image'>('text')
const isDragging = ref(false)

const prompt = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
  },
})

const charPercent = computed(() => Math.min((prompt.value.length / 1000) * 100, 100))
const isNearLimit = computed(() => prompt.value.length > 900)
</script>

<template>
  <div class="space-y-3 max-w-full">
    <!-- Mode Toggle - pill style -->
    <div class="inline-flex rounded-lg border border-border overflow-hidden">
      <button
        class="px-4 py-1.5 text-xs font-500 flex items-center gap-1.5 transition-all duration-200"
        :class="[
          inputMode === 'text'
            ? 'bg-primary/12 text-primary-light'
            : 'bg-transparent text-text-tertiary hover:text-text-secondary hover:bg-dark-surface-alt/40',
        ]"
        @click="inputMode = 'text'"
      >
        <i class="i-carbon-text-long-paragraph text-xs" />
        Text
      </button>
      <button
        class="px-4 py-1.5 text-xs font-500 flex items-center gap-1.5 transition-all duration-200 border-l border-border"
        :class="[
          inputMode === 'image'
            ? 'bg-primary/12 text-primary-light'
            : 'bg-transparent text-text-tertiary hover:text-text-secondary hover:bg-dark-surface-alt/40',
        ]"
        @click="inputMode = 'image'"
      >
        <i class="i-carbon-image text-xs" />
        Image
      </button>
    </div>

    <!-- Text Input -->
    <div v-if="inputMode === 'text'" class="relative w-full box-border">
      <textarea
        v-model="prompt"
        :placeholder="$t('generate.promptPlaceholder')"
        class="w-full h-32 resize-none rounded-lg bg-dark-surface-alt/40 border border-border text-text text-sm placeholder-text-tertiary/60 px-3 py-2.5 leading-relaxed focus:outline-none focus:border-primary/40 transition-all duration-200 box-border"
        maxlength="1000"
      />
      <!-- Character count -->
      <div class="absolute bottom-2 right-2.5 flex items-center gap-1.5">
        <div
          v-if="prompt.length > 0"
          class="w-3.5 h-3.5 relative"
        >
          <svg class="w-3.5 h-3.5 -rotate-90" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2" class="text-dark-surface-alt" />
            <circle
              cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2"
              :stroke-dasharray="`${charPercent * 0.377} 100`"
              :class="isNearLimit ? 'text-warning' : 'text-primary/60'"
            />
          </svg>
        </div>
        <span class="text-[10px] tabular-nums" :class="isNearLimit ? 'text-warning' : 'text-text-tertiary/40'">
          {{ prompt.length }}/1000
        </span>
      </div>
    </div>

    <!-- Image Upload Area -->
    <div
      v-else
      class="relative w-full h-32 border border-dashed rounded-lg flex-col-center transition-all duration-300 cursor-pointer box-border"
      :class="isDragging
        ? 'border-primary bg-primary/8 text-primary-light'
        : 'border-border text-text-tertiary hover:border-primary/30 hover:text-text-secondary hover:bg-dark-surface-alt/30'"
      @dragenter.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @dragover.prevent
      @drop.prevent="isDragging = false"
    >
      <i class="i-carbon-cloud-upload text-xl mb-2 opacity-60" />
      <p class="text-xs font-500">
        Drop image or click to upload
      </p>
      <p class="text-[10px] text-text-tertiary/50 mt-1">
        JPG, PNG, WEBP (max 10MB)
      </p>
    </div>
  </div>
</template>
