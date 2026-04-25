import type { RawLineEnd, RawPptxElement, RawTextBodyInset } from '../types'

export interface RawElementPlaceholderEnhancement {
  type?: string
  index?: number
}

export interface RawElementLineEndEnhancement {
  head?: RawLineEnd
  tail?: RawLineEnd
}

export interface RawElementEnhancementFields {
  textBodyInset?: RawTextBodyInset
  placeholder?: RawElementPlaceholderEnhancement
  lineEnd?: RawElementLineEndEnhancement
}

export function applyRawElementEnhancement(element: RawPptxElement, enhancement: RawElementEnhancementFields) {
  if (enhancement.textBodyInset) {
    element.textBodyInset = enhancement.textBodyInset
  }

  if (enhancement.placeholder) {
    element.placeholderType = enhancement.placeholder.type
    element.placeholderIndex = enhancement.placeholder.index
  }

  if (enhancement.lineEnd?.head) {
    element.lineHeadEnd = enhancement.lineEnd.head
  }

  if (enhancement.lineEnd?.tail) {
    element.lineTailEnd = enhancement.lineEnd.tail
  }
}

export function hasRawElementEnhancements(element: RawPptxElement) {
  return Boolean(
    element.textBodyInset != null ||
      element.placeholderType != null ||
      element.placeholderIndex != null ||
      element.lineHeadEnd != null ||
      element.lineTailEnd != null,
  )
}
