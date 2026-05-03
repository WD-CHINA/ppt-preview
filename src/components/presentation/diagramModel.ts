import type { NormalizedDiagramMeta, NormalizedDiagramTreeNode } from '../../types/presentation'

export interface DiagramRenderNode {
  id: string
  text: string
  depth: number
  kind: 'root' | 'branch' | 'leaf'
  x: number
  y: number
  width: number
  height: number
}

export interface DiagramRenderEdge {
  key: string
  path: string
}

export interface DiagramRenderModel {
  nodes: DiagramRenderNode[]
  edges: DiagramRenderEdge[]
}

interface IndexedDiagramNode {
  key: string
  depth: number
  source: NormalizedDiagramTreeNode
}

interface DiagramLayoutNode extends IndexedDiagramNode {
  children: DiagramLayoutNode[]
  leafCount: number
  center: number
}

const NODE_WIDTH = 0.22
const NODE_HEIGHT = 0.16
const TOP_MARGIN = 0.12
const BOTTOM_MARGIN = 0.14
const SIDE_MARGIN = 0.08

export function createDiagramRenderModel(diagram?: NormalizedDiagramMeta): DiagramRenderModel | undefined {
  if (!diagram || diagram.tree.length === 0) {
    return undefined
  }

  if (isCycleLayout(diagram.layoutKind)) {
    return createCycleDiagramRenderModel(diagram)
  }

  const layoutRoots = diagram.tree.map((node, index) => buildLayoutTree(node, 0, `root-${index}`))
  const levels = collectDiagramLevels(layoutRoots)
  if (levels.length === 0) {
    return undefined
  }

  const totalLeafCount = layoutRoots.reduce((sum, node) => sum + node.leafCount, 0)
  if (totalLeafCount <= 0) {
    return undefined
  }

  let cursor = 0
  for (const node of layoutRoots) {
    assignHorizontalCenters(node, cursor, totalLeafCount)
    cursor += node.leafCount
  }

  const nodes = levels.flatMap((level, depth) => {
    const laneHeight = levels.length > 1
      ? (1 - TOP_MARGIN - BOTTOM_MARGIN - NODE_HEIGHT) / (levels.length - 1)
      : 0
    const y = TOP_MARGIN + depth * laneHeight

    return level.map((entry, index) => ({
      id: entry.key,
      text: entry.source.text ?? entry.source.id ?? `Node ${index + 1}`,
      depth,
      kind: resolveDiagramNodeKind(entry),
      x: clampNodeLeft(entry.center - NODE_WIDTH / 2),
      y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    }))
  })

  const nodeByKey = new Map(nodes.map((node) => [node.id, node]))
  const edges = collectDiagramEdges(layoutRoots, nodeByKey)

  return { nodes, edges }
}

function createCycleDiagramRenderModel(diagram: NormalizedDiagramMeta): DiagramRenderModel | undefined {
  const flatNodes = flattenDiagramTree(diagram.tree)
  if (flatNodes.length === 0) {
    return undefined
  }

  const centerX = 0.5
  const centerY = 0.46
  const radius = flatNodes.length > 3 ? 0.27 : 0.24
  const angleStep = (Math.PI * 2) / flatNodes.length

  const nodes = flatNodes.map((entry, index) => {
    const angle = -Math.PI / 2 + angleStep * index
    const width = index === 0 ? 0.24 : 0.2
    const height = index === 0 ? 0.18 : 0.15
    const x = clampToDiagramBounds(centerX + Math.cos(angle) * radius - width / 2, width)
    const y = clampToDiagramBounds(centerY + Math.sin(angle) * radius - height / 2, height)

    return {
      id: entry.key,
      text: entry.source.text ?? entry.source.id ?? `Node ${index + 1}`,
      depth: entry.depth,
      kind: index === 0 ? 'root' as const : 'leaf' as const,
      x,
      y,
      width,
      height,
    }
  })

  const edges = nodes.map((node, index) => {
    const nextNode = nodes[(index + 1) % nodes.length]
    if (!nextNode) {
      return undefined
    }

    const x1 = node.x + node.width / 2
    const y1 = node.y + node.height / 2
    const x2 = nextNode.x + nextNode.width / 2
    const y2 = nextNode.y + nextNode.height / 2

    return {
      key: `${node.id}->${nextNode.id}`,
      path: describeQuadraticEdgePath(x1, y1, x2, y2, centerX, centerY),
    }
  }).filter((edge): edge is DiagramRenderEdge => Boolean(edge))

  return { nodes, edges }
}

