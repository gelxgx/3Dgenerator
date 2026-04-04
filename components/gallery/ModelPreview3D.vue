<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const props = defineProps<{
  modelUrl: string
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const isLoading = ref(true)
let renderer: WebGLRenderer | null = null
let animFrameId: number
let controls: OrbitControls | null = null
let observer: IntersectionObserver | null = null
let initialized = false

function init(container: HTMLDivElement) {
  if (initialized) return
  initialized = true

  const canvas = document.createElement('canvas')
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.display = 'block'
  container.prepend(canvas)

  const width = container.clientWidth || 280
  const height = container.clientHeight || 280

  renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(new Color('#12121A'))

  const scene = new Scene()
  const camera = new PerspectiveCamera(45, width / height, 0.1, 100)
  camera.position.set(0, 1, 3.5)

  // Lights
  scene.add(new AmbientLight(0xffffff, 0.6))
  const mainLight = new DirectionalLight(0xffffff, 1.2)
  mainLight.position.set(3, 5, 4)
  scene.add(mainLight)
  const fillLight = new DirectionalLight(0x6C5CE7, 0.4)
  fillLight.position.set(-3, 2, -2)
  scene.add(fillLight)

  // Controls
  controls = new OrbitControls(camera, canvas)
  controls.autoRotate = true
  controls.autoRotateSpeed = 3
  controls.enableZoom = false
  controls.enablePan = false

  // Load model (Tripo GLBs use meshopt compression)
  const loader = new GLTFLoader()
  loader.setMeshoptDecoder(MeshoptDecoder)
  loader.load(
    props.modelUrl,
    (gltf) => {
      const model = gltf.scene
      const box3 = new Box3().setFromObject(model)
      const center = box3.getCenter(new Vector3())
      const size = box3.getSize(new Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 2.0 / (maxDim || 1)
      model.position.sub(center)
      model.scale.setScalar(scale)
      scene.add(model)
      isLoading.value = false
    },
    undefined,
    (err) => {
      console.error('GLTF load error:', err)
      isLoading.value = false
    },
  )

  // Handle resize
  const resizeObserver = new ResizeObserver((entries) => {
    const { width: w, height: h } = entries[0].contentRect
    if (w > 0 && h > 0 && renderer) {
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
  })
  resizeObserver.observe(container)

  function animate() {
    controls?.update()
    renderer!.render(scene, camera)
    animFrameId = requestAnimationFrame(animate)
  }
  animate()
}

onMounted(() => {
  if (!containerRef.value) return

  // Use IntersectionObserver to only init when visible
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && containerRef.value) {
        init(containerRef.value)
        observer?.disconnect()
        observer = null
      }
    },
    { threshold: 0.1 },
  )
  observer.observe(containerRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
  if (animFrameId)
    cancelAnimationFrame(animFrameId)
  controls?.dispose()
  renderer?.dispose()
})
</script>

<template>
  <div ref="containerRef" class="w-full h-full relative">
    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="absolute inset-0 flex-center bg-[#12121A]"
    >
      <div class="w-6 h-6 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
    </div>
  </div>
</template>
