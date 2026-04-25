import type { RawPptxElement, RawTextBodyInset } from '../types'
import { applyCustomBulletMarkers, type BulletMarker, readBulletMarkers } from './bullets'
import { applyRawElementEnhancement } from './raw-enhancements'
import { EMU_PER_POINT, readOrder, readRawOrder, readShapeName } from './shared'

const DEFAULT_INSET = {
  left: 7.2,
  right: 7.2,
  top: 3.6,
  bottom: 3.6,
}

interface TextBodyEntry {
  order: number | undefined
  name?: string
  textIndex: number
  inset: RawTextBodyInset
  bulletMarkers: BulletMarker[]
  placeholderType?: string
  placeholderIndex?: number
}

export function extractSlideTextBodyInsets(slideXml: string) {
  const documentNode = new DOMParser().parseFromString(slideXml, 'application/xml')
  const shapeNodes = Array.from(documentNode.getElementsByTagName('p:sp'))

  return shapeNodes
    .filter((shapeNode) => shapeNode.getElementsByTagName('p:txBody').length > 0)
    .map((shapeNode, textIndex) => {
      const bodyPr = shapeNode.getElementsByTagName('a:bodyPr')[0]
      const placeholder = readPlaceholder(shapeNode)

      return {
        order: readOrder(shapeNode),
        name: readShapeName(shapeNode),
        textIndex,
        inset: readTextBodyInset(bodyPr),
        bulletMarkers: readBulletMarkers(shapeNode),
        placeholderType: placeholder?.type,
        placeholderIndex: placeholder?.index,
      }
    })
}

export function applyTextBodyInsets(
  elements: RawPptxElement[],
  insets: TextBodyEntry[],
  cursor = { textIndex: 0 },
) {
  const insetsByOrder = new Map<number, TextBodyEntry>()
  const insetsByName = new Map<string, TextBodyEntry>()

  for (const entry of insets) {
    if (entry.order !== undefined) {
      insetsByOrder.set(entry.order, entry)
    }

    if (entry.name) {
      insetsByName.set(entry.name, entry)
    }
  }

  for (const element of elements) {
    if (Array.isArray(element.elements)) {
      applyTextBodyInsets(element.elements, insets, cursor)
    }

    if (!hasTextBody(element)) {
      continue
    }

    const order = readRawOrder(element.order)
    const entryByName = element.name ? insetsByName.get(element.name) : undefined
    const entryByOrder = order !== undefined ? insetsByOrder.get(order) : undefined
    const fallbackEntry = insets[cursor.textIndex]
    const textBodyEntry = entryByName ?? entryByOrder ?? fallbackEntry

    applyRawElementEnhancement(element, {
      textBodyInset: textBodyEntry?.inset,
      placeholder: {
        type: textBodyEntry?.placeholderType,
        index: textBodyEntry?.placeholderIndex,
      },
    })
    applyCustomBulletMarkers(element, textBodyEntry?.bulletMarkers ?? [])
    cursor.textIndex += 1
  }
}

export function readTextBodyInset(bodyPr: Element | undefined): RawTextBodyInset {
  return {
    left: readInset(bodyPr, 'lIns', DEFAULT_INSET.left),
    right: readInset(bodyPr, 'rIns', DEFAULT_INSET.right),
    top: readInset(bodyPr, 'tIns', DEFAULT_INSET.top),
    bottom: readInset(bodyPr, 'bIns', DEFAULT_INSET.bottom),
  }
}

function readPlaceholder(shapeNode: Element) {
  const placeholderNode = shapeNode.getElementsByTagName('p:ph')[0]

  if (!placeholderNode) {
    return undefined
  }

  const rawIndex = placeholderNode.getAttribute('idx')
  const index = rawIndex == null ? undefined : Number(rawIndex)

  return {
    type: placeholderNode.getAttribute('type') ?? undefined,
    index: Number.isFinite(index) ? index : undefined,
  }
}

function hasTextBody(element: RawPptxElement) {
  return (
    element.type === 'text' ||
    element.type === 'shape' ||
    typeof element.content === 'string' ||
    typeof element.text === 'string' ||
    typeof element.html === 'string'
  )
}

function readInset(bodyPr: Element | undefined, attribute: string, fallback: number) {
  const rawValue = bodyPr?.getAttribute(attribute)

  if (!rawValue) {
    return fallback
  }

  const value = Number(rawValue)
  return Number.isFinite(value) ? value / EMU_PER_POINT : fallback
}
