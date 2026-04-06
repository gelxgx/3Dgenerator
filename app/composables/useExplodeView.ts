import type { Mesh, Object3D } from 'three'
import type { Ref, ShallowRef } from 'vue'
import { Box3, Vector3 } from 'three'

interface ExplodeMeshData {
  mesh: Mesh
  originalPosition: Vector3
  direction: Vector3
  distance: number
}

export function useExplodeView(scene: Ref<Object3D | null> | ShallowRef<Object3D | null>) {
  const explodeFactor = ref(0)
  const isExploded = ref(false)
  const meshCount = ref(0)
  const canExplode = computed(() => meshCount.value >= 2)

  let meshDataList: ExplodeMeshData[] = []

  function init(sceneObj: Object3D) {
    meshDataList = []

    const modelCenter = new Box3().setFromObject(sceneObj).getCenter(new Vector3())

    sceneObj.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh
        const worldPos = new Vector3()
        mesh.getWorldPosition(worldPos)
        const direction = worldPos.clone().sub(modelCenter)
        const distance = direction.length()

        if (distance > 0.001)
          direction.normalize()
        else
          direction.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()

        meshDataList.push({
          mesh,
          originalPosition: mesh.position.clone(),
          direction,
          distance: Math.max(distance, 0.3),
        })
      }
    })

    meshCount.value = meshDataList.length
  }

  function applyExplodeFactor(factor: number) {
    const scale = factor * 3

    for (const data of meshDataList) {
      const offset = data.direction.clone().multiplyScalar(data.distance * scale)
      data.mesh.position.copy(data.originalPosition).add(offset)
    }
  }

  function setExplodeFactor(factor: number) {
    explodeFactor.value = Math.max(0, Math.min(1, factor))
    applyExplodeFactor(explodeFactor.value)
  }

  async function toggleExplode() {
    if (!canExplode.value)
      return
    isExploded.value = !isExploded.value
    const target = isExploded.value ? 1 : 0

    const gsap = (window as unknown as Record<string, unknown>).gsap as {
      to: (target: object, vars: Record<string, unknown>) => void
    } | undefined

    if (gsap) {
      const proxy = { value: explodeFactor.value }
      gsap.to(proxy, {
        value: target,
        duration: 0.8,
        ease: 'power2.inOut',
        onUpdate: () => {
          explodeFactor.value = proxy.value
          applyExplodeFactor(proxy.value)
        },
      })
    }
    else {
      setExplodeFactor(target)
    }
  }

  function reset() {
    for (const data of meshDataList)
      data.mesh.position.copy(data.originalPosition)

    explodeFactor.value = 0
    isExploded.value = false
  }

  watch(scene, (newScene) => {
    if (newScene) {
      reset()
      init(newScene)
    }
  })

  return {
    explodeFactor: readonly(explodeFactor),
    isExploded: readonly(isExploded),
    canExplode,
    meshCount,
    toggleExplode,
    setExplodeFactor,
    reset,
  }
}
