import { describe, expect, it } from 'vitest'
import { readLineEnd } from './line-markers'

function lineEnd(attributes: Record<string, string | null>): Element {
  return {
    getAttribute(name: string) {
      return attributes[name] ?? null
    },
  } as Element
}

describe('line marker enhancer', () => {
  it('reads PowerPoint line end metadata and ignores none markers', () => {
    expect(readLineEnd(lineEnd({ type: 'triangle', w: 'lg', len: 'med' }))).toEqual({
      type: 'triangle',
      width: 'lg',
      length: 'med',
    })
    expect(readLineEnd(lineEnd({ type: 'none' }))).toBeUndefined()
    expect(readLineEnd(undefined)).toBeUndefined()
  })
})
