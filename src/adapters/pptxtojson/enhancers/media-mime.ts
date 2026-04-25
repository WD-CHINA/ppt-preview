import JSZip from 'jszip'
import type { RawPptxDocument, RawPptxElement } from '../types'

export async function correctEmbeddedMediaMimeTypes(raw: RawPptxDocument, zip: JSZip) {
  if (!Array.isArray(raw.slides) || typeof Blob === 'undefined') {
    return
  }

  for (const slide of raw.slides) {
    const slideElements = [
      ...(Array.isArray(slide.layoutElements) ? slide.layoutElements : []),
      ...(Array.isArray(slide.elements) ? slide.elements : []),
    ]

    await correctElementsMediaMimeTypes(slideElements, zip)
  }
}

async function correctElementsMediaMimeTypes(elements: RawPptxElement[], zip: JSZip) {
  for (const element of elements) {
    if (Array.isArray(element.elements)) {
      await correctElementsMediaMimeTypes(element.elements, zip)
    }

    await correctSingleMediaMimeType(element, zip, 'ref', 'blob')
    await correctSingleMediaMimeType(element, zip, 'picRef', 'picBlob')
  }
}

async function correctSingleMediaMimeType(
  element: RawPptxElement,
  zip: JSZip,
  refKey: 'ref' | 'picRef',
  blobKey: 'blob' | 'picBlob',
) {
  const ref = element[refKey]

  if (typeof ref !== 'string' || ref.length === 0) {
    return
  }

  const normalizedPath = ref.replace(/^\/+/, '').replace(/^ppt\//, 'ppt/')
  const file = zip.file(normalizedPath)

  if (!file) {
    return
  }

  const data = await file.async('uint8array')

  if (!looksLikeSvg(data)) {
    return
  }

  const svgBytes = new Uint8Array(data.byteLength)
  svgBytes.set(data)
  element[blobKey] = new Blob([svgBytes], { type: 'image/svg+xml' })
}

export function looksLikeSvg(data: Uint8Array) {
  const head = new TextDecoder('utf-8').decode(data.slice(0, 128)).trimStart()
  return head.startsWith('<svg') || head.startsWith('<?xml')
}
