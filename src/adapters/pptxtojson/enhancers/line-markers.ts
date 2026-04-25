import type { RawLineEnd, RawPptxElement } from '../types'
import { applyRawElementEnhancement } from './raw-enhancements'
import { readOrder, readRawOrder, readShapeName } from './shared'

interface SlideLineMarker {
  order: number | undefined
  shapeIndex: number
  name?: string
  headEnd?: RawLineEnd
  tailEnd?: RawLineEnd
}

export function extractSlideLineMarkers(slideXml: string) {
  const documentNode = new DOMParser().parseFromString(slideXml, 'application/xml')
  const shapeNodes = Array.from(documentNode.getElementsByTagName('*')).filter(
    (node) => node.tagName === 'p:sp' || node.tagName === 'p:cxnSp',
  )

  return shapeNodes
    .map((shapeNode, shapeIndex) => {
      const lineNode = shapeNode.getElementsByTagName('a:ln')[0]
      const headEnd = readLineEnd(lineNode?.getElementsByTagName('a:headEnd')[0])
      const tailEnd = readLineEnd(lineNode?.getElementsByTagName('a:tailEnd')[0])

      return {
        name: readShapeName(shapeNode),
        order: readOrder(shapeNode),
        shapeIndex,
        headEnd,
        tailEnd,
      }
    })
    .filter((marker) => marker.headEnd || marker.tailEnd)
}

export function applyLineMarkers(
  elements: RawPptxElement[],
  markers: SlideLineMarker[],
  cursor = { shapeIndex: 0 },
) {
  const markersByOrder = new Map<number, SlideLineMarker>()
  const markersByName = new Map<string, SlideLineMarker>()

  for (const marker of markers) {
    if (marker.order !== undefined) {
      markersByOrder.set(marker.order, marker)
    }

    if (marker.name) {
      markersByName.set(marker.name, marker)
    }
  }

  for (const element of elements) {
    if (Array.isArray(element.elements)) {
      applyLineMarkers(element.elements, markers, cursor)
    }

    if (!isShapeLike(element)) {
      continue
    }

    const order = readRawOrder(element.order)
    const markerByName = element.name ? markersByName.get(element.name) : undefined
    const markerByOrder = order !== undefined ? markersByOrder.get(order) : undefined
    const fallbackMarker = element.name || order !== undefined ? undefined : markers[cursor.shapeIndex]
    const lineMarker = markerByName ?? markerByOrder ?? fallbackMarker

    applyRawElementEnhancement(element, {
      lineEnd: {
        head: lineMarker?.headEnd,
        tail: lineMarker?.tailEnd,
      },
    })

    cursor.shapeIndex += 1
  }
}

export function readLineEnd(lineEndNode: Element | undefined): RawLineEnd | undefined {
  const type = lineEndNode?.getAttribute('type')

  if (!type || type === 'none') {
    return undefined
  }

  return {
    type,
    width: lineEndNode?.getAttribute('w') ?? undefined,
    length: lineEndNode?.getAttribute('len') ?? undefined,
  }
}

function isShapeLike(element: RawPptxElement) {
  return element.type === 'shape' || typeof element.path === 'string' || typeof element.shapType === 'string'
}
