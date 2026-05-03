import { describe, expect, it } from 'vitest'
import { buildParagraphVisibilityHtml } from './paragraphBuild'

describe('buildParagraphVisibilityHtml', () => {
  it('reveals only the first N paragraphs for paragraph build playback', () => {
    const html = '<p>Alpha</p><p>Beta</p><p>Gamma</p>'

    expect(buildParagraphVisibilityHtml(html, 0)).toBe('')
    expect(buildParagraphVisibilityHtml(html, 1)).toBe('<p>Alpha</p>')
    expect(buildParagraphVisibilityHtml(html, 2)).toBe('<p>Alpha</p><p>Beta</p>')
    expect(buildParagraphVisibilityHtml(html, 3)).toBe('<p>Alpha</p><p>Beta</p><p>Gamma</p>')
  })

  it('returns the original html when the content has no paragraphs to build', () => {
    expect(buildParagraphVisibilityHtml('<span>Only text</span>', 1)).toBe('<span>Only text</span>')
  })

  it('counts only meaningful paragraphs while keeping spacer paragraphs before the next hidden build', () => {
    const html = '<p>Alpha</p><p>&nbsp;</p><p>Beta</p><p></p><p>Gamma</p>'

    expect(buildParagraphVisibilityHtml(html, 1)).toBe('<p>Alpha</p><p>&nbsp;</p>')
    expect(buildParagraphVisibilityHtml(html, 2)).toBe('<p>Alpha</p><p>&nbsp;</p><p>Beta</p><p></p>')
  })

  it('reveals list-item builds progressively', () => {
    const html = '<ul><li>Alpha</li><li>&nbsp;</li><li>Beta</li><li>Gamma</li></ul>'

    expect(buildParagraphVisibilityHtml(html, 1)).toBe('<ul><li>Alpha</li><li>&nbsp;</li></ul>')
    expect(buildParagraphVisibilityHtml(html, 2)).toBe('<ul><li>Alpha</li><li>&nbsp;</li><li>Beta</li></ul>')
  })
})
