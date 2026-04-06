import type { Camera, Object3D, Vector3 } from 'three'
import type { Ref, ShallowRef } from 'vue'
import {
  BufferGeometry,
  Float32BufferAttribute,
  Line,
  LineDashedMaterial,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  SphereGeometry,
  Vector2,
} from 'three'

export interface Measurement {
  id: string
  pointA: Vector3
  pointB: Vector3
  distance: number
}

export function useMeasureTool(
  scene: Ref<Object3D | null> | ShallowRef<Object3D | null>,
  camera: Ref<Camera | null>,
  domElement: Ref<HTMLCanvasElement | null>,
) {
  const isActive = ref(false)
  const measurements = ref<Measurement[]>([])
  const pendingPoint = shallowRef<Vector3 | null>(null)

  const raycaster = new Raycaster()
  const mouse = new Vector2()
  const helperObjects: Object3D[] = []
  let cachedMeshes: Mesh[] = []

  const MARKER_COLOR = 0x6C5CE7
  const LINE_COLOR = 0x6C5CE7
  const MARKER_RADIUS = 0.02

  function cacheMeshes(obj: Object3D) {
    cachedMeshes = []
    obj.traverse((child) => {
      if ((child as Mesh).isMesh && !child.userData.__measureHelper)
        cachedMeshes.push(child as Mesh)
    })
  }

  function addMarker(position: Vector3) {
    const geo = new SphereGeometry(MARKER_RADIUS, 16, 16)
    const mat = new MeshBasicMaterial({ color: MARKER_COLOR })
    const marker = new Mesh(geo, mat)
    marker.position.copy(position)
    marker.userData.__measureHelper = true
    marker.raycast = () => {}
    scene.value?.add(marker)
    helperObjects.push(marker)
  }

  function addLine(a: Vector3, b: Vector3) {
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute([
      a.x,
      a.y,
      a.z,
      b.x,
      b.y,
      b.z,
    ], 3))
    const mat = new LineDashedMaterial({
      color: LINE_COLOR,
      dashSize: 0.05,
      gapSize: 0.03,
      linewidth: 1,
    })
    const line = new Line(geo, mat)
    line.computeLineDistances()
    line.userData.__measureHelper = true
    scene.value?.add(line)
    helperObjects.push(line)
  }

  function raycastPoint(e: MouseEvent): Vector3 | null {
    const el = domElement.value
    if (!el || !camera.value)
      return null
    const rect = el.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(mouse, camera.value)
    const intersects = raycaster.intersectObjects(cachedMeshes, false)
    const hit = intersects[0]
    return hit ? hit.point.clone() : null
  }

  function handleClick(e: MouseEvent) {
    if (!isActive.value)
      return
    const point = raycastPoint(e)
    if (!point)
      return

    if (!pendingPoint.value) {
      pendingPoint.value = point
      addMarker(point)
    }
    else {
      const pointA = pendingPoint.value
      const pointB = point
      const distance = pointA.distanceTo(pointB)

      addMarker(pointB)
      addLine(pointA, pointB)

      measurements.value.push({
        id: `m-${Date.now()}`,
        pointA: pointA.clone(),
        pointB: pointB.clone(),
        distance,
      })

      pendingPoint.value = null
    }
  }

  function activate() {
    isActive.value = true
    if (scene.value)
      cacheMeshes(scene.value)
  }

  function deactivate() {
    isActive.value = false
    pendingPoint.value = null
  }

  function clearAll() {
    for (const obj of helperObjects) {
      scene.value?.remove(obj)
      const meshObj = obj as Mesh
      if (meshObj.geometry)
        meshObj.geometry.dispose()
      if (meshObj.material) {
        const mat = meshObj.material
        if (Array.isArray(mat))
          mat.forEach(m => m.dispose())
        else
          mat.dispose()
      }
    }
    helperObjects.length = 0
    measurements.value = []
    pendingPoint.value = null
  }

  function setup() {
    const el = domElement.value
    if (!el)
      return
    el.addEventListener('click', handleClick)
  }

  function cleanup() {
    const el = domElement.value
    if (el)
      el.removeEventListener('click', handleClick)
    clearAll()
  }

  watch(scene, (s) => {
    if (s)
      cacheMeshes(s)
  })

  return {
    isActive: readonly(isActive),
    measurements: readonly(measurements),
    pendingPoint: readonly(pendingPoint),
    activate,
    deactivate,
    clearAll,
    setup,
    cleanup,
  }
}
