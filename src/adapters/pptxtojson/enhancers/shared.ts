import type { RawPptxElement } from '../types'

export const EMU_PER_POINT = 12700

export function readShapeName(shapeNode: Element) {
  const nameContainers = [
    ...Array.from(shapeNode.getElementsByTagName('p:nvSpPr')),
    ...Array.from(shapeNode.getElementsByTagName('p:nvCxnSpPr')),
  ]

  for (const nameContainer of nameContainers) {
    const name = nameContainer.getElementsByTagName('p:cNvPr')[0]?.getAttribute('name')

    if (name) {
      return name
    }
  }

  return undefined
}

export function readOrder(shapeNode: Element) {
  const rawOrder = shapeNode.getAttribute('order')
  const order = rawOrder == null ? undefined : Number(rawOrder)
  return Number.isFinite(order) ? order : undefined
}

export function readRawOrder(rawOrder: RawPptxElement['order']) {
  if (typeof rawOrder === 'number' && Number.isFinite(rawOrder)) {
    return rawOrder
  }

  if (typeof rawOrder === 'string') {
    const order = Number(rawOrder)
    return Number.isFinite(order) ? order : undefined
  }

  return undefined
}
