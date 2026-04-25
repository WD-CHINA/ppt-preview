import type { RawPptxElement } from '../types'

export interface BulletMarker {
  char: string
  fontFace: string | undefined
}

export function readBulletMarkers(shapeNode: Element): BulletMarker[] {
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

export function normalizeBulletChar(marker?: BulletMarker) {
  if (!marker) {
    return undefined
  }

  if (marker.fontFace === 'Wingdings' && marker.char === 'ü') {
    return '√'
  }

  return marker.char
}
