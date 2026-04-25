import type { NormalizedSlide, PresentationRuntimeState } from '../../types/presentation'

export type PlaybackPolicyDecision =
  | { type: 'continue' }
  | { type: 'wait-for-trigger' }
  | { type: 'advance-slide' }

export function getPlaybackPolicyDecision(
  slide: NormalizedSlide | undefined,
  state: PresentationRuntimeState,
): PlaybackPolicyDecision {
  if (!slide) {
    return { type: 'continue' }
  }

  const advanceAfterMs = slide.autoplay.advanceAfterMs

  if (typeof advanceAfterMs !== 'number' || state.slideElapsedMs < advanceAfterMs) {
    return { type: 'continue' }
  }

  if (state.waitingTrigger) {
    return { type: 'wait-for-trigger' }
  }

  return { type: 'advance-slide' }
}
