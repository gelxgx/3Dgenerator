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
      class="flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer group transition-all duration-150"
      :style="{ paddingLeft: `${depth * 16 + 10}px` }"
      :class="[
        isSelected
          ? 'bg-primary/15 ring-1 ring-primary/30'
          : 'hover:bg-dark-surface-hover',
      ]"
      @click="emit('select', node.object, path)"
    >
      <button
        v-if="hasChildren"
        class="w-5 h-5 flex-center text-text-tertiary shrink-0 hover:text-text transition-colors"
        @click.stop="emit('toggleExpand', path)"
      >
        <i
          :class="isExpanded ? 'i-carbon-chevron-down' : 'i-carbon-chevron-right'"
          class="text-sm transition-transform duration-150"
        />
      </button>
      <span v-else class="w-5 shrink-0" />

      <button
        class="w-5 h-5 flex-center shrink-0 transition-colors"
        :class="node.visible ? 'text-text-secondary hover:text-text' : 'text-text-tertiary/40 hover:text-text-tertiary'"
        @click.stop="emit('toggleVisible', node)"
      >
        <i :class="node.visible ? 'i-carbon-view' : 'i-carbon-view-off'" class="text-sm" />
      </button>

      <i
        class="text-sm shrink-0"
        :class="[getIcon(node.type), isSelected ? 'text-primary-light' : 'text-text-tertiary']"
      />
      <span
        class="text-[13px] truncate flex-1"
        :class="isSelected ? 'text-primary-light font-600' : 'text-text-secondary group-hover:text-text'"
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
