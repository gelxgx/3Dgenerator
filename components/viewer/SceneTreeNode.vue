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
  selectedPath: string | null
}>()

const emit = defineEmits<{
  toggleExpand: [path: string]
  toggleVisible: [node: SceneNode]
  select: [obj: Object3D, path: string]
}>()

const isExpanded = computed(() => props.expandedNodes.has(props.path))
const hasChildren = computed(() => props.node.children.length > 0)
const isSelected = computed(() => props.selectedPath === props.path)

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
      class="flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer group transition-all duration-150"
      :style="{ paddingLeft: `${depth * 14 + 8}px` }"
      :class="[
        isSelected
          ? 'bg-primary/15 border border-primary/25'
          : 'hover:bg-dark-surface-hover border border-transparent',
      ]"
      @click="emit('select', node.object, path)"
    >
      <button
        v-if="hasChildren"
        class="w-4 h-4 flex-center text-text-tertiary shrink-0"
        @click.stop="emit('toggleExpand', path)"
      >
        <i :class="isExpanded ? 'i-carbon-chevron-down' : 'i-carbon-chevron-right'" class="text-xs" />
      </button>
      <span v-else class="w-4 shrink-0" />

      <button
        class="w-4 h-4 flex-center shrink-0"
        :class="node.visible ? 'text-text-secondary' : 'text-text-tertiary/40'"
        @click.stop="emit('toggleVisible', node)"
      >
        <i :class="node.visible ? 'i-carbon-view' : 'i-carbon-view-off'" class="text-xs" />
      </button>

      <i
        class="text-xs shrink-0" :class="[getIcon(node.type), isSelected ? 'text-primary-light' : 'text-text-tertiary']"
      />
      <span
        class="text-xs truncate flex-1"
        :class="isSelected ? 'text-primary-light font-500' : 'text-text-secondary group-hover:text-text'"
      >
        {{ node.name }}
      </span>

      <span v-if="node.meshInfo" class="text-text-tertiary/50 text-[11px] tabular-nums shrink-0">
        {{ node.meshInfo.faces.toLocaleString() }}
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
        :selected-path="selectedPath"
        @toggle-expand="(p: string) => emit('toggleExpand', p)"
        @toggle-visible="(n: SceneNode) => emit('toggleVisible', n)"
        @select="(obj: Object3D, p: string) => emit('select', obj, p)"
      />
    </template>
  </div>
</template>
