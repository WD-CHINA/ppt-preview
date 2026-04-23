import { reactive } from 'vue'
import type { NormalizedPresentation, NormalizedSlide, PresentationRuntimeState } from '../types/presentation'

export interface PresentationRuntime {
  model: NormalizedPresentation
  state: PresentationRuntimeState
  play: () => void
  pause: () => void
  togglePlay: () => void
  advance: () => void
  retreat: () => void
  nextSlide: () => void
  previousSlide: () => void
  goToSlide: (index: number) => void
  seek: (positionMs: number) => void
  setMuted: (value: boolean) => void
  setFullscreen: (value: boolean) => void
  setPresenterMode: (value: boolean) => void
  setLoopEnabled: (value: boolean) => void
  setPlaybackRate: (value: number) => void
  tick: (deltaMs: number) => void
}

export function createPresentationRuntime(model: NormalizedPresentation): PresentationRuntime {
  const state = reactive<PresentationRuntimeState>({
    sessionStatus: model.slides.length > 0 ? 'ready' : 'idle',
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
  })

  syncWaitingTrigger()

  function play() {
    if (model.slides.length === 0) {
      return
    }
    if (state.sessionStatus === 'ended') {
      resetSlideState()
    }

    state.sessionStatus = state.transitionToSlideIndex != null ? 'transitioning' : 'playing'
  }

  function pause() {
    if (state.sessionStatus === 'playing' || state.sessionStatus === 'transitioning') {
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

  function advance() {
    if (state.transitionToSlideIndex != null) {
      return
    }

    const activeSlide = model.slides[state.activeSlideIndex]
    const onClickAnimations = getOnClickAnimations(activeSlide)

    if (state.currentTriggerIndex < onClickAnimations.length) {
      state.currentTriggerIndex += 1
      syncWaitingTrigger()
      return
    }

    if (activeSlide?.autoplay.advanceOnClick !== false) {
      nextSlide()
    }
  }

  function retreat() {
    if (state.transitionToSlideIndex != null) {
      return
    }

    if (state.currentTriggerIndex > 0) {
      state.currentTriggerIndex -= 1
      syncWaitingTrigger()
      return
    }

    previousSlide()
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

    if (clampedIndex === state.activeSlideIndex) {
      resetSlideState()
      state.sessionStatus = 'ready'
      return
    }

    const fromIndex = state.activeSlideIndex
    const toSlide = model.slides[clampedIndex]
    const durationMs = Math.max(toSlide?.transition?.durationMs ?? 0, 0)

    state.activeSlideIndex = clampedIndex
    resetSlideState()

    if (durationMs > 0) {
      state.transitionFromSlideIndex = fromIndex
      state.transitionToSlideIndex = clampedIndex
      state.transitionProgress = 0
      state.sessionStatus = 'transitioning'
      return
    }

    state.sessionStatus = 'ready'
  }

  function seek(positionMs: number) {
    state.timelinePositionMs = Math.max(0, positionMs)
    state.slideElapsedMs = state.timelinePositionMs
    syncWaitingTrigger()
  }

  function setMuted(value: boolean) {
    state.isMuted = value
  }

  function setFullscreen(value: boolean) {
    state.isFullscreen = value
  }

  function setPresenterMode(value: boolean) {
    state.presenterMode = value
  }

  function setLoopEnabled(value: boolean) {
    state.loopEnabled = value
  }

  function setPlaybackRate(value: number) {
    state.playbackRate = Math.max(0.25, Math.min(value, 3))
  }

  function tick(deltaMs: number) {
    if (state.sessionStatus !== 'playing' && state.sessionStatus !== 'transitioning') {
      return
    }

    const scaledDelta = deltaMs * state.playbackRate

    if (state.transitionToSlideIndex != null) {
      const transitionSlide = model.slides[state.transitionToSlideIndex]
      const durationMs = Math.max(transitionSlide?.transition?.durationMs ?? 0, 1)
      state.transitionProgress = Math.min(1, state.transitionProgress + scaledDelta / durationMs)

      if (state.transitionProgress >= 1) {
        state.transitionProgress = 1
        state.transitionFromSlideIndex = null
        state.transitionToSlideIndex = null
        state.sessionStatus = 'playing'
      }

      return
    }

    state.timelinePositionMs += scaledDelta
    state.slideElapsedMs += scaledDelta
    syncWaitingTrigger()

    const activeSlide = model.slides[state.activeSlideIndex]
    const advanceAfterMs = activeSlide?.autoplay.advanceAfterMs

    if (
      typeof advanceAfterMs === 'number' &&
      state.slideElapsedMs >= advanceAfterMs &&
      !state.waitingTrigger
    ) {
      nextSlide()
    }
  }

  function resetSlideState() {
    state.timelinePositionMs = 0
    state.slideElapsedMs = 0
    state.currentTriggerIndex = 0
    state.waitingTrigger = false
    state.transitionProgress = 0
    syncWaitingTrigger()
  }

  function syncWaitingTrigger() {
    const activeSlide = model.slides[state.activeSlideIndex]
    state.waitingTrigger = state.currentTriggerIndex < getOnClickAnimations(activeSlide).length
  }

  return {
    model,
    state,
    play,
    pause,
    togglePlay,
    advance,
    retreat,
    nextSlide,
    previousSlide,
    goToSlide,
    seek,
    setMuted,
    setFullscreen,
    setPresenterMode,
    setLoopEnabled,
    setPlaybackRate,
    tick,
  }
}

function getOnClickAnimations(slide?: NormalizedSlide) {
  return slide?.animations.filter((animation) => animation.trigger === 'onClick') ?? []
}
