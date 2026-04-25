import { describe, expect, it } from 'vitest'
import type { NormalizedElement, NormalizedPresentation, NormalizedSlide, PresentationRuntimeState } from '../../types/presentation'
import {
  collectMediaRegistry,
  createMediaEngineState,
  getMediaPlaybackPlan,
  syncMediaEngine,
} from './mediaEngine'

function mediaElement(id: string, type: 'image' | 'video' | 'audio', src: string): NormalizedElement {
  return {
    id,
    type,
    name: id,
    order: 1,
    bounds: { x: 0, y: 0, width: 100, height: 100, rotate: 0 },
    style: {},
    media: { src, preload: 'metadata' },
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
  slides: [
    slide('slide-1', [mediaElement('image-1', 'image', 'image-1.png')]),
    slide('slide-2', [mediaElement('video-1', 'video', 'video-1.mp4'), mediaElement('audio-1', 'audio', 'audio-1.mp3')]),
    slide('slide-3', [mediaElement('video-2', 'video', 'video-2.mp4')]),
    slide('slide-4', [mediaElement('image-4', 'image', 'image-4.png')]),
  ],
}

function runtimeState(overrides: Partial<PresentationRuntimeState> = {}): PresentationRuntimeState {
  return {
    sessionStatus: 'ready',
    activeSlideIndex: 0,
    timelinePositionMs: 0,
    slideElapsedMs: 0,
    currentTriggerIndex: 0,
    waitingTrigger: false,
    transitionProgress: 0,
    transitionFromSlideIndex: null,
    transitionToSlideIndex: null,
    isFullscreen: false,
    isMuted: false,
    presenterMode: false,
    loopEnabled: false,
    playbackRate: 1,
    ...overrides,
  }
}

describe('media engine', () => {
  it('collects media registry entries with slide and element metadata', () => {
    const registry = collectMediaRegistry(model)

    expect(registry.map((entry) => `${entry.slideIndex}:${entry.elementId}:${entry.type}`)).toEqual([
      '0:image-1:image',
      '1:video-1:video',
      '1:audio-1:audio',
      '2:video-2:video',
      '3:image-4:image',
    ])
  })

  it('marks current/next/previous slide media as preloaded and releases far slides', () => {
    const engine = createMediaEngineState(model)

    syncMediaEngine(engine, runtimeState({ activeSlideIndex: 1 }), model)

    expect(engine.entries['image-1']?.status).toBe('preloaded')
    expect(engine.entries['video-1']?.status).toBe('active')
    expect(engine.entries['audio-1']?.status).toBe('active')
    expect(engine.entries['video-2']?.status).toBe('preloaded')
    expect(engine.entries['image-4']?.status).toBe('released')
  })

  it('builds a playback plan for active video and audio media from runtime state', () => {
    const engine = createMediaEngineState(model)
    const state = runtimeState({ activeSlideIndex: 1, sessionStatus: 'playing', timelinePositionMs: 2400, isMuted: true })

    syncMediaEngine(engine, state, model)

    expect(getMediaPlaybackPlan(engine, state)).toEqual([
      { elementId: 'video-1', action: 'play', muted: true, playbackRate: 1, seekMs: 2400 },
      { elementId: 'audio-1', action: 'play', muted: true, playbackRate: 1, seekMs: 2400 },
    ])
  })

  it('pauses active video and audio media when runtime is paused', () => {
    const engine = createMediaEngineState(model)
    const state = runtimeState({ activeSlideIndex: 1, sessionStatus: 'paused' })

    syncMediaEngine(engine, state, model)

    expect(getMediaPlaybackPlan(engine, state)).toEqual([
      { elementId: 'video-1', action: 'pause', muted: false, playbackRate: 1, seekMs: 0 },
      { elementId: 'audio-1', action: 'pause', muted: false, playbackRate: 1, seekMs: 0 },
    ])
  })
})
