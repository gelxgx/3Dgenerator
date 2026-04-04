export function useAnimatedNumber(target: Ref<number> | (() => number), duration = 800) {
  const displayed = ref(0)
  let animFrameId: number | null = null
  let startTime: number | null = null
  let startValue = 0
  let endValue = 0

  function easeOutCubic(t: number): number {
    return 1 - (1 - t) ** 3
  }

  function animate(timestamp: number) {
    if (!startTime)
      startTime = timestamp
    const elapsed = timestamp - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easedProgress = easeOutCubic(progress)

    displayed.value = Math.round(startValue + (endValue - startValue) * easedProgress)

    if (progress < 1) {
      animFrameId = requestAnimationFrame(animate)
    }
  }

  function startAnimation(newTarget: number) {
    if (animFrameId)
      cancelAnimationFrame(animFrameId)
    startValue = displayed.value
    endValue = newTarget
    startTime = null
    animFrameId = requestAnimationFrame(animate)
  }

  const targetRef = typeof target === 'function' ? computed(target) : target

  watch(targetRef, (val) => {
    if (val !== displayed.value) {
      startAnimation(val)
    }
  }, { immediate: true })

  onUnmounted(() => {
    if (animFrameId)
      cancelAnimationFrame(animFrameId)
  })

  return readonly(displayed)
}
