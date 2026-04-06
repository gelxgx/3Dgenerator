<script setup lang="ts">
/**
 * ModelPreview3D — 静态快照 + Clip Reveal 双图层预览
 *
 * 实现原理（逆向自 Tripo Studio）：
 * 1. 用 Three.js 加载 GLB 模型，渲染一帧截图后立即销毁 renderer（零持续 GPU 开销）
 * 2. 用 Clay 材质生成"灰色网格"图层
 * 3. mousemove 直接操作 CSS 变量 --cp 驱动 clip-path（绕过 Vue reactivity）
 *
 * 性能优化要点：
 * - 不使用 Vue ref 做 clip 位置追踪（避免每帧 reactive update + re-render）
 * - 直接 el.style.setProperty('--cp', ...) + CSS clip-path: polygon(... var(--cp) ...)
 * - 与 Tripo 完全一致的更新路径：JS → CSS Variable → GPU Composite
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

// 两张截图的 data URL（仅在截图完成时赋值一次，不参与交互更新）
const texturedImage = ref('')
const grayImage = ref('')

let initObserver: IntersectionObserver | null = null

// ---- 直接 DOM 操作的事件处理（绕过 Vue reactivity）----
let boundMove: ((e: MouseEvent) => void) | null = null
let boundEnter: (() => void) | null = null
let boundLeave: (() => void) | null = null

function setupClipEvents(container: HTMLDivElement) {
  boundMove = (e: MouseEvent) => {
    const rect = container.getBoundingClientRect()
    const pct = ((e.clientX - rect.left) / rect.width) * 100
    // 直接设置 CSS 变量，零 Vue 开销
    container.style.setProperty('--cp', `${Math.max(0, Math.min(100, pct))}%`)
  }

  boundEnter = () => {
    container.classList.add('is-hovering')
  }

  boundLeave = () => {
    container.classList.remove('is-hovering')
    container.style.setProperty('--cp', '0%')
  }

  container.addEventListener('mousemove', boundMove, { passive: true })
  container.addEventListener('mouseenter', boundEnter)
  container.addEventListener('mouseleave', boundLeave)
}

function teardownClipEvents(container: HTMLDivElement) {
  if (boundMove)
    container.removeEventListener('mousemove', boundMove)
  if (boundEnter)
    container.removeEventListener('mouseenter', boundEnter)
  if (boundLeave)
    container.removeEventListener('mouseleave', boundLeave)
  boundMove = boundEnter = boundLeave = null
}

/**
 * 渲染模型快照：加载 GLB → 渲染纹理图 → 切换灰色材质 → 渲染灰色图 → 销毁
 */
function renderSnapshots(container: HTMLDivElement) {
  const width = container.clientWidth || 280
  const height = container.clientHeight || 280

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

      // 应用朝向旋转
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

      // ---- 销毁 Three.js 资源 ----
      scene.traverse((obj) => {
        const mesh = obj as import('three').Mesh
        if (mesh.geometry)
          mesh.geometry.dispose()
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
          mats.forEach((m) => {
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

onMounted(() => {
  if (!containerRef.value)
    return

  // 初始化 CSS 变量
  containerRef.value.style.setProperty('--cp', '0%')

  // 绑定原生事件（绕过 Vue）
  setupClipEvents(containerRef.value)

  // IntersectionObserver 懒加载
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
  if (containerRef.value) {
    teardownClipEvents(containerRef.value)
  }
  initObserver?.disconnect()
})
</script>

<template>
  <div
    ref="containerRef"
    class="clip-reveal w-full h-full relative overflow-hidden"
  >
    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="absolute inset-0 flex-center bg-[#12121A]"
    >
      <div class="w-6 h-6 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
    </div>

    <!-- Layer 0: 灰色 Clay 图（左侧揭示） -->
    <div
      v-if="grayImage"
      class="clip-layer clip-layer--gray absolute inset-0 bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${grayImage})` }"
    />

    <!-- Layer 1: 纹理 PBR 图（右侧，默认全显示） -->
    <div
      v-if="texturedImage"
      class="clip-layer clip-layer--tex absolute inset-0 bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${texturedImage})` }"
    />
  </div>
</template>

<style scoped>
/*
 * 纯 CSS 驱动 clip-path —— 通过 CSS 变量 --cp 实时更新
 * JS 只需 el.style.setProperty('--cp', '...') 即可
 * 无 Vue re-render、无 JS clip-path 字符串拼接
 */
.clip-reveal {
  --cp: 0%;
}

/* 灰色图层：默认隐藏，hover 时从左侧展开到 --cp 位置 */
.clip-layer--gray {
  clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
  will-change: clip-path;
}

.clip-reveal.is-hovering .clip-layer--gray {
  clip-path: polygon(0 0, var(--cp) 0, var(--cp) 100%, 0 100%);
}

/* 纹理图层：默认全显示，hover 时从 --cp 位置显示到右侧 */
.clip-layer--tex {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
  will-change: clip-path;
}

.clip-reveal.is-hovering .clip-layer--tex {
  clip-path: polygon(var(--cp) 0, 100% 0, 100% 100%, var(--cp) 100%);
}
</style>
