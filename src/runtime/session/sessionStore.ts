import { reactive } from 'vue'
import { countOnClickAnimations } from '../timeline/timelineEngine'
import type { NormalizedPresentation, NormalizedSlide, PresentationRuntimeState } from '../../types/presentation'

export function createSessionStore(model: NormalizedPresentation): PresentationRuntimeState {
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

  syncWaitingTrigger(state, model.slides[state.activeSlideIndex])

  return state
}

export function resetSlideSessionState(state: PresentationRuntimeState, slide?: NormalizedSlide) {
  state.timelinePositionMs = 0
  state.slideElapsedMs = 0
  state.currentTriggerIndex = 0
  state.waitingTrigger = false
  state.transitionProgress = 0
  syncWaitingTrigger(state, slide)
}

export function syncWaitingTrigger(state: PresentationRuntimeState, slide?: NormalizedSlide) {
  state.waitingTrigger = state.currentTriggerIndex < getOnClickAnimationCount(slide)
}

export function setPlaybackRate(state: PresentationRuntimeState, value: number) {
  state.playbackRate = Math.max(0.25, Math.min(value, 3))
}

export function getOnClickAnimationCount(slide?: NormalizedSlide) {
  return countOnClickAnimations(slide?.animations ?? [])
}
