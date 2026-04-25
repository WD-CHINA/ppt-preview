import { describe, expect, it } from 'vitest'
import { normalizeBulletChar } from './bullets'

describe('bullet enhancer', () => {
  it('normalizes Wingdings checkmark bullets and leaves regular bullets untouched', () => {
    expect(normalizeBulletChar({ char: 'ü', fontFace: 'Wingdings' })).toBe('√')
    expect(normalizeBulletChar({ char: '•', fontFace: 'Arial' })).toBe('•')
    expect(normalizeBulletChar()).toBeUndefined()
  })
})
