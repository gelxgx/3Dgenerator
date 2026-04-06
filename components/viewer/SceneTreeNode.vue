<script setup lang="ts">
import type { Object3D } from 'three'

interface SceneNode {
  name: string
  type: string
  visible: boolean
  meshInfo?: { faces: number, vertices: number }
  children: SceneNode[]
  object: Object3D
}

const props = defineProps<{
  node: SceneNode
  path: string
  depth: number
  expandedNodes: Set<string>
}>()

const emit = defineEmits<{
  toggleExpand: [path: string]
  toggleVisible: [node: SceneNode]
  select: [obj: Object3D]
}>()

const isExpanded = computed(() => props.expandedNodes.has(props.path))
const hasChildren = computed(() => props.node.children.length > 0)

function getIcon(type: string) {
  switch (type) {
    case 'Mesh': case 'SkinnedMesh': return 'i-carbon-cube'
    case 'Group': case 'Scene': return 'i-carbon-folder'
    case 'Bone': return 'i-carbon-tree-view'
    default: return 'i-carbon-circle-dash'
  }
}
</script>

<template>
  <div>
    <div
      class="flex items-center gap-1 py-0.5 px-1 rounded hover:bg-dark-surface-hover cursor-pointer group"
      :style="{ paddingLeft: `${depth * 12 + 4}px` }"
      @click="emit('select', node.object)"
    >
      <button
        v-if="hasChildren"
        class="w-4 h-4 flex-center text-text-tertiary"
        @click.stop="emit('toggleExpand', path)"
      >
        <i :class="isExpanded ? 'i-carbon-chevron-down' : 'i-carbon-chevron-right'" class="text-[10px]" />
      </button>
      <span v-else class="w-4" />

      <button
        class="w-4 h-4 flex-center"
        :class="node.visible ? 'text-text-secondary' : 'text-text-tertiary/40'"
        @click.stop="emit('toggleVisible', node)"
      >
        <i :class="node.visible ? 'i-carbon-view' : 'i-carbon-view-off'" class="text-[10px]" />
      </button>

      <i :class="getIcon(node.type)" class="text-[10px] text-text-tertiary" />
      <span class="text-text-secondary truncate flex-1 group-hover:text-text">{{ node.name }}</span>

      <span v-if="node.meshInfo" class="text-text-tertiary/60 text-[10px] tabular-nums">
        {{ node.meshInfo.faces }}△
      </span>
    </div>

    <template v-if="isExpanded && hasChildren">
      <SceneTreeNode
        v-for="(child, i) in node.children"
        :key="i"
        :node="child"
        :path="`${path}-${i}`"
        :depth="depth + 1"
        :expanded-nodes="expandedNodes"
        @toggle-expand="(p: string) => emit('toggleExpand', p)"
        @toggle-visible="(n: SceneNode) => emit('toggleVisible', n)"
        @select="(obj: Object3D) => emit('select', obj)"
      />
    </template>
  </div>
</template>
