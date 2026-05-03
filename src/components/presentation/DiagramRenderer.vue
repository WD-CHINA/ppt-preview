<script setup lang="ts">
import { computed } from 'vue'
import type { NormalizedDiagramMeta } from '../../types/presentation'
import { createDiagramRenderModel } from './diagramModel'

const props = defineProps<{
  diagram: NormalizedDiagramMeta
  name: string
}>()

const model = computed(() => createDiagramRenderModel(props.diagram))

const summary = computed(() => {
  const parts = [
    formatDiagramLayout(props.diagram.layoutKind),
    props.diagram.nodeCount > 0 ? `${props.diagram.nodeCount} nodes` : undefined,
    props.diagram.relationCount > 0 ? `${props.diagram.relationCount} links` : undefined,
  ].filter((entry): entry is string => Boolean(entry))

  return parts.join(' · ')
})
</script>

<template>
  <div class="diagram-renderer">
    <svg v-if="model" class="diagram-renderer__edges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path
        v-for="edge in model.edges"
        :key="edge.key"
        class="diagram-renderer__edge"
        :d="edge.path"
      />
    </svg>

    <div v-if="model" class="diagram-renderer__surface">
      <div
        v-for="node in model.nodes"
        :key="node.id"
        class="diagram-renderer__node"
        :style="{
          left: `${node.x * 100}%`,
          top: `${node.y * 100}%`,
          width: `${node.width * 100}%`,
          height: `${node.height * 100}%`,
        }"
        :data-kind="node.kind"
      >
        <span class="diagram-renderer__node-text">{{ node.text }}</span>
      </div>
    </div>

    <div class="diagram-renderer__badge">
      <span class="diagram-renderer__badge-title">{{ name }}</span>
      <span v-if="summary">{{ summary }}</span>
    </div>
  </div>
</template>

<style scoped>
.diagram-renderer {
  position: relative;
  width: 100%;
  height: 100%;
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 1rem;
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.97), rgba(255, 255, 255, 0.94)),
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.1), transparent 40%);
  overflow: hidden;
}

.diagram-renderer__edges,
.diagram-renderer__surface {
  position: absolute;
  inset: 0;
}

.diagram-renderer__edge {
  fill: none;
  stroke: rgba(51, 65, 85, 0.45);
  stroke-width: 1.6;
  stroke-linecap: round;
}

.diagram-renderer__node {
  position: absolute;
  display: grid;
  place-items: center;
  padding: 0.45rem 0.55rem;
  box-sizing: border-box;
  border-radius: 1rem;
  border: 1px solid rgba(37, 99, 235, 0.16);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(239, 246, 255, 0.96));
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  text-align: center;
}

.diagram-renderer__node[data-kind='root'] {
  border-color: rgba(249, 115, 22, 0.22);
  background: linear-gradient(180deg, rgba(255, 247, 237, 0.98), rgba(254, 215, 170, 0.86));
}

.diagram-renderer__node[data-kind='branch'] {
  border-color: rgba(37, 99, 235, 0.16);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(239, 246, 255, 0.96));
}

.diagram-renderer__node[data-kind='leaf'] {
  border-color: rgba(20, 184, 166, 0.16);
  background: linear-gradient(180deg, rgba(240, 253, 250, 0.98), rgba(204, 251, 241, 0.92));
}

.diagram-renderer__node-text {
  font-size: 0.78rem;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.2;
}

.diagram-renderer__badge {
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  bottom: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.6rem;
  align-items: center;
  padding: 0.45rem 0.65rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  color: #334155;
  font-size: 0.72rem;
  backdrop-filter: blur(6px);
}

.diagram-renderer__badge-title {
  font-weight: 700;
  color: #0f172a;
}
</style>

<script lang="ts">
function formatDiagramLayout(layoutKind?: string) {
  if (!layoutKind) {
    return undefined
  }

  const rawSegment = layoutKind.split('/').pop() ?? layoutKind
  return rawSegment
    .replace(/\d+$/u, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (letter) => letter.toUpperCase())
}
</script>
