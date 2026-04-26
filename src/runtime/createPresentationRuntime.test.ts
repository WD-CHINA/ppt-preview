import { describe, expect, it, vi } from 'vitest'
import type { NormalizedElement, NormalizedPresentation, NormalizedSlide } from '../types/presentation'
import { createPresentationRuntime } from './createPresentationRuntime'
import { getMediaPlaybackPlan } from './media/mediaEngine'

function makeSlide(id: string, durationMs?: number, elements: NormalizedElement[] = []): NormalizedSlide {
  return {
    id,
    name: id,
    background: {},
    transition: durationMs == null ? undefined : { type: 'fade', durationMs },
    autoplay: { advanceOnClick: true },
    animations: [],
    elements,
  }
}

function makeVideoElement(id: string): NormalizedElement {
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

function makeModel(): NormalizedPresentation {
  return {
    width: 1280,
    height: 720,
    theme: { colors: {} },
    usedFonts: [],
    slides: [makeSlide('slide-1', 400), makeSlide('slide-2', 400), makeSlide('slide-3', 400)],
  }
}

function makeMediaModel(): NormalizedPresentation {
  return {
    width: 1280,
    height: 720,
    theme: { colors: {} },
    usedFonts: [],
    slides: [makeSlide('slide-1', undefined, [makeVideoElement('video-1')]), makeSlide('slide-2', undefined, [makeVideoElement('video-2')])],
  }
}

describe('presentation runtime facade', () => {
  it('uses the destination slide transition timing when moving to the next slide', () => {
    const model: NormalizedPresentation = {
      width: 1280,
      height: 720,
      theme: { colors: {} },
      usedFonts: [],
      slides: [
        makeSlide('slide-1', 1000),
        makeSlide('slide-2', 200),
      ],
    }
    const runtime = createPresentationRuntime(model)

    runtime.nextSlide()
    runtime.tick(100)

    expect(runtime.state.sessionStatus).toBe('transitioning')
    expect(runtime.state.transitionProgress).toBeCloseTo(0.5, 5)

    runtime.tick(100)

    expect(runtime.state.sessionStatus).toBe('playing')
    expect(runtime.state.transitionToSlideIndex).toBeNull()
  })

  it('ignores direct slide navigation while a transition is active to avoid frozen transition state', () => {
    const runtime = createPresentationRuntime(makeModel())

    runtime.nextSlide()
    expect(runtime.state.sessionStatus).toBe('transitioning')
    expect(runtime.state.transitionToSlideIndex).toBe(1)

    runtime.goToSlide(1)
    runtime.nextSlide()

    expect(runtime.state.sessionStatus).toBe('transitioning')
    expect(runtime.state.activeSlideIndex).toBe(1)
    expect(runtime.state.transitionFromSlideIndex).toBe(0)
    expect(runtime.state.transitionToSlideIndex).toBe(1)
  })

  it('does not end the deck when nextSlide is invoked during a transition to the last slide', () => {
    const runtime = createPresentationRuntime(makeModel())

    runtime.goToSlide(2)
    expect(runtime.state.sessionStatus).toBe('transitioning')
    expect(runtime.state.transitionToSlideIndex).toBe(2)

    runtime.nextSlide()

    expect(runtime.state.sessionStatus).toBe('transitioning')
    expect(runtime.state.activeSlideIndex).toBe(2)
    expect(runtime.state.transitionFromSlideIndex).toBe(0)
    expect(runtime.state.transitionToSlideIndex).toBe(2)
  })

  it('syncs media engine state and playback plan through runtime controls', () => {
    const runtime = createPresentationRuntime(makeMediaModel())

    expect(runtime.media.entries['video-1']?.status).toBe('active')
    expect(runtime.media.entries['video-2']?.status).toBe('preloaded')

    runtime.play()
    runtime.seek(1500)
    runtime.setMuted(true)

    expect(getMediaPlaybackPlan(runtime.media, runtime.state)).toEqual([
      { elementId: 'video-1', action: 'play', muted: true, playbackRate: 1, seekMs: 1500 },
    ])

    runtime.goToSlide(1)

    expect(runtime.media.entries['video-1']?.status).toBe('preloaded')
    expect(runtime.media.entries['video-2']?.status).toBe('active')
  })

  it('disposes media engine object URLs when the runtime is torn down', () => {
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const runtime = createPresentationRuntime({
      width: 1280,
      height: 720,
      theme: { colors: {} },
      usedFonts: [],
      slides: [
        makeSlide('slide-1', undefined, [
          {
            id: 'video-1',
            type: 'video',
            name: 'video-1',
            order: 1,
            bounds: { x: 0, y: 0, width: 100, height: 100, rotate: 0 },
            style: {},
            media: { objectUrl: 'blob:video-1', cleanup: 'revoke-object-url' },
            raw: null,
          },
        ]),
      ],
    })

    runtime.dispose()

    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:video-1')
    expect(runtime.media.entries['video-1']?.status).toBe('released')

    revokeObjectUrl.mockRestore()
  })
})
