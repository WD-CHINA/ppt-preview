import { describe, expect, it } from 'vitest'
import { getTransitionViewportStyle } from './transitionViewportModel'

describe('transitionViewportModel', () => {
  it('keeps fade transition behavior as opacity-based crossfade', () => {
    expect(getTransitionViewportStyle({ transitionType: 'fade', role: 'current', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      opacity: 0.25,
      transform: 'translateY(13.5px)',
      transition: 'none',
    })
  })

  it('uses horizontal push motion for push transitions', () => {
    expect(getTransitionViewportStyle({ transitionType: 'push', role: 'current', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      opacity: 1,
      transform: 'translateX(960px)',
    })
    expect(getTransitionViewportStyle({ transitionType: 'push', role: 'previous', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      opacity: 1,
      transform: 'translateX(-320px)',
    })
  })

  it('supports directional push transitions', () => {
    expect(getTransitionViewportStyle({ transitionType: 'push', transitionDirection: 'l', role: 'current', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      transform: 'translateX(-960px)',
    })
    expect(getTransitionViewportStyle({ transitionType: 'push', transitionDirection: 'd', role: 'current', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      transform: 'translateY(540px)',
    })
    expect(getTransitionViewportStyle({ transitionType: 'push', transitionDirection: 'u', role: 'previous', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      transform: 'translateY(180px)',
    })
  })

  it('reveals wipe transitions using clip-path instead of moving the previous slide', () => {
    expect(getTransitionViewportStyle({ transitionType: 'wipe', role: 'current', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      opacity: 1,
      clipPath: 'inset(0 75% 0 0)',
      transform: 'none',
    })
    expect(getTransitionViewportStyle({ transitionType: 'wipe', transitionDirection: 'l', role: 'current', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      clipPath: 'inset(0 0 0 75%)',
    })
    expect(getTransitionViewportStyle({ transitionType: 'wipe', transitionDirection: 'u', role: 'current', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      clipPath: 'inset(75% 0 0 0)',
    })
    expect(getTransitionViewportStyle({ transitionType: 'wipe', transitionDirection: 'd', role: 'current', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      clipPath: 'inset(0 0 75% 0)',
    })
    expect(getTransitionViewportStyle({ transitionType: 'wipe', role: 'previous', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      opacity: 1,
      transform: 'none',
    })
  })

  it('treats cover transitions like a current slide that covers the previous slide', () => {
    expect(getTransitionViewportStyle({ transitionType: 'cover', role: 'current', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      opacity: 1,
      transform: 'translateX(960px)',
      transition: 'none',
    })
    expect(getTransitionViewportStyle({ transitionType: 'cover', role: 'previous', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      opacity: 1,
      transform: 'none',
      transition: 'none',
    })
  })

  it('treats uncover transitions like the previous slide moves away while the current slide stays put', () => {
    expect(getTransitionViewportStyle({ transitionType: 'uncover', role: 'current', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      opacity: 1,
      transform: 'none',
      transition: 'none',
    })
    expect(getTransitionViewportStyle({ transitionType: 'uncover', role: 'previous', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      opacity: 1,
      transform: 'translateX(-320px)',
      transition: 'none',
    })
  })

  it('renders vertical split-out transitions as a scale-based reveal/collapse pair', () => {
    expect(getTransitionViewportStyle({ transitionType: 'split', transitionOrientation: 'vert', transitionDirection: 'out', role: 'current', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      opacity: 1,
      transform: 'scaleY(0.75)',
      transition: 'none',
    })
    expect(getTransitionViewportStyle({ transitionType: 'split', transitionOrientation: 'vert', transitionDirection: 'out', role: 'previous', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      opacity: 1,
      transform: 'scaleY(0.25)',
      transition: 'none',
    })
  })

  it('supports horizontal split-in transitions', () => {
    expect(getTransitionViewportStyle({ transitionType: 'split', transitionOrientation: 'horz', transitionDirection: 'in', role: 'current', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      transform: 'scaleX(0.25)',
    })
    expect(getTransitionViewportStyle({ transitionType: 'split', transitionOrientation: 'horz', transitionDirection: 'in', role: 'previous', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      transform: 'scaleX(0.75)',
    })
  })

  it('renders zoom transitions as a scale-based crossfade fallback', () => {
    expect(getTransitionViewportStyle({ transitionType: 'zoom', role: 'current', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      opacity: 0.25,
      transform: 'scale(0.91)',
      transition: 'none',
    })
    expect(getTransitionViewportStyle({ transitionType: 'zoom', role: 'previous', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      opacity: 0.75,
      transform: 'scale(1.03)',
      transition: 'none',
    })
  })

  it('treats random transitions as a neutral crossfade fallback', () => {
    expect(getTransitionViewportStyle({ transitionType: 'random', role: 'current', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      opacity: 0.25,
      transform: 'none',
      transition: 'none',
    })
    expect(getTransitionViewportStyle({ transitionType: 'random', role: 'previous', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      opacity: 0.75,
      transform: 'none',
      transition: 'none',
    })
  })

  it('disables CSS interpolation even after transition ends', () => {
    expect(getTransitionViewportStyle({ width: 1280, height: 720 })).toMatchObject({
      transition: 'none',
    })
  })
})
