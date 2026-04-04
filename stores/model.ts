import { defineStore } from 'pinia'
import type { GenerateParams, ModelTask } from '~/types/model'

const STORAGE_KEY = '3dgen_history'

function loadFromStorage(): ModelTask[] {
  if (import.meta.server) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  }
  catch {
    return []
  }
}

function saveToStorage(models: ModelTask[]) {
  if (import.meta.server) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(models))
  }
  catch { /* quota exceeded, silently fail */ }
}

export const useModelStore = defineStore('model', () => {
  const currentTask = ref<ModelTask | null>(null)
  const isGenerating = ref(false)
  const progress = ref(0)
  const generatedModels = ref<ModelTask[]>(loadFromStorage())
  const error = ref<string | null>(null)

  const hasModel = computed(() => !!currentTask.value?.modelUrl)

  // Auto-save whenever generatedModels changes
  watch(generatedModels, (val) => {
    saveToStorage(val)
  }, { deep: true })

  function getModelById(id: string): ModelTask | null {
    if (currentTask.value?.id === id)
      return currentTask.value
    return generatedModels.value.find(m => m.id === id) || null
  }

  async function startGeneration(params: GenerateParams) {
    isGenerating.value = true
    progress.value = 0
    error.value = null
    currentTask.value = null

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        throw new Error('Failed to start generation')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response stream')
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done)
          break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'progress') {
                progress.value = data.progress
              }
              else if (data.type === 'complete') {
                currentTask.value = data.task
                generatedModels.value.push(data.task)
                progress.value = 100
                isGenerating.value = false
              }
              else if (data.type === 'error') {
                error.value = data.message
                isGenerating.value = false
              }
            }
            catch (e) {
              console.error('Failed to parse SSE data', e)
            }
          }
        }
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      isGenerating.value = false
    }
  }

  function removeModel(id: string) {
    const idx = generatedModels.value.findIndex(m => m.id === id)
    if (idx !== -1) {
      generatedModels.value.splice(idx, 1)
    }
  }

  function reset() {
    currentTask.value = null
    isGenerating.value = false
    progress.value = 0
    error.value = null
  }

  function clearError() {
    error.value = null
  }

  return {
    currentTask,
    isGenerating,
    progress,
    generatedModels,
    error,
    hasModel,
    getModelById,
    startGeneration,
    removeModel,
    reset,
    clearError,
  }
})
