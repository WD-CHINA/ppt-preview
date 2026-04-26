import { describe, expect, it } from 'vitest'
import { syncMediaElementPlayback, type MediaPlaybackTarget } from './mediaPlayback'

function createMediaTarget(): MediaPlaybackTarget & { playCalls: number; pauseCalls: number } {
  return {
    muted: false,
    playbackRate: 1,
    currentTime: 0,
    playCalls: 0,
    pauseCalls: 0,
    play() {
      this.playCalls += 1
      return Promise.resolve()
    },
    pause() {
      this.pauseCalls += 1
    },
  }
}

describe('mediaPlayback helper', () => {
  it('syncs play state, muted, rate and seek position', async () => {
    const target = createMediaTarget()

    syncMediaElementPlayback(target, { action: 'play', muted: true, playbackRate: 1.25, seekMs: 2300 })
    await Promise.resolve()

    expect(target.muted).toBe(true)
    expect(target.playbackRate).toBe(1.25)
    expect(target.currentTime).toBe(2.3)
    expect(target.playCalls).toBe(1)
    expect(target.pauseCalls).toBe(0)
  })

  it('pauses media when playback state requests pause', () => {
    const target = createMediaTarget()

    syncMediaElementPlayback(target, { action: 'pause', muted: false, playbackRate: 0.75, seekMs: 1500 })

    expect(target.muted).toBe(false)
    expect(target.playbackRate).toBe(0.75)
    expect(target.currentTime).toBe(1.5)
    expect(target.playCalls).toBe(0)
    expect(target.pauseCalls).toBe(1)
  })
})
