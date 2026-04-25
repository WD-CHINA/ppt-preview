import type { NormalizedSlide, PresentationRuntimeState } from '../../types/presentation'

export interface BeginSlideTransitionInput {
  fromIndex: number
  toIndex: number
  toSlide?: NormalizedSlide
}

export type TransitionTickResult = { status: 'idle' } | { status: 'running' } | { status: 'finished' }

export function beginSlideTransition(
  state: PresentationRuntimeState,
  { fromIndex, toIndex, toSlide }: BeginSlideTransitionInput,
) {
  const durationMs = getSlideTransitionDurationMs(toSlide)

  if (durationMs <= 0) {
    state.transitionFromSlideIndex = null
    state.transitionToSlideIndex = null
    state.transitionProgress = 0
    state.sessionStatus = 'ready'
    return false
  }

  state.transitionFromSlideIndex = fromIndex
  state.transitionToSlideIndex = toIndex
  state.transitionProgress = 0
  state.sessionStatus = 'transitioning'
  return true
}

export function tickSlideTransition(
  state: PresentationRuntimeState,
  transitionSlide: NormalizedSlide | undefined,
  scaledDeltaMs: number,
): TransitionTickResult {
  if (state.transitionToSlideIndex == null) {
    return { status: 'idle' }
  }

  const durationMs = Math.max(getSlideTransitionDurationMs(transitionSlide), 1)
  state.transitionProgress = Math.min(1, state.transitionProgress + scaledDeltaMs / durationMs)

  if (state.transitionProgress < 1) {
    return { status: 'running' }
  }

  state.transitionProgress = 1
  state.transitionFromSlideIndex = null
  state.transitionToSlideIndex = null
  state.sessionStatus = 'playing'

  return { status: 'finished' }
}

export function getSlideTransitionDurationMs(slide?: NormalizedSlide) {
  return Math.max(slide?.transition?.durationMs ?? 0, 0)
}
