import type { Camera, Mesh, Object3D } from 'three'
import type { Ref, ShallowRef } from 'vue'
import {
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Raycaster,
  Vector2,
} from 'three'

export interface MeshInfo {
  name: string
  faceCount: number
  vertexCount: number
  materialName: string
}

export function useModelInteraction(
  scene: Ref<Object3D | null> | ShallowRef<Object3D | null>,
  camera: Ref<Camera | null>,
  domElement: Ref<HTMLCanvasElement | null>,
) {
  const selectedMesh = shallowRef<Mesh | null>(null)
  const hoveredMesh = shallowRef<Mesh | null>(null)
  const selectedMeshInfo = ref<MeshInfo | null>(null)
  const isEnabled = ref(true)

  const raycaster = new Raycaster()
  const mouse = new Vector2()

  let cachedMeshes: Mesh[] = []
  let hoverOutline: LineSegments | null = null
  let selectOutline: LineSegments | null = null
  let moveRafId: number | null = null

  const HIGHLIGHT_COLOR = 0x6C5CE7
  const EDGE_THRESHOLD_ANGLE = 15

  function cacheMeshes(obj: Object3D) {
    cachedMeshes = []
    obj.traverse((child) => {
      if ((child as Mesh).isMesh)
        cachedMeshes.push(child as Mesh)
    })
  }

  function getMeshInfo(mesh: Mesh): MeshInfo {
    const geo = mesh.geometry
    const pos = geo.attributes.position
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    if (!pos) {
      return {
        name: mesh.name || 'Unnamed Mesh',
        faceCount: 0,
        vertexCount: 0,
        materialName: mat?.name || mat?.type || 'Unknown',
      }
    }
    const faceCount = geo.index
      ? geo.index.count / 3
      : pos.count / 3
    const vertexCount = pos.count
    return {
      name: mesh.name || 'Unnamed Mesh',
      faceCount: Math.floor(faceCount),
      vertexCount,
      materialName: mat?.name || mat?.type || 'Unknown',
    }
  }

  function createOutline(mesh: Mesh, color: number): LineSegments {
    const edgesGeo = new EdgesGeometry(mesh.geometry, EDGE_THRESHOLD_ANGLE)
    const edgesMat = new LineBasicMaterial({ color, linewidth: 1 })
    const outline = new LineSegments(edgesGeo, edgesMat)
    outline.raycast = () => {}
    mesh.add(outline)
    return outline
  }

  function removeOutline(outline: LineSegments | null): null {
    if (outline) {
      outline.parent?.remove(outline)
      outline.geometry.dispose()
      ;(outline.material as LineBasicMaterial).dispose()
    }
    return null
  }

  function updateMousePosition(e: MouseEvent) {
    const el = domElement.value
    if (!el)
      return
    const rect = el.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  }

  function performRaycast(): Mesh | null {
    if (!camera.value || cachedMeshes.length === 0)
      return null
    raycaster.setFromCamera(mouse, camera.value)
    const intersects = raycaster.intersectObjects(cachedMeshes, false)
    const hit = intersects[0]
    return hit ? (hit.object as Mesh) : null
  }

  function handlePointerMove(e: MouseEvent) {
    if (!isEnabled.value)
      return
    if (moveRafId !== null)
      return
    moveRafId = requestAnimationFrame(() => {
      moveRafId = null
      updateMousePosition(e)
      const hit = performRaycast()

      if (hit !== hoveredMesh.value) {
        if (hoveredMesh.value && hoveredMesh.value !== selectedMesh.value)
          hoverOutline = removeOutline(hoverOutline)

        hoveredMesh.value = hit
        if (hit && hit !== selectedMesh.value)
          hoverOutline = createOutline(hit, HIGHLIGHT_COLOR)
      }
    })
  }

  function handleClick(e: MouseEvent) {
    if (!isEnabled.value)
      return
    updateMousePosition(e)
    const hit = performRaycast()

    selectOutline = removeOutline(selectOutline)
    hoverOutline = removeOutline(hoverOutline)

    if (hit) {
      selectedMesh.value = hit
      selectedMeshInfo.value = getMeshInfo(hit)
      selectOutline = createOutline(hit, HIGHLIGHT_COLOR)
    }
    else {
      selectedMesh.value = null
      selectedMeshInfo.value = null
    }
  }

  function setup() {
    const el = domElement.value
    if (!el)
      return
    el.addEventListener('pointermove', handlePointerMove, { passive: true })
    el.addEventListener('click', handleClick)
  }

  function cleanup() {
    const el = domElement.value
    if (el) {
      el.removeEventListener('pointermove', handlePointerMove)
      el.removeEventListener('click', handleClick)
    }
    if (moveRafId !== null)
      cancelAnimationFrame(moveRafId)
    hoverOutline = removeOutline(hoverOutline)
    selectOutline = removeOutline(selectOutline)
  }

  function clearSelection() {
    selectOutline = removeOutline(selectOutline)
    hoverOutline = removeOutline(hoverOutline)
    selectedMesh.value = null
    selectedMeshInfo.value = null
    hoveredMesh.value = null
  }

  watch(scene, (newScene) => {
    if (newScene) {
      cacheMeshes(newScene)
      clearSelection()
    }
  })

  return {
    selectedMesh: readonly(selectedMesh),
    hoveredMesh: readonly(hoveredMesh),
    selectedMeshInfo: readonly(selectedMeshInfo),
    isEnabled,
    setup,
    cleanup,
    clearSelection,
  }
}
