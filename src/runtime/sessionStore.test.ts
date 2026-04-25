import { describe, expect, it } from 'vitest'
import type { NormalizedPresentation } from '../types/presentation'
import { createSessionStore, resetSlideSessionState, setPlaybackRate } from './session/sessionStore'
import { getPlaybackPolicyDecision } from './policy/playbackPolicy'

const basePresentation: NormalizedPresentation = {
  width: 1280,
  height: 720,
  theme: { colors: {} },
  usedFonts: [],
  slides: [
    {
      id: 'slide-1',
      name: 'Slide 1',
      background: {},
      autoplay: { advanceOnClick: true, advanceAfterMs: 1000 },
      animations: [
        {
          id: 'click-1',
          trigger: 'onClick',
          durationMs: 100,
          targetElementIds: ['a'],
          effect: 'fade',
        },
      ],
      elements: [],
    },
    {
      id: 'slide-2',
      name: 'Slide 2',
      background: {},
      autoplay: { advanceOnClick: true },
      animations: [],
      elements: [],
    },
  ],
}

describe('runtime session store', () => {
  it('creates the initial runtime state from presentation availability', () => {
    const state = createSessionStore(basePresentation)

    expect(state.sessionStatus).toBe('ready')
    expect(state.activeSlideIndex).toBe(0)
    expect(state.timelinePositionMs).toBe(0)
    expect(state.waitingTrigger).toBe(true)
  })

  it('resets only slide-scoped playback fields and resyncs click trigger waiting state', () => {
    const state = createSessionStore(basePresentation)
    state.timelinePositionMs = 500
    state.slideElapsedMs = 500
    state.currentTriggerIndex = 1
    state.transitionProgress = 0.5
    state.isMuted = true

    resetSlideSessionState(state, basePresentation.slides[0])

    expect(state.timelinePositionMs).toBe(0)
    expect(state.slideElapsedMs).toBe(0)
    expect(state.currentTriggerIndex).toBe(0)
    expect(state.transitionProgress).toBe(0)
    expect(state.waitingTrigger).toBe(true)
    expect(state.isMuted).toBe(true)
  })

  it('clamps playback rate to the supported runtime range', () => {
    const state = createSessionStore(basePresentation)

    setPlaybackRate(state, 0)
    expect(state.playbackRate).toBe(0.25)

    setPlaybackRate(state, 99)
    expect(state.playbackRate).toBe(3)
  })
})

describe('playback policy engine', () => {
  it('waits for click-triggered animations before auto advancing a slide', () => {
    const state = createSessionStore(basePresentation)
    state.slideElapsedMs = 1500
    state.waitingTrigger = true

    expect(getPlaybackPolicyDecision(basePresentation.slides[0], state)).toEqual({ type: 'wait-for-trigger' })
  })

  it('requests slide advance when autoplay time is reached and no trigger is pending', () => {
    const state = createSessionStore(basePresentation)
    state.slideElapsedMs = 1500
    state.waitingTrigger = false

    expect(getPlaybackPolicyDecision(basePresentation.slides[0], state)).toEqual({ type: 'advance-slide' })
  })
})
