import { describe, expect, it } from 'vitest'
import type { NormalizedSlide } from '../../types/presentation'
import { createSessionStore } from '../session/sessionStore'
import { beginSlideTransition, tickSlideTransition } from './transitionEngine'

function makeSlide(durationMs?: number): NormalizedSlide {
  return {
    id: `slide-${durationMs ?? 0}`,
    name: `Slide ${durationMs ?? 0}`,
    background: {},
    transition: durationMs == null ? undefined : { type: 'fade', durationMs },
    autoplay: { advanceOnClick: true },
    animations: [],
    elements: [],
  }
}

const model = {
  width: 1280,
  height: 720,
  theme: { colors: {} },
  usedFonts: [],
  slides: [makeSlide(400), makeSlide()],
}

describe('transition engine', () => {
  it('starts a transition when the source slide has a positive duration', () => {
    const state = createSessionStore(model)

    const started = beginSlideTransition(state, { fromIndex: 0, toIndex: 1, fromSlide: model.slides[0] })

    expect(started).toBe(true)
    expect(state.transitionFromSlideIndex).toBe(0)
    expect(state.transitionToSlideIndex).toBe(1)
    expect(state.transitionProgress).toBe(0)
    expect(state.sessionStatus).toBe('transitioning')
  })

  it('does not start a transition when duration is absent or zero', () => {
    const state = createSessionStore(model)

    const started = beginSlideTransition(state, { fromIndex: 1, toIndex: 0, fromSlide: model.slides[1] })

    expect(started).toBe(false)
    expect(state.transitionFromSlideIndex).toBeNull()
    expect(state.transitionToSlideIndex).toBeNull()
    expect(state.sessionStatus).toBe('ready')
  })

  it('advances transition progress by playback-scaled delta and finishes cleanly', () => {
    const state = createSessionStore(model)
    beginSlideTransition(state, { fromIndex: 0, toIndex: 1, fromSlide: model.slides[0] })

    const firstTick = tickSlideTransition(state, model.slides[0], 100)
    expect(firstTick).toEqual({ status: 'running' })
    expect(state.transitionProgress).toBeCloseTo(0.25)

    const finalTick = tickSlideTransition(state, model.slides[0], 400)
    expect(finalTick).toEqual({ status: 'finished' })
    expect(state.transitionProgress).toBe(1)
    expect(state.transitionFromSlideIndex).toBeNull()
    expect(state.transitionToSlideIndex).toBeNull()
    expect(state.sessionStatus).toBe('playing')
  })
})
