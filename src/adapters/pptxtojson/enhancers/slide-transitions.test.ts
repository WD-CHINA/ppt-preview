import { describe, expect, it } from 'vitest'
import type { RawPptxSlide } from '../types'
import { applySlideTransitionMetadata, extractSlideTransitionMetadata } from './slide-transitions'

describe('slide transition enhancer', () => {
  it('extracts transition type, speed and advance timing from slide xml', () => {
    const metadata = extractSlideTransitionMetadata(`
      <p:sld xmlns:p="p">
        <p:transition spd="med" advTm="6500">
          <p:push dir="r" />
        </p:transition>
      </p:sld>
    `)

    expect(metadata).toEqual({
      type: 'push',
      direction: 'r',
      durationMs: 800,
      advanceAfterMs: 6500,
    })
  })

  it('applies extracted transition timing onto raw slide metadata when parser omits autoplay timing', () => {
    const slide: RawPptxSlide = {
      transition: { type: 'fade', durationMs: 400 },
      autoplay: { advanceOnClick: true },
    }

    applySlideTransitionMetadata(slide, {
      type: 'wipe',
      direction: 'l',
      durationMs: 800,
      advanceAfterMs: 6500,
    })

    expect(slide.transition).toEqual({ type: 'wipe', direction: 'l', durationMs: 800, advanceAfterMs: 6500 })
    expect(slide.autoplay).toEqual({ advanceOnClick: true, advanceAfterMs: 6500 })
  })
})
