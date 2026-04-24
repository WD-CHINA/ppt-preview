import JSZip from 'jszip'
import type { RawLineEnd, RawPptxDocument, RawPptxElement, RawTextBodyInset } from './types'

interface BulletMarker {
  char: string
  fontFace: string | undefined
}

const EMU_PER_POINT = 12700
const DEFAULT_INSET = {
  left: 7.2,
  right: 7.2,
  top: 3.6,
  bottom: 3.6,
}

export async function enrichTextBodyInsets(
  raw: RawPptxDocument,
  input: ArrayBuffer,
): Promise<RawPptxDocument> {
  if (!Array.isArray(raw.slides) || typeof DOMParser === 'undefined') {
    return raw
  }

  const zip = await JSZip.loadAsync(input)
  await correctEmbeddedMediaMimeTypes(raw, zip)

  await Promise.all(
    raw.slides.map(async (slide, slideIndex) => {
      const slideXml = await zip.file(`ppt/slides/slide${slideIndex + 1}.xml`)?.async('string')

      if (!slideXml) {
        return
      }

      const textBodyInsets = extractSlideTextBodyInsets(slideXml)
      const lineMarkers = extractSlideLineMarkers(slideXml)
      const slideElements = [
        ...(Array.isArray(slide.layoutElements) ? slide.layoutElements : []),
        ...(Array.isArray(slide.elements) ? slide.elements : []),
      ]

      applyTextBodyInsets(slideElements, textBodyInsets)
      applyLineMarkers(slideElements, lineMarkers)
    }),
  )

  return raw
}

