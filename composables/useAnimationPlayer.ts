import type { AnimationAction, AnimationClip, AnimationMixer } from 'three'
import type { Ref } from 'vue'

export interface ClipInfo {
  name: string
  duration: number
}

export function useAnimationPlayer(gltf: Ref<any | null>) {
  const mixer = shallowRef<AnimationMixer | null>(null)
  const clips = ref<ClipInfo[]>([])
  const currentClipName = ref('')
  const isPlaying = ref(false)
  const playbackSpeed = ref(1)
  const currentTime = ref(0)
  const duration = ref(0)
  const hasAnimations = computed(() => clips.value.length > 0)

  let currentAction: AnimationAction | null = null
  let allClips: AnimationClip[] = []

  async function init(gltfData: any) {
    const { AnimationMixer: AM } = await import('three')

    if (mixer.value)
      mixer.value.stopAllAction()

    mixer.value = new AM(gltfData.scene)
    allClips = gltfData.animations || []

    clips.value = allClips.map(c => ({
      name: c.name || 'Unnamed',
      duration: c.duration,
    }))

    if (allClips.length > 0)
      selectClip(allClips[0].name || 'Unnamed')
  }

  function selectClip(name: string) {
    if (!mixer.value)
      return

    if (currentAction)
      currentAction.stop()

    const clip = allClips.find(c => (c.name || 'Unnamed') === name)
    if (!clip)
      return

    currentClipName.value = name
    duration.value = clip.duration
    currentAction = mixer.value.clipAction(clip)
    currentAction.play()
    isPlaying.value = true
  }

  function play() {
    if (currentAction) {
      currentAction.paused = false
      isPlaying.value = true
    }
  }

  function pause() {
    if (currentAction) {
      currentAction.paused = true
      isPlaying.value = false
    }
  }

  function togglePlay() {
    if (isPlaying.value)
      pause()
    else
      play()
  }

  function setSpeed(speed: number) {
    playbackSpeed.value = speed
    if (currentAction)
      currentAction.timeScale = speed
  }

  function seek(time: number) {
    if (currentAction && mixer.value) {
      currentAction.time = time
      mixer.value.update(0)
      currentTime.value = time
    }
  }

  function update(delta: number) {
    if (mixer.value && isPlaying.value) {
      mixer.value.update(delta)
      if (currentAction)
        currentTime.value = currentAction.time % (duration.value || 1)
    }
  }

  function dispose() {
    if (currentAction)
      currentAction.stop()
    if (mixer.value)
      mixer.value.stopAllAction()
    mixer.value = null
    clips.value = []
    currentAction = null
    allClips = []
  }

  watch(gltf, (g) => {
    if (g)
      init(g)
    else
      dispose()
  })

  return {
    clips: readonly(clips),
    currentClipName: readonly(currentClipName),
    isPlaying: readonly(isPlaying),
    playbackSpeed,
    currentTime: readonly(currentTime),
    duration: readonly(duration),
    hasAnimations,
    selectClip,
    play,
    pause,
    togglePlay,
    setSpeed,
    seek,
    update,
  }
}