function buildLayoutTree(node: NormalizedDiagramTreeNode, depth: number, key: string): DiagramLayoutNode {
  const children = node.children.map((child, index) => buildLayoutTree(child, depth + 1, `${key}-${index}`))
  const leafCount = children.length > 0
    ? children.reduce((sum, child) => sum + child.leafCount, 0)
    : 1

  return {
    key,
    depth,
    source: node,
    children,
    leafCount,
    center: 0,
  }
}

function collectDiagramLevels(tree: DiagramLayoutNode[]) {
  const levels: DiagramLayoutNode[][] = []

  for (const node of tree) {
    walkDiagramTree(node, levels)
  }

  return levels
}

function flattenDiagramTree(tree: NormalizedDiagramTreeNode[]) {
  const result: IndexedDiagramNode[] = []

  tree.forEach((node, index) => {
    walkFlatDiagramTree(node, 0, `root-${index}`, result)
  })

  return result
}

function walkFlatDiagramTree(
  node: NormalizedDiagramTreeNode,
  depth: number,
  key: string,
  result: IndexedDiagramNode[],
) {
  result.push({ key, depth, source: node })
  node.children.forEach((child, index) => {
    walkFlatDiagramTree(child, depth + 1, `${key}-${index}`, result)
  })
}

function walkDiagramTree(node: DiagramLayoutNode, levels: DiagramLayoutNode[][]) {
  if (!levels[node.depth]) {
    levels[node.depth] = []
  }

  const level = levels[node.depth]
  if (!level) {
    return
  }

  level.push(node)
  node.children.forEach((child) => {
    walkDiagramTree(child, levels)
  })
}

function assignHorizontalCenters(node: DiagramLayoutNode, startLeafIndex: number, totalLeafCount: number) {
  const usableWidth = 1 - SIDE_MARGIN * 2
  const segmentStart = SIDE_MARGIN + (startLeafIndex / totalLeafCount) * usableWidth
  const segmentWidth = (node.leafCount / totalLeafCount) * usableWidth
  node.center = segmentStart + segmentWidth / 2

  let childStart = startLeafIndex
  for (const child of node.children) {
    assignHorizontalCenters(child, childStart, totalLeafCount)
    childStart += child.leafCount
  }
}

function collectDiagramEdges(
  tree: DiagramLayoutNode[],
  nodeByKey: Map<string, DiagramRenderNode>,
) {
  const edges: DiagramRenderEdge[] = []

  tree.forEach((node) => {
    walkDiagramEdges(node, nodeByKey, edges)
  })

  return edges
}

function walkDiagramEdges(
  node: DiagramLayoutNode,
  nodeByKey: Map<string, DiagramRenderNode>,
  edges: DiagramRenderEdge[],
) {
  const parentNode = nodeByKey.get(node.key)

  node.children.forEach((child) => {
    const childNode = nodeByKey.get(child.key)

    if (parentNode && childNode) {
      const x1 = parentNode.x + parentNode.width / 2
      const y1 = parentNode.y + parentNode.height
      const x2 = childNode.x + childNode.width / 2
      const y2 = childNode.y
      const midY = y1 + (y2 - y1) * 0.45

      edges.push({
        key: `${node.key}->${child.key}`,
        path: [
          `M ${x1 * 100} ${y1 * 100}`,
          `L ${x1 * 100} ${midY * 100}`,
          `L ${x2 * 100} ${midY * 100}`,
          `L ${x2 * 100} ${y2 * 100}`,
        ].join(' '),
      })
    }

    walkDiagramEdges(child, nodeByKey, edges)
  })
}

function resolveDiagramNodeKind(node: DiagramLayoutNode): DiagramRenderNode['kind'] {
  if (node.depth === 0) {
    return 'root'
  }

  return node.children.length > 0 ? 'branch' : 'leaf'
}

function clampNodeLeft(left: number) {
  return Math.min(1 - SIDE_MARGIN - NODE_WIDTH, Math.max(SIDE_MARGIN, left))
}

function clampToDiagramBounds(position: number, size: number) {
  return Math.min(1 - SIDE_MARGIN - size, Math.max(SIDE_MARGIN, position))
}

function describeQuadraticEdgePath(x1: number, y1: number, x2: number, y2: number, cx: number, cy: number) {
  const controlX = (x1 + x2) / 2 + (cx - (x1 + x2) / 2) * 0.35
  const controlY = (y1 + y2) / 2 + (cy - (y1 + y2) / 2) * 0.35

  return `M ${x1 * 100} ${y1 * 100} Q ${controlX * 100} ${controlY * 100} ${x2 * 100} ${y2 * 100}`
}

function isCycleLayout(layoutKind?: string) {
  return Boolean(layoutKind && /cycle/iu.test(layoutKind))
}
