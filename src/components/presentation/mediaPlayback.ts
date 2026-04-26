export interface MediaPlaybackState {
  action: 'play' | 'pause'
  muted: boolean
  playbackRate: number
  seekMs: number
}

export interface MediaPlaybackTarget {
  muted: boolean
  playbackRate: number
  currentTime: number
  play?: () => Promise<void> | void
  pause?: () => void
}

export function syncMediaElementPlayback(target: MediaPlaybackTarget | null | undefined, playback?: MediaPlaybackState) {
  if (!target || !playback) {
    return
  }

  target.muted = playback.muted
  target.playbackRate = playback.playbackRate

  const nextTime = Math.max(0, playback.seekMs / 1000)

  try {
    target.currentTime = nextTime
  } catch {
    // Some media elements need metadata before currentTime can be set.
  }

  if (playback.action === 'play') {
    const result = target.play?.()

    if (result && typeof (result as Promise<void>).catch === 'function') {
      void (result as Promise<void>).catch(() => undefined)
    }
    return
  }

  target.pause?.()
}
