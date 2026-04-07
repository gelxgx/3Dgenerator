import type { Object3D, SkeletonHelper, SkinnedMesh } from 'three'
import type { Ref, ShallowRef } from 'vue'

export function useSkeletonViewer(scene: Ref<Object3D | null> | ShallowRef<Object3D | null>) {
  const isVisible = ref(false)
  const hasSkeleton = ref(false)
  const boneCount = ref(0)

  let skeletonHelper: SkeletonHelper | null = null
  let skinnedMeshes: SkinnedMesh[] = []

  function init(sceneObj: Object3D) {
    skinnedMeshes = []
    sceneObj.traverse((child) => {
      if ((child as SkinnedMesh).isSkinnedMesh)
        skinnedMeshes.push(child as SkinnedMesh)
    })

    hasSkeleton.value = skinnedMeshes.length > 0

    const firstSkinned = skinnedMeshes[0]
    if (firstSkinned?.skeleton)
      boneCount.value = firstSkinned.skeleton.bones.length
  }

  async function show() {
    if (!hasSkeleton.value || !scene.value)
      return
    // SkeletonHelper 必须挂在根 Scene 上，而非 model group；
    // 若挂在有位移的 model group 上，构造时 this.matrix = object.matrixWorld
    // 会与 parent.matrixWorld 双重叠加，导致骨骼位置偏移。
    const rootScene = scene.value.parent
    if (!rootScene)
      return
    const { SkeletonHelper: SH } = await import('three')
    skeletonHelper = new SH(scene.value)
    skeletonHelper.userData.__helper = true
    rootScene.add(skeletonHelper)
    isVisible.value = true
  }

  function hide() {
    if (skeletonHelper) {
      skeletonHelper.parent?.remove(skeletonHelper)
      skeletonHelper.dispose()
      skeletonHelper = null
    }
    isVisible.value = false
  }

  function toggle() {
    if (isVisible.value)
      hide()
    else
      show()
  }

  watch(scene, (s) => {
    if (s) {
      hide()
      init(s)
    }
  })

  return {
    isVisible: readonly(isVisible),
    hasSkeleton: readonly(hasSkeleton),
    boneCount: readonly(boneCount),
    toggle,
    show,
    hide,
  }
}
