import { reactive } from 'vue'
import type { NormalizedPresentation, PresentationRuntimeState } from '../types/presentation'

export interface PresentationRuntime {
  model: NormalizedPresentation
  state: PresentationRuntimeState
  play: () => void
  pause: () => void
  togglePlay: () => void
  nextSlide: () => void
  previousSlide: () => void
  goToSlide: (index: number) => void
  seek: (positionMs: number) => void
  setMuted: (value: boolean) => void
  setPresenterMode: (value: boolean) => void
  setLoopEnabled: (value: boolean) => void
  tick: (deltaMs: number) => void
}

export function createPresentationRuntime(model: NormalizedPresentation): PresentationRuntime {
  const state = reactive<PresentationRuntimeState>({
    sessionStatus: model.slides.length > 0 ? 'ready' : 'idle',
    activeSlideIndex: 0,
    timelinePositionMs: 0,
    currentTriggerIndex: 0,
    waitingTrigger: false,
    transitionProgress: 0,
    isFullscreen: false,
    isMuted: false,
    presenterMode: false,
    loopEnabled: false,
    playbackRate: 1,
  })

  function play() {
    if (model.slides.length === 0) {
      return
    }
    state.sessionStatus = 'playing'
  }

  function pause() {
    if (state.sessionStatus === 'playing') {
      state.sessionStatus = 'paused'
    }
  }

  function togglePlay() {
    if (state.sessionStatus === 'playing') {
      pause()
      return
    }
    play()
  }

  function nextSlide() {
    if (model.slides.length === 0) {
      return
    }

    if (state.activeSlideIndex >= model.slides.length - 1) {
      if (state.loopEnabled) {
        goToSlide(0)
      } else {
        state.sessionStatus = 'ended'
      }
      return
    }

    goToSlide(state.activeSlideIndex + 1)
  }

  function previousSlide() {
    if (model.slides.length === 0) {
      return
    }

    goToSlide(Math.max(0, state.activeSlideIndex - 1))
  }

  function goToSlide(index: number) {
    const clampedIndex = Math.min(Math.max(index, 0), Math.max(model.slides.length - 1, 0))
    state.activeSlideIndex = clampedIndex
    state.timelinePositionMs = 0
    state.currentTriggerIndex = 0
    state.waitingTrigger = false
    state.transitionProgress = 0
    state.sessionStatus = 'ready'
  }

  function seek(positionMs: number) {
    state.timelinePositionMs = Math.max(0, positionMs)
  }

  function setMuted(value: boolean) {
    state.isMuted = value
  }

  function setPresenterMode(value: boolean) {
    state.presenterMode = value
  }

  function setLoopEnabled(value: boolean) {
    state.loopEnabled = value
  }

  function tick(deltaMs: number) {
    if (state.sessionStatus !== 'playing') {
      return
    }

    state.timelinePositionMs += deltaMs * state.playbackRate

    const activeSlide = model.slides[state.activeSlideIndex]
    const advanceAfterMs = activeSlide?.autoplay.advanceAfterMs

    if (typeof advanceAfterMs === 'number' && state.timelinePositionMs >= advanceAfterMs) {
      nextSlide()
    }
  }

  return {
    model,
    state,
    play,
    pause,
    togglePlay,
    nextSlide,
    previousSlide,
    goToSlide,
    seek,
    setMuted,
    setPresenterMode,
    setLoopEnabled,
    tick,
  }
}
