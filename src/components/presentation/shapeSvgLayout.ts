import type { CSSProperties } from 'vue'

interface ShapeSvgLayoutInput {
  shapeType?: string
  boundsWidth: number
  boundsHeight: number
  viewBoxWidth?: number
  viewBoxHeight?: number
  strokeWidth: number
  isFlipH?: boolean
  isFlipV?: boolean
}

export interface ShapeSvgLayoutModel {
  renderWidth: number
  renderHeight: number
  viewBoxWidth: number
  viewBoxHeight: number
  offsetX: number
  offsetY: number
  pathTransform?: CSSProperties['transform']
}

export function getShapeSvgLayoutModel(input: ShapeSvgLayoutInput): ShapeSvgLayoutModel {
  const isLineLike = isLineLikeShape(input.shapeType)
  const minimumVisibleSize = Math.max(input.strokeWidth, 1)
  const needsWidthFallback = isLineLike && input.boundsWidth <= 0
  const needsHeightFallback = isLineLike && input.boundsHeight <= 0
  const renderWidth = needsWidthFallback ? minimumVisibleSize : input.boundsWidth
  const renderHeight = needsHeightFallback ? minimumVisibleSize : input.boundsHeight
  const baseViewBoxWidth = input.viewBoxWidth ?? input.boundsWidth
  const baseViewBoxHeight = input.viewBoxHeight ?? input.boundsHeight
  const viewBoxWidth = needsWidthFallback ? minimumVisibleSize : baseViewBoxWidth
  const viewBoxHeight = needsHeightFallback ? minimumVisibleSize : baseViewBoxHeight
  const offsetX = needsWidthFallback ? -minimumVisibleSize / 2 : 0
  const offsetY = needsHeightFallback ? -minimumVisibleSize / 2 : 0
  const transforms: string[] = []

  if (needsWidthFallback || needsHeightFallback) {
    transforms.push(`translate(${needsWidthFallback ? minimumVisibleSize / 2 : 0} ${needsHeightFallback ? minimumVisibleSize / 2 : 0})`)
  }

  if (input.isFlipH) {
    transforms.push(`translate(${viewBoxWidth} 0) scale(-1 1)`)
  }

  if (input.isFlipV) {
    transforms.push(`translate(0 ${viewBoxHeight}) scale(1 -1)`)
  }

  return {
    renderWidth,
    renderHeight,
    viewBoxWidth,
    viewBoxHeight,
    offsetX,
    offsetY,
    pathTransform: transforms.length ? transforms.join(' ') : undefined,
  }
}

function isLineLikeShape(shapeType?: string) {
  const normalized = shapeType?.toLowerCase() ?? ''
  return normalized.includes('connector') || normalized === 'line' || normalized === 'straightconnector1'
}
