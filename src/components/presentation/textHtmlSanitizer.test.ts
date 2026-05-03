import { describe, expect, it } from 'vitest'
import {
  normalizePresentationBlockStyle,
  normalizeSuspiciousDarkTextRuns,
  sanitizePresentationHtml,
} from './textHtmlSanitizer'

describe('normalizePresentationBlockStyle', () => {
  it('removes paragraph top and bottom margins while preserving indent styles', () => {
    const output = normalizePresentationBlockStyle('margin-top: 20em; margin-bottom: 0em; margin-left: 27pt; text-indent: -27pt; color: #fff;')

    expect(output).toContain('margin-left: 27pt')
    expect(output).toContain('text-indent: -27pt')
    expect(output).toContain('color: #fff')
    expect(output).not.toContain('margin-top')
    expect(output).not.toContain('margin-bottom')
  })
})

describe('sanitizePresentationHtml', () => {
  it('still strips block margins when DOMParser is unavailable', () => {
    const originalDomParser = globalThis.DOMParser
    // @ts-expect-error test fallback branch
    delete globalThis.DOMParser

    try {
      const output = sanitizePresentationHtml(
        '<p style="margin-top: 20em; margin-bottom: 0em; margin-left: 27pt; text-indent: -27pt; color: #fff;">hello</p>',
      )

      expect(output).toContain('margin-left: 27pt')
      expect(output).toContain('text-indent: -27pt')
      expect(output).toContain('color: #fff')
      expect(output).not.toContain('margin-top')
      expect(output).not.toContain('margin-bottom')
    } finally {
      if (originalDomParser) {
        globalThis.DOMParser = originalDomParser
      }
    }
  })

  it('converts nbsp-separated prose back into wrappable spaces while preserving pure spacer lines', () => {
    const output = sanitizePresentationHtml(
      '<p><span>ABOUT&nbsp;AI&nbsp;TECH&nbsp;AGENCY</span></p><p>&nbsp;</p>',
    )

    expect(output).toContain('ABOUT AI TECH AGENCY')
    expect(output).toContain('<p>&nbsp;</p>')
    expect(output).not.toContain('ABOUT&nbsp;AI&nbsp;TECH&nbsp;AGENCY')
  })
})

describe('normalizeSuspiciousDarkTextRuns', () => {
  it('lifts visible dark body runs to white when the same text box mixes bright headings and dark body copy', () => {
    const output = normalizeSuspiciousDarkTextRuns(
      [
        '<p><span style="color: #FFFF00;">标题</span></p>',
        '<p><span style="color: #000000;">正文内容</span></p>',
      ].join(''),
    )

    expect(output).toContain('color: #FFFF00')
    expect(output).toContain('color: #FFFFFF')
    expect(output).not.toContain('color: #000000;">正文内容')
  })

  it('does not touch dark filler spans when the text box already has visible white body copy', () => {
    const output = normalizeSuspiciousDarkTextRuns(
      [
        '<p><span style="color: #FFFF00;">标题</span></p>',
        '<p><span style="color: #FFFFFF;">正文内容</span></p>',
        '<p><span style="color: #000000;">&nbsp;&nbsp;&nbsp;</span></p>',
      ].join(''),
    )

    expect(output).toContain('color: #FFFFFF;">正文内容')
    expect(output).toContain('color: #000000;">&nbsp;&nbsp;&nbsp;')
  })
})
