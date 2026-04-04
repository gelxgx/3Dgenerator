import type { Ref } from 'vue'
import type { Material, Mesh, Object3D } from 'three'

type MaterialMode = 'originalPbr' | 'matcapSilver' | 'whiteClay' | 'wireframe' | 'normal'

export function useMaterialSwitcher(
  scene: Ref<Object3D | null>,
  mode: Ref<string>,
) {
  const originalMaterials = new WeakMap<Mesh, Material | Material[]>()
  let materialsStored = false

  function storeOriginalMaterials(obj: Object3D) {
    obj.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh
        if (!originalMaterials.has(mesh)) {
          originalMaterials.set(mesh, mesh.material)
        }
      }
    })
    materialsStored = true
  }

  async function createMaterial(modeValue: MaterialMode): Promise<Material | null> {
    const {
      MeshStandardMaterial,
      MeshBasicMaterial,
      MeshNormalMaterial,
      MeshMatcapMaterial,
      TextureLoader,
    } = await import('three')

    switch (modeValue) {
      case 'originalPbr':
        return null
      case 'matcapSilver': {
        const loader = new TextureLoader()
        const matcapTexture = await new Promise<InstanceType<typeof import('three').Texture>>((resolve, reject) => {
          loader.load(
            'https://raw.githubusercontent.com/nidorx/matcaps/master/256/C7C7D7_4C4E5A_818393_6C6C74-256px.png',
            resolve,
            undefined,
            reject,
          )
        })
        return new MeshMatcapMaterial({ matcap: matcapTexture })
      }
      case 'whiteClay':
        return new MeshStandardMaterial({
          color: 0xFFFFFF,
          roughness: 0.8,
          metalness: 0,
        })
      case 'wireframe':
        return new MeshBasicMaterial({
          wireframe: true,
          color: 0x00FF88,
        })
      case 'normal':
        return new MeshNormalMaterial()
      default:
        return null
    }
  }

  async function applyMaterial(modeValue: string) {
    const sceneObj = scene.value
    if (!sceneObj)
      return

    if (!materialsStored) {
      storeOriginalMaterials(sceneObj)
    }

    if (modeValue === 'originalPbr') {
      sceneObj.traverse((child) => {
        if ((child as Mesh).isMesh) {
          const mesh = child as Mesh
          const original = originalMaterials.get(mesh)
          if (original) {
            mesh.material = original
          }
        }
      })
      return
    }

    const newMaterial = await createMaterial(modeValue as MaterialMode)
    if (!newMaterial)
      return

    sceneObj.traverse((child) => {
      if ((child as Mesh).isMesh) {
        (child as Mesh).material = newMaterial
      }
    })
  }

  watch(mode, (val) => {
    applyMaterial(val)
  })

  watch(scene, (newScene) => {
    if (newScene) {
      storeOriginalMaterials(newScene)
      if (mode.value !== 'originalPbr') {
        applyMaterial(mode.value)
      }
    }
  })
}
