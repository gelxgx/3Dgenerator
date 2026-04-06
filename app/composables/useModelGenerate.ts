export function useModelGenerate() {
  const modelStore = useModelStore()

  async function startGeneration(params: GenerateParams) {
    await modelStore.startGeneration(params)
  }

  return {
    isGenerating: computed(() => modelStore.isGenerating),
    progress: computed(() => modelStore.progress),
    currentTask: computed(() => modelStore.currentTask),
    error: computed(() => modelStore.error),
    hasModel: computed(() => modelStore.hasModel),
    startGeneration,
    reset: () => modelStore.reset(),
    clearError: () => modelStore.clearError(),
  }
}
