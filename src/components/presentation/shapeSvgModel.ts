export interface ShapeSvgPaintModel {
  fill: string
  stroke: string
  strokeWidth: number
}

export function getShapeSvgPaintModel(input: {
  shapeType?: string
  background?: string
  border?: string
}): ShapeSvgPaintModel {
  const borderStroke = parseBorderColor(input.border)
  const borderWidth = parseBorderWidth(input.border)
  const isLineLike = isLineLikeShape(input.shapeType)

  if (isLineLike) {
    return {
      fill: 'none',
      stroke: borderStroke !== 'none' ? borderStroke : normalizeColor(input.background),
      strokeWidth: borderWidth > 0 ? borderWidth : 1,
    }
  }

  return {
    fill: normalizeColor(input.background),
    stroke: borderStroke,
    strokeWidth: borderWidth,
  }
}

function isLineLikeShape(shapeType?: string) {
  const normalized = shapeType?.toLowerCase() ?? ''
  return normalized.includes('connector') || normalized === 'line' || normalized === 'straightconnector1'
}

function parseBorderWidth(border?: string) {
  if (!border) {
    return 0
  }

  const width = Number.parseFloat(border)
  return Number.isFinite(width) ? width : 0
}

function parseBorderColor(border?: string) {
  if (!border) {
    return 'none'
  }

  return border.split(' ').find((part) => part.startsWith('#') || part.startsWith('rgb')) ?? 'none'
}

function normalizeColor(color?: string) {
  return color && color !== 'transparent' ? color : 'none'
}
