import { describe, expect, it } from 'vitest'
import type { NormalizedElement, NormalizedPresentation, NormalizedSlide, PresentationRuntimeState } from '../types/presentation'
import { evaluatePresentationFrame } from './evaluatePresentationFrame'

function mediaElement(id: string): NormalizedElement {
  return {
    id,
    type: 'video',
    name: id,
    order: 1,
    bounds: { x: 0, y: 0, width: 100, height: 100, rotate: 0 },
    style: {},
    media: { src: `${id}.mp4`, preload: 'metadata' },
    raw: null,
  }
}

function slide(id: string, elements: NormalizedElement[]): NormalizedSlide {
  return {
    id,
    name: id,
    background: {},
    autoplay: { advanceOnClick: true },
    animations: [],
    elements,
  }
}

const model: NormalizedPresentation = {
  width: 1280,
  height: 720,
  theme: { colors: {} },
  usedFonts: [],
  slides: [slide('slide-1', [mediaElement('video-1')])],
}

const state: PresentationRuntimeState = {
  sessionStatus: 'playing',
  activeSlideIndex: 0,
  timelinePositionMs: 1200,
  slideElapsedMs: 1200,
  currentTriggerIndex: 0,
  waitingTrigger: false,
  transitionProgress: 0,
  transitionFromSlideIndex: null,
  transitionToSlideIndex: null,
  isFullscreen: false,
  isMuted: true,
  presenterMode: false,
  loopEnabled: false,
  playbackRate: 1,
}

describe('evaluatePresentationFrame media output', () => {
  it('includes current slide media frames for renderer and media sync consumers', () => {
    const frame = evaluatePresentationFrame(model, state)

    expect(frame.current?.media).toEqual([
      {
        elementId: 'video-1',
        type: 'video',
        media: { src: 'video-1.mp4', preload: 'metadata' },
        playback: { action: 'play', muted: true, playbackRate: 1, seekMs: 1200 },
      },
    ])
  })
})
