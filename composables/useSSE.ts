interface UseSSEOptions {
  maxRetries?: number
  baseDelay?: number
}

export function useSSE(url: string, options: UseSSEOptions = {}) {
  const { maxRetries = 3, baseDelay = 1000 } = options

  const data = ref<any>(null)
  const status = ref<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const progress = ref(0)
  const error = ref<Error | null>(null)
  const eventSource = ref<EventSource | null>(null)

  let retryCount = 0
  let retryTimer: ReturnType<typeof setTimeout> | null = null

  function connect() {
    if (eventSource.value)
      disconnect()

    status.value = 'connecting'
    error.value = null

    try {
      eventSource.value = new EventSource(url)

      eventSource.value.onopen = () => {
        status.value = 'connected'
        retryCount = 0
      }

      eventSource.value.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data)
          data.value = parsed

          if (parsed.progress !== undefined) {
            progress.value = parsed.progress
          }
        }
        catch (e) {
          console.error('Failed to parse SSE message', e)
        }
      }

      eventSource.value.onerror = () => {
        eventSource.value?.close()
        eventSource.value = null

        if (retryCount < maxRetries) {
          status.value = 'connecting'
          const delay = baseDelay * 2 ** retryCount
          retryCount++
          retryTimer = setTimeout(() => connect(), delay)
        }
        else {
          status.value = 'error'
          error.value = new Error(`SSE connection failed after ${maxRetries} retries`)
        }
      }
    }
    catch (err) {
      status.value = 'error'
      error.value = err instanceof Error ? err : new Error('SSE connection failed')
    }
  }

  function disconnect() {
    if (retryTimer) {
      clearTimeout(retryTimer)
      retryTimer = null
    }
    if (eventSource.value) {
      eventSource.value.close()
      eventSource.value = null
    }
    retryCount = 0
    status.value = 'idle'
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    data: readonly(data),
    status: readonly(status),
    progress: readonly(progress),
    error: readonly(error),
    connect,
    disconnect,
  }
}
