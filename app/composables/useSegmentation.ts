import type { Material, Mesh, Object3D } from 'three'
import type { Ref, ShallowRef } from 'vue'
import { Color, MeshStandardMaterial } from 'three'

export interface Segment {
  name: string
  color: string
  faceCount: number
  vertexCount: number
  visible: boolean
}

export function useSegmentation(scene: Ref<Object3D | null> | ShallowRef<Object3D | null>) {
  const segments = ref<Segment[]>([])
  const isActive = ref(false)

  const originalMaterials = new WeakMap<Mesh, Material | Material[]>()
  const segmentMaterials: MeshStandardMaterial[] = []
  let meshes: Mesh[] = []

  function activate() {
    if (!scene.value || isActive.value)
      return
    meshes = []

    scene.value.traverse((child) => {
      if ((child as Mesh).isMesh && !child.userData.__helper && !child.userData.__measureHelper)
        meshes.push(child as Mesh)
    })

    segments.value = meshes.map((mesh, i) => {
      if (!originalMaterials.has(mesh))
        originalMaterials.set(mesh, mesh.material)

      const hue = (i / meshes.length) * 360
      const color = `hsl(${hue}, 70%, 55%)`
      const threeColor = new Color(color)
      const mat = new MeshStandardMaterial({
        color: threeColor,
        roughness: 0.6,
        metalness: 0.1,
      })
      segmentMaterials.push(mat)
      mesh.material = mat

      const geo = mesh.geometry
      const pos = geo.attributes.position
      const faceCount = pos
        ? (geo.index
            ? geo.index.count / 3
            : pos.count / 3)
        : 0

      return {
        name: mesh.name || `Part ${i + 1}`,
        color,
        faceCount: Math.floor(faceCount),
        vertexCount: pos?.count ?? 0,
        visible: true,
      }
    })

    isActive.value = true
  }

  function deactivate() {
    if (!isActive.value)
      return

    meshes.forEach((mesh) => {
      const original = originalMaterials.get(mesh)
      if (original)
        mesh.material = original
    })

    segmentMaterials.forEach(m => m.dispose())
    segmentMaterials.length = 0
    segments.value = []
    meshes = []
    isActive.value = false
  }

  function toggle() {
    if (isActive.value)
      deactivate()
    else
      activate()
  }

  function toggleVisibility(index: number) {
    const seg = segments.value[index]
    if (!seg || !meshes[index])
      return
    seg.visible = !seg.visible
    meshes[index].visible = seg.visible
  }

  function highlightSegment(index: number) {
    if (segmentMaterials[index])
      segmentMaterials[index].emissive.setHex(0x333333)
  }

  function unhighlightSegment(index: number) {
    if (segmentMaterials[index])
      segmentMaterials[index].emissive.setHex(0x000000)
  }

  return {
    segments: readonly(segments),
    isActive: readonly(isActive),
    activate,
    deactivate,
    toggle,
    toggleVisibility,
    highlightSegment,
    unhighlightSegment,
  }
}
