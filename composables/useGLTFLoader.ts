import type { Ref } from 'vue'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

export function useGLTFLoader(modelUrl: Ref<string | null> | (() => string | null)) {
  const model = shallowRef<GLTF | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const progress = ref(0)

  async function load(url: string) {
    isLoading.value = true
    error.value = null
    progress.value = 0

    try {
      // Dynamic import to ensure client-only
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js')

      const loader = new GLTFLoader()

      // Setup DRACO decoder
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
      loader.setDRACOLoader(dracoLoader)

      // Setup Meshopt decoder (Tripo GLBs use meshopt compression)
      const { MeshoptDecoder } = await import('three/examples/jsm/libs/meshopt_decoder.module.js')
      loader.setMeshoptDecoder(MeshoptDecoder)

      // Load the model with Promise wrapper
      const gltf = await new Promise<GLTF>((resolve, reject) => {
        loader.load(
          url,
          gltf => resolve(gltf),
          (progressEvent) => {
            if (progressEvent.lengthComputable) {
              progress.value = Math.round((progressEvent.loaded / progressEvent.total) * 100)
            }
          },
          err => reject(err),
        )
      })

      model.value = gltf
      progress.value = 100
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load model'
      console.error('GLTF load error:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  // Watch the url ref for changes
  const urlRef = typeof modelUrl === 'function' ? computed(modelUrl) : modelUrl

  watch(urlRef, (newUrl) => {
    if (newUrl) {
      load(newUrl)
    }
    else {
      model.value = null
    }
  }, { immediate: true })

  return {
    model,
    isLoading: readonly(isLoading),
    error: readonly(error),
    progress: readonly(progress),
  }
}
