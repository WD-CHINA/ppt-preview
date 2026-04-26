import type { LineEndMarker } from '../../types/presentation'

export interface LineMarkerRenderModel {
  markerWidth: number
  markerHeight: number
  refX: number
  refY: number
  orient: 'auto' | 'auto-start-reverse'
  path: string
}

export function createLineMarkerModel(
  marker: Pick<LineEndMarker, 'type' | 'width' | 'length'> | undefined,
  placement: 'start' | 'end',
): LineMarkerRenderModel | undefined {
  if (!marker?.type || marker.type === 'none') {
    return undefined
  }

  const markerWidth = mapMarkerSize(marker.length)
  const markerHeight = mapMarkerSize(marker.width)
  const refX = marker.type === 'oval' ? markerWidth / 2 : markerWidth
  const refY = markerHeight / 2

  return {
    markerWidth,
    markerHeight,
    refX,
    refY,
    orient: placement === 'start' ? 'auto-start-reverse' : 'auto',
    path: getMarkerPath(marker.type, markerWidth, markerHeight),
  }
}

function getMarkerPath(type: string, width: number, height: number) {
  switch (type) {
    case 'stealth': {
      const notchX = round(width * 0.3)
      const centerY = round(height / 2)
      return `M 0 0 L ${width} ${centerY} L 0 ${height} L ${notchX} ${centerY} z`
    }
    case 'diamond': {
      const centerX = round(width / 2)
      const centerY = round(height / 2)
      return `M 0 ${centerY} L ${centerX} 0 L ${width} ${centerY} L ${centerX} ${height} z`
    }
    case 'oval': {
      const radiusX = round(width / 2)
      const radiusY = round(height / 2)
      return `M ${radiusX} 0 A ${radiusX} ${radiusY} 0 1 1 ${round(radiusX - 0.001)} 0 z`
    }
    case 'triangle':
    default:
      return `M 0 0 L ${width} ${round(height / 2)} L 0 ${height} z`
  }
}

function mapMarkerSize(value?: string) {
  switch (value) {
    case 'sm':
      return 5
    case 'lg':
      return 9
    default:
      return 7
  }
}

function round(value: number) {
  return Number(value.toFixed(3))
}
