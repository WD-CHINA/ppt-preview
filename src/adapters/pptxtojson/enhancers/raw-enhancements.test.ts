import { describe, expect, it } from 'vitest'
import type { RawPptxElement } from '../types'
import { applyRawElementEnhancement, hasRawElementEnhancements } from './raw-enhancements'

describe('raw element enhancement fields', () => {
  it('applies typed enhancer-owned fields without touching existing raw parser fields', () => {
    const element: RawPptxElement = {
      type: 'shape',
      name: 'Connector 1',
      order: 3,
      text: 'keep me',
    }

    applyRawElementEnhancement(element, {
      textBodyInset: { left: 1, right: 2, top: 3, bottom: 4 },
      placeholder: { type: 'body', index: 2 },
      lineEnd: { head: { type: 'triangle', width: 'lg', length: 'med' } },
    })

    expect(element.text).toBe('keep me')
    expect(element.textBodyInset).toEqual({ left: 1, right: 2, top: 3, bottom: 4 })
    expect(element.placeholderType).toBe('body')
    expect(element.placeholderIndex).toBe(2)
    expect(element.lineHeadEnd).toEqual({ type: 'triangle', width: 'lg', length: 'med' })
    expect(element.lineTailEnd).toBeUndefined()
    expect(hasRawElementEnhancements(element)).toBe(true)
  })

  it('does not report empty raw parser elements as enhanced', () => {
    expect(hasRawElementEnhancements({ type: 'text', text: 'plain' })).toBe(false)
  })
})
