<script setup lang="ts">
import type { Mesh, Object3D } from 'three'

interface SceneNode {
  name: string
  type: string
  visible: boolean
  meshInfo?: { faces: number, vertices: number }
  children: SceneNode[]
  object: Object3D
}

const props = defineProps<{
  scene: Object3D | null
}>()

const emit = defineEmits<{
  selectNode: [obj: Object3D]
}>()

const { t } = useI18n()

const treeData = ref<SceneNode[]>([])
const expandedNodes = ref<Set<string>>(new Set())
const selectedPath = ref<string | null>(null)

function buildTree(obj: Object3D, path = '0'): SceneNode {
  const isMesh = (obj as Mesh).isMesh
  let meshInfo: SceneNode['meshInfo']

  if (isMesh) {
    const geo = (obj as Mesh).geometry
    const faceCount = geo.index
      ? geo.index.count / 3
      : geo.attributes.position.count / 3
    meshInfo = {
      faces: Math.floor(faceCount),
      vertices: geo.attributes.position.count,
    }
  }

  return {
    name: obj.name || obj.type,
    type: obj.type,
    visible: obj.visible,
    meshInfo,
    children: obj.children
      .filter(c => !c.userData.__measureHelper && !c.userData.__helper)
      .map((child, i) => buildTree(child, `${path}-${i}`)),
    object: obj,
  }
}

watch(() => props.scene, (s) => {
  if (s) {
    treeData.value = [buildTree(s)]
    expandedNodes.value.add('0')
  }
  else {
    treeData.value = []
  }
}, { immediate: true })

function toggleExpand(path: string) {
  if (expandedNodes.value.has(path))
    expandedNodes.value.delete(path)
  else
    expandedNodes.value.add(path)
}

function toggleVisible(node: SceneNode) {
  node.visible = !node.visible
  node.object.visible = node.visible
}

function handleSelect(obj: Object3D, path: string) {
  selectedPath.value = path
  emit('selectNode', obj)
}
</script>

<template>
  <div class="p-4">
    <h4 class="text-sm font-600 text-text mb-4 flex items-center gap-2 px-1">
      <i class="i-carbon-tree-view-alt text-primary-light text-base" />
      {{ t('viewer.sceneTree') }}
    </h4>

    <div v-if="treeData.length === 0" class="text-text-tertiary text-xs py-6 text-center">
      {{ t('viewer.noScene') }}
    </div>

    <template v-else>
      <SceneTreeNode
        v-for="(node, i) in treeData"
        :key="i"
        :node="node"
        :path="String(i)"
        :depth="0"
        :expanded-nodes="expandedNodes"
        :selected-path="selectedPath"
        @toggle-expand="toggleExpand"
        @toggle-visible="toggleVisible"
        @select="handleSelect"
      />
    </template>
  </div>
</template>
