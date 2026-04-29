import JSZip from 'jszip'
import type { RawPptxDocument } from './types'
import { applyCustomBulletMarkers } from './enhancers/bullets'

export async function enrichTextBodyInsets(
  raw: RawPptxDocument,
  input: ArrayBuffer,
): Promise<RawPptxDocument> {
  if (!Array.isArray(raw.slides)) {
    return raw
  }

  await JSZip.loadAsync(input)

  for (const slide of raw.slides) {
    const slideElements = [
      ...(Array.isArray(slide.layoutElements) ? slide.layoutElements : []),
      ...(Array.isArray(slide.elements) ? slide.elements : []),
    ]

    applyVendorBulletMarkers(slideElements)
  }

  return raw
}

function applyVendorBulletMarkers(elements: Array<Record<string, unknown>>) {
  for (const element of elements) {
    const children = Array.isArray(element.elements) ? (element.elements as Array<Record<string, unknown>>) : undefined
    if (children) {
      applyVendorBulletMarkers(children)
    }

    if (!Array.isArray(element.bulletMarkers)) {
      continue
    }

    applyCustomBulletMarkers(element, element.bulletMarkers)
  }
}
