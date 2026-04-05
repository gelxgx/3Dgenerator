<script setup lang="ts">
/**
 * ModelPreview3D — 静态快照 + Clip Reveal 双图层预览
 *
 * 实现原理（逆向自 Tripo Studio）：
 * 1. 用 Three.js 加载 GLB 模型，渲染一帧截图后立即销毁 renderer（零持续 GPU 开销）
 * 2. 用 CSS grayscale filter 生成"灰色网格"图层
 * 3. mousemove 驱动 CSS clip-path 实现左右分割揭示效果
 *
 * 性能对比：
 * - 旧方案：每张卡片一个 WebGLRenderer + requestAnimationFrame 持续渲染
 * - 新方案：渲染一次 → 截图 → 销毁 → 纯 CSS 交互（零 GPU 持续消耗）
 */
import { onMounted, onUnmounted, ref } from 'vue'
import {
  AmbientLight,
  Box3,
  Color,
  DirectionalLight,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import type { Mesh } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const props = withDefaults(defineProps<{
  modelUrl: string
  /** Y 轴旋转角度（度），调整模型正面朝向 */
  faceAngle?: number
}>(), {
  faceAngle: 0,
})

const containerRef = ref<HTMLDivElement | null>(null)
const isLoading = ref(true)

// 两张截图的 data URL
const texturedImage = ref('')
const grayImage = ref('')

// Clip 位置（0-100%）
const clipPosition = ref(0)
const isHovering = ref(false)

let initObserver: IntersectionObserver | null = null

/**
 * 渲染模型快照：加载 GLB → 渲染纹理图 → 切换灰色材质 → 渲染灰色图 → 销毁
 */
function renderSnapshots(container: HTMLDivElement) {
  const width = container.clientWidth || 280
  const height = container.clientHeight || 280

  // 创建离屏 canvas（不需要添加到 DOM）
  const canvas = document.createElement('canvas')
  canvas.width = width * Math.min(window.devicePixelRatio, 1.5)
  canvas.height = height * Math.min(window.devicePixelRatio, 1.5)

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.setClearColor(new Color('#12121A'))

  const scene = new Scene()
  const camera = new PerspectiveCamera(45, width / height, 0.1, 100)
  camera.position.set(0, 1, 3.5)
  camera.lookAt(0, 0, 0)

  // 灯光
  scene.add(new AmbientLight(0xFFFFFF, 0.6))
  const mainLight = new DirectionalLight(0xFFFFFF, 1.2)
  mainLight.position.set(3, 5, 4)
  scene.add(mainLight)
  const fillLight = new DirectionalLight(0x6C5CE7, 0.4)
  fillLight.position.set(-3, 2, -2)
  scene.add(fillLight)

  // 加载模型
  const loader = new GLTFLoader()
  loader.setMeshoptDecoder(MeshoptDecoder)
  loader.load(
    props.modelUrl,
    (gltf) => {
      const model = gltf.scene

      // 居中缩放
      const box3 = new Box3().setFromObject(model)
      const center = box3.getCenter(new Vector3())
      const size = box3.getSize(new Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 2.0 / (maxDim || 1)
      model.position.sub(center)
      model.scale.setScalar(scale)

      // 应用朝向旋转（让模型正面面向相机）
      if (props.faceAngle !== 0) {
        model.rotation.y = (props.faceAngle * Math.PI) / 180
      }

      scene.add(model)

      // ---- 第一帧：纹理渲染 ----
      renderer.render(scene, camera)
      texturedImage.value = canvas.toDataURL('image/webp', 0.85)

      // ---- 第二帧：灰色材质渲染 ----
      const originalMaterials = new Map<Mesh, any>()
      const clayMaterial = new MeshStandardMaterial({
        color: 0xCCCCCC,
        roughness: 0.7,
        metalness: 0.1,
      })

      model.traverse((child) => {
        if ((child as Mesh).isMesh) {
          const mesh = child as Mesh
          originalMaterials.set(mesh, mesh.material)
          mesh.material = clayMaterial
        }
      })

      renderer.render(scene, camera)
      grayImage.value = canvas.toDataURL('image/webp', 0.85)

      // 清理
      clayMaterial.dispose()
      originalMaterials.forEach((mat, mesh) => {
        mesh.material = mat
      })

      isLoading.value = false

      // ---- 销毁 Three.js 资源（核心性能优化）----
      scene.traverse((obj: any) => {
        if (obj.geometry)
          obj.geometry.dispose()
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          mats.forEach((m: any) => {
            m.map?.dispose()
            m.normalMap?.dispose()
            m.roughnessMap?.dispose()
            m.metalnessMap?.dispose()
            m.aoMap?.dispose()
            m.dispose()
          })
        }
      })
      renderer.dispose()
      renderer.forceContextLoss()
    },
    undefined,
    (err) => {
      console.error('GLTF snapshot error:', err)
      isLoading.value = false
    },
  )
}

// ---- Clip Reveal 鼠标交互 ----
function onMouseMove(e: MouseEvent) {
  if (!containerRef.value)
    return
  const rect = containerRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  clipPosition.value = Math.max(0, Math.min(100, (x / rect.width) * 100))
}

function onMouseEnter() {
  isHovering.value = true
}

function onMouseLeave() {
  isHovering.value = false
  clipPosition.value = 0
}

onMounted(() => {
  if (!containerRef.value)
    return

  // IntersectionObserver 懒加载：首次可见时才渲染截图
  initObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && containerRef.value) {
        renderSnapshots(containerRef.value)
        initObserver?.disconnect()
        initObserver = null
      }
    },
    { threshold: 0.1 },
  )
  initObserver.observe(containerRef.value)
})

onUnmounted(() => {
  initObserver?.disconnect()
})
</script>

<template>
  <div
    ref="containerRef"
    class="w-full h-full relative overflow-hidden"
    @mousemove="onMouseMove"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="absolute inset-0 flex-center bg-[#12121A]"
    >
      <div class="w-6 h-6 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
    </div>

    <!-- Layer 0: 灰色网格图（左侧，跟随鼠标揭示） -->
    <div
      v-if="grayImage"
      class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-[clip-path] duration-75 ease-linear"
      :style="{
        backgroundImage: `url(${grayImage})`,
        clipPath: isHovering
          ? `polygon(0 0, ${clipPosition}% 0, ${clipPosition}% 100%, 0 100%)`
          : 'polygon(0 0, 0 0, 0 100%, 0 100%)',
      }"
    />

    <!-- Layer 1: 纹理渲染图（右侧，默认全显示） -->
    <div
      v-if="texturedImage"
      class="absolute inset-0 bg-cover bg-center bg-no-repeat transition-[clip-path] duration-75 ease-linear"
      :style="{
        backgroundImage: `url(${texturedImage})`,
        clipPath: isHovering
          ? `polygon(${clipPosition}% 0, 100% 0, 100% 100%, ${clipPosition}% 100%)`
          : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
      }"
    />
  </div>
</template>
