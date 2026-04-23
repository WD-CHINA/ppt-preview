import JSZip from 'jszip'
import type { RawLineEnd, RawPptxDocument, RawPptxElement, RawTextBodyInset } from './types'

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

function extractSlideLineMarkers(slideXml: string) {
  const documentNode = new DOMParser().parseFromString(slideXml, 'application/xml')
  const shapeNodes = Array.from(documentNode.getElementsByTagName('*')).filter(
    (node) => node.tagName === 'p:sp' || node.tagName === 'p:cxnSp',
  )

  return shapeNodes.map((shapeNode, shapeIndex) => {
    const lineNode = shapeNode.getElementsByTagName('a:ln')[0]

    return {
      name: readShapeName(shapeNode),
      order: readOrder(shapeNode),
      shapeIndex,
      headEnd: readLineEnd(lineNode?.getElementsByTagName('a:headEnd')[0]),
      tailEnd: readLineEnd(lineNode?.getElementsByTagName('a:tailEnd')[0]),
    }
  })
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
    const fallbackMarker = markers[cursor.shapeIndex]
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

      return {
        order: readOrder(shapeNode),
        textIndex,
        inset: readTextBodyInset(bodyPr),
        bulletChars: readBulletChars(shapeNode),
      }
    })
}

function applyTextBodyInsets(
  elements: RawPptxElement[],
  insets: Array<{
    order: number | undefined
    textIndex: number
    inset: RawTextBodyInset
    bulletChars: string[]
  }>,
) {
  let textIndex = 0
  const insetsByOrder = new Map<number, (typeof insets)[number]>()

  for (const entry of insets) {
    if (entry.order !== undefined) {
      insetsByOrder.set(entry.order, entry)
    }
  }

  for (const element of elements) {
    if (Array.isArray(element.elements)) {
      applyTextBodyInsets(element.elements, insets)
    }

    if (!hasTextBody(element)) {
      continue
    }

    const order = readRawOrder(element.order)
    const entry = order !== undefined ? insetsByOrder.get(order) : undefined
    const fallbackEntry = insets[textIndex]
    const textBodyEntry = entry ?? fallbackEntry

    element.textBodyInset = textBodyEntry?.inset
    applyCustomBulletMarkers(element, textBodyEntry?.bulletChars ?? [])
    textIndex += 1
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

function readBulletChars(shapeNode: Element) {
  return Array.from(shapeNode.getElementsByTagName('a:p'))
    .map((paragraphNode) => paragraphNode.getElementsByTagName('a:buChar')[0]?.getAttribute('char'))
    .filter((char): char is string => Boolean(char))
}

function applyCustomBulletMarkers(element: RawPptxElement, bulletChars: string[]) {
  if (bulletChars.length === 0 || typeof DOMParser === 'undefined') {
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
    const bulletChar = bulletChars[index] ?? bulletChars[0]

    if (bulletChar) {
      listItem.style.listStyleType = 'none'
      listItem.style.display = 'flex'
      listItem.style.gap = '0.5em'
      listItem.style.alignItems = 'baseline'

      if (!listItem.querySelector(':scope > .ppt-bullet-marker')) {
        const marker = documentNode.createElement('span')
        marker.className = 'ppt-bullet-marker'
        marker.textContent = bulletChar
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
