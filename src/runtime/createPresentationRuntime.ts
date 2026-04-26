import type { NormalizedPresentation, PresentationRuntimeState } from '../types/presentation'
import {
  createMediaEngineState,
  syncMediaEngine,
  type MediaEngineState,
} from './media/mediaEngine'
import { getPlaybackPolicyDecision } from './policy/playbackPolicy'
import {
  createSessionStore,
  resetSlideSessionState,
  setPlaybackRate as setSessionPlaybackRate,
  syncWaitingTrigger as syncSessionWaitingTrigger,
} from './session/sessionStore'
import { countOnClickAnimations } from './timeline/timelineEngine'
import {
  beginSlideTransition,
  getSlideTransitionDurationMs,
  tickSlideTransition,
} from './transition/transitionEngine'

export interface PresentationRuntime {
  model: NormalizedPresentation
  state: PresentationRuntimeState
  media: MediaEngineState
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
  const state = createSessionStore(model)
  const media = createMediaEngineState(model)
  syncMedia()

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

    if (state.currentTriggerIndex < countOnClickAnimations(activeSlide?.animations ?? [])) {
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
    if (state.transitionToSlideIndex != null) {
      return
    }

    if (model.slides.length === 0) {
      return
    }

    if (state.activeSlideIndex >= model.slides.length - 1) {
      if (state.loopEnabled) {
        goToSlide(0)
      } else {
        state.sessionStatus = 'ended'
        syncMedia()
      }
      return
    }

    goToSlide(state.activeSlideIndex + 1)
  }

  function previousSlide() {
    if (state.transitionToSlideIndex != null) {
      return
    }

    if (model.slides.length === 0) {
      return
    }

    goToSlide(Math.max(0, state.activeSlideIndex - 1))
  }

  function goToSlide(index: number) {
    if (state.transitionToSlideIndex != null) {
      return
    }

    const clampedIndex = Math.min(Math.max(index, 0), Math.max(model.slides.length - 1, 0))

    if (clampedIndex === state.activeSlideIndex) {
      resetSlideState()
      state.sessionStatus = 'ready'
      syncMedia()
      return
    }

    const fromIndex = state.activeSlideIndex
    const transitionSlide = model.slides[clampedIndex]
    const durationMs = getSlideTransitionDurationMs(transitionSlide)

    state.activeSlideIndex = clampedIndex
    resetSlideState()

    if (durationMs > 0) {
      beginSlideTransition(state, { fromIndex, toIndex: clampedIndex, transitionSlide })
      syncMedia()
      return
    }

    state.sessionStatus = 'ready'
    syncMedia()
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
    setSessionPlaybackRate(state, value)
  }

  function tick(deltaMs: number) {
    if (state.sessionStatus !== 'playing' && state.sessionStatus !== 'transitioning') {
      return
    }

    const scaledDelta = deltaMs * state.playbackRate

    if (state.transitionToSlideIndex != null) {
      const transitionSlide = model.slides[state.transitionToSlideIndex]
      tickSlideTransition(state, transitionSlide, scaledDelta)
      syncMedia()
      return
    }

    state.timelinePositionMs += scaledDelta
    state.slideElapsedMs += scaledDelta
    syncWaitingTrigger()

    const activeSlide = model.slides[state.activeSlideIndex]
    const policyDecision = getPlaybackPolicyDecision(activeSlide, state)

    if (policyDecision.type === 'advance-slide') {
      nextSlide()
    }
  }

  function resetSlideState() {
    resetSlideSessionState(state, model.slides[state.activeSlideIndex])
  }

  function syncWaitingTrigger() {
    syncSessionWaitingTrigger(state, model.slides[state.activeSlideIndex])
  }

  function syncMedia() {
    syncMediaEngine(media, state, model)
  }

  return {
    model,
    state,
    media,
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
