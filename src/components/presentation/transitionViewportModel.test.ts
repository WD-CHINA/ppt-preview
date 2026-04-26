import { describe, expect, it } from 'vitest'
import { getTransitionViewportStyle } from './transitionViewportModel'

describe('transitionViewportModel', () => {
  it('keeps fade transition behavior as opacity-based crossfade', () => {
    expect(getTransitionViewportStyle({ transitionType: 'fade', role: 'current', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      opacity: 0.25,
      transform: 'translateY(13.5px)',
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

  it('reveals wipe transitions using clip-path instead of moving the previous slide', () => {
    expect(getTransitionViewportStyle({ transitionType: 'wipe', role: 'current', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      opacity: 1,
      clipPath: 'inset(0 75% 0 0)',
      transform: 'none',
    })
    expect(getTransitionViewportStyle({ transitionType: 'wipe', role: 'previous', progress: 0.25, width: 1280, height: 720 })).toMatchObject({
      opacity: 1,
      transform: 'none',
    })
  })
})
