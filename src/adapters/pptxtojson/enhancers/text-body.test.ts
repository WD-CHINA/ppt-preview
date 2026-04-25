import { describe, expect, it } from 'vitest'
import type { RawPptxElement } from '../types'
import { applyTextBodyInsets, readTextBodyInset } from './text-body'

function elementWithAttributes(attributes: Record<string, string | null>): Element {
  return {
    getAttribute(name: string) {
      return attributes[name] ?? null
    },
  } as Element
}

describe('text body enhancer', () => {
  it('converts EMU text body insets to points with PowerPoint defaults', () => {
    expect(
      readTextBodyInset(
        elementWithAttributes({
          lIns: '12700',
          rIns: '25400',
          tIns: '38100',
        }),
      ),
    ).toEqual({ left: 1, right: 2, top: 3, bottom: 3.6 })
  })

  it('applies text body inset and placeholder metadata by element name before fallback order', () => {
    const elements: RawPptxElement[] = [
      { type: 'text', name: 'Body Placeholder 2', text: 'first' },
      { type: 'text', name: 'Title 1', text: 'second' },
    ]

    applyTextBodyInsets(elements, [
      {
        order: undefined,
        name: 'Title 1',
        textIndex: 0,
        inset: { left: 10, right: 11, top: 12, bottom: 13 },
        bulletMarkers: [],
        placeholderType: 'title',
        placeholderIndex: 1,
      },
      {
        order: undefined,
        name: 'Body Placeholder 2',
        textIndex: 1,
        inset: { left: 20, right: 21, top: 22, bottom: 23 },
        bulletMarkers: [],
        placeholderType: 'body',
        placeholderIndex: 2,
      },
    ])

    expect(elements[0]?.textBodyInset).toEqual({ left: 20, right: 21, top: 22, bottom: 23 })
    expect(elements[0]?.placeholderType).toBe('body')
    expect(elements[0]?.placeholderIndex).toBe(2)
    expect(elements[1]?.textBodyInset).toEqual({ left: 10, right: 11, top: 12, bottom: 13 })
    expect(elements[1]?.placeholderType).toBe('title')
  })
})
