import type { RawPptxElement } from '../types'

export interface BulletMarker {
  char: string
  fontFace: string | undefined
  level?: number
  marginLeft?: number
  indent?: number
  hanging?: number
  listType?: 'ul' | 'ol'
}

export function readBulletMarkers(shapeNode: Element): BulletMarker[] {
  const markers: BulletMarker[] = []

  for (const paragraphNode of Array.from(shapeNode.getElementsByTagName('a:p'))) {
    const paragraphProperties = paragraphNode.getElementsByTagName('a:pPr')[0]
    const char = paragraphNode.getElementsByTagName('a:buChar')[0]?.getAttribute('char')
    const autoNumber = paragraphNode.getElementsByTagName('a:buAutoNum')[0]

    if (!char && !autoNumber) {
      continue
    }

    const marginLeft = emuToPoints(paragraphProperties?.getAttribute('marL'))
    const indent = emuToPoints(paragraphProperties?.getAttribute('indent'))

    markers.push({
      char: char ?? '',
      fontFace: paragraphNode.getElementsByTagName('a:buFont')[0]?.getAttribute('typeface') ?? undefined,
      level: normalizeNumber(paragraphProperties?.getAttribute('lvl')) ?? 0,
      marginLeft,
      indent,
      hanging: computeHangingIndent(marginLeft, indent),
      listType: autoNumber ? 'ol' : 'ul',
    })
  }

  return markers
}

export function applyCustomBulletMarkers(
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

    applyListIndentation(listItem, bulletMarker)

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

function applyListIndentation(listItem: HTMLElement, bulletMarker?: BulletMarker) {
  if (!bulletMarker) {
    return
  }

  const marginLeft = toPointStyle(bulletMarker.marginLeft)
  const indent = toPointStyle(bulletMarker.indent)

  if (marginLeft) {
    listItem.style.marginLeft = marginLeft
  }

  if (indent) {
    listItem.style.textIndent = indent
  }
}

function findHtmlKey(element: RawPptxElement): 'content' | 'html' | 'contentHtml' | 'text' | undefined {
  const keys = ['content', 'html', 'contentHtml', 'text'] as const

  return keys.find((key) => typeof element[key] === 'string' && looksLikeHtml(element[key]))
}

function looksLikeHtml(input: unknown) {
  return typeof input === 'string' && /<\/?[a-z][\s\S]*>/i.test(input)
}

export function normalizeBulletChar(marker?: BulletMarker) {
  if (!marker) {
    return undefined
  }

  if (marker.fontFace === 'Wingdings' && marker.char === 'ü') {
    return '√'
  }

  return marker.char
}

function computeHangingIndent(marginLeft?: number, indent?: number) {
  if (typeof indent === 'number' && indent < 0) {
    return Math.abs(indent)
  }

  if (typeof marginLeft === 'number' && typeof indent === 'number' && marginLeft > indent) {
    return marginLeft - indent
  }

  return undefined
}

function normalizeNumber(input: string | null | undefined) {
  if (typeof input !== 'string' || input.length === 0) {
    return undefined
  }

  const parsed = Number.parseInt(input, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

function emuToPoints(input: string | null | undefined) {
  const value = normalizeNumber(input)

  if (value === undefined) {
    return undefined
  }

  return value / 12700
}

function toPointStyle(value?: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined
  }

  return `${value}pt`
}