async function correctEmbeddedMediaMimeTypes(raw: RawPptxDocument, zip: JSZip) {
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

function looksLikeSvg(data: Uint8Array) {
  const head = new TextDecoder('utf-8').decode(data.slice(0, 128)).trimStart()
  return head.startsWith('<svg') || head.startsWith('<?xml')
}

function extractSlideLineMarkers(slideXml: string) {
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

function applyLineMarkers(
  elements: RawPptxElement[],
  markers: Array<{
    order: number | undefined
    shapeIndex: number
    name?: string
    headEnd?: RawLineEnd
    tailEnd?: RawLineEnd
  }>,
  cursor = { shapeIndex: 0 },
) {
  const markersByOrder = new Map<number, (typeof markers)[number]>()
  const markersByName = new Map<string, (typeof markers)[number]>()

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

    if (lineMarker?.headEnd) {
      element.lineHeadEnd = lineMarker.headEnd
    }

    if (lineMarker?.tailEnd) {
      element.lineTailEnd = lineMarker.tailEnd
    }

    cursor.shapeIndex += 1
  }
}

function readShapeName(shapeNode: Element) {
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

function readLineEnd(lineEndNode: Element | undefined): RawLineEnd | undefined {
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

function extractSlideTextBodyInsets(slideXml: string) {
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

function applyTextBodyInsets(
  elements: RawPptxElement[],
  insets: Array<{
    order: number | undefined
    name?: string
    textIndex: number
    inset: RawTextBodyInset
    bulletMarkers: BulletMarker[]
    placeholderType?: string
    placeholderIndex?: number
  }>,
  cursor = { textIndex: 0 },
) {
  const insetsByOrder = new Map<number, (typeof insets)[number]>()
  const insetsByName = new Map<string, (typeof insets)[number]>()

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

    element.textBodyInset = textBodyEntry?.inset
    element.placeholderType = textBodyEntry?.placeholderType
    element.placeholderIndex = textBodyEntry?.placeholderIndex
    applyCustomBulletMarkers(element, textBodyEntry?.bulletMarkers ?? [])
    cursor.textIndex += 1
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

function isShapeLike(element: RawPptxElement) {
  return element.type === 'shape' || typeof element.path === 'string' || typeof element.shapType === 'string'
}

function readTextBodyInset(bodyPr: Element | undefined): RawTextBodyInset {
  return {
    left: readInset(bodyPr, 'lIns', DEFAULT_INSET.left),
    right: readInset(bodyPr, 'rIns', DEFAULT_INSET.right),
    top: readInset(bodyPr, 'tIns', DEFAULT_INSET.top),
    bottom: readInset(bodyPr, 'bIns', DEFAULT_INSET.bottom),
  }
}

function readBulletMarkers(shapeNode: Element): BulletMarker[] {
  return Array.from(shapeNode.getElementsByTagName('a:p'))
    .map((paragraphNode) => {
      const char = paragraphNode.getElementsByTagName('a:buChar')[0]?.getAttribute('char')

      if (!char) {
        return undefined
      }

      const fontFace = paragraphNode.getElementsByTagName('a:buFont')[0]?.getAttribute('typeface') ?? undefined

      return {
        char,
        fontFace,
      }
    })
    .filter((marker): marker is BulletMarker => marker !== undefined)
}

function applyCustomBulletMarkers(
  element: RawPptxElement,
  bulletMarkers: BulletMarker[],
) {
  if (bulletMarkers.length === 0 || typeof DOMParser === 'undefined') {
    return
  }

  const htmlKey = findHtmlKey(element)

  if (!htmlKey) {
    return
  }

  const html = element[htmlKey]

  if (typeof html !== 'string') {
    return
  }

  const documentNode = new DOMParser().parseFromString(html, 'text/html')
  const listItems = Array.from(documentNode.querySelectorAll('li'))

  listItems.forEach((listItem, index) => {
    const bulletMarker = bulletMarkers[index] ?? bulletMarkers[0]
    const bulletChar = normalizeBulletChar(bulletMarker)

    if (bulletChar) {
      listItem.style.listStyleType = 'none'
      listItem.style.display = 'flex'
      listItem.style.gap = '0.5em'
      listItem.style.alignItems = 'baseline'
      listItem.style.paddingLeft = '0'

      if (!listItem.querySelector(':scope > .ppt-bullet-marker')) {
        const marker = documentNode.createElement('span')
        marker.className = 'ppt-bullet-marker'
        marker.textContent = bulletChar
        if (bulletMarker?.fontFace) {
          marker.style.fontFamily = bulletMarker.fontFace
        }
        listItem.prepend(marker)
      }
    }
  })

  element[htmlKey] = documentNode.body.innerHTML
}

function findHtmlKey(element: RawPptxElement): 'content' | 'html' | 'contentHtml' | 'text' | undefined {
  const keys = ['content', 'html', 'contentHtml', 'text'] as const

  return keys.find((key) => typeof element[key] === 'string' && looksLikeHtml(element[key]))
}

function looksLikeHtml(input: unknown) {
  return typeof input === 'string' && /<\/?[a-z][\s\S]*>/i.test(input)
}

function normalizeBulletChar(marker?: BulletMarker) {
  if (!marker) {
    return undefined
  }

  if (marker.fontFace === 'Wingdings' && marker.char === 'ü') {
    return '√'
  }

  return marker.char
}

function readInset(bodyPr: Element | undefined, attribute: string, fallback: number) {
  const rawValue = bodyPr?.getAttribute(attribute)

  if (!rawValue) {
    return fallback
  }

  const value = Number(rawValue)
  return Number.isFinite(value) ? value / EMU_PER_POINT : fallback
}

function readOrder(shapeNode: Element) {
  const rawOrder = shapeNode.getAttribute('order')
  const order = rawOrder == null ? undefined : Number(rawOrder)
  return Number.isFinite(order) ? order : undefined
}

function readRawOrder(rawOrder: RawPptxElement['order']) {
  if (typeof rawOrder === 'number' && Number.isFinite(rawOrder)) {
    return rawOrder
  }

  if (typeof rawOrder === 'string') {
    const order = Number(rawOrder)
    return Number.isFinite(order) ? order : undefined
  }

  return undefined
}
