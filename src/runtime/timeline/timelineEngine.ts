import type { NormalizedAnimation } from '../../types/presentation'

export interface TimelineCursorState {
  timelinePositionMs: number
  currentTriggerIndex: number
}

export interface AutoAnimationSequenceEntry {
  animation: NormalizedAnimation
  startMs: number
  endMs: number
}

export interface AnimationVisibilityState {
  visible: boolean
  opacity: number
}

export interface AnimationGeometryState {
  progress: number
  translateX: number
  translateY: number
  rotate: number
}

export function countOnClickAnimations(animations: NormalizedAnimation[]) {
  return animations.filter((animation) => animation.trigger === 'onClick').length
}

export function getOnClickAnimationIndex(animations: NormalizedAnimation[], animationId: string) {
  return animations.filter((animation) => animation.trigger === 'onClick').findIndex((animation) => animation.id === animationId)
}

export function buildAutoAnimationSequence(animations: NormalizedAnimation[]): AutoAnimationSequenceEntry[] {
  let cursor = 0

  return animations
    .filter((animation) => animation.trigger !== 'onClick')
    .map((animation) => {
      const startMs = animation.trigger === 'withPrevious' ? Math.max(0, cursor - animation.durationMs) : cursor
      const endMs = startMs + animation.durationMs
      cursor = Math.max(cursor, endMs)

      return {
        animation,
        startMs,
        endMs,
      }
    })
}

export function evaluateAnimationVisibility(
  animation: NormalizedAnimation,
  animations: NormalizedAnimation[],
  state: TimelineCursorState,
): AnimationVisibilityState {
  if (animation.trigger === 'onClick') {
    const triggerIndex = getOnClickAnimationIndex(animations, animation.id)
    const isShown = triggerIndex >= 0 && triggerIndex < state.currentTriggerIndex
    return {
      visible: isShown,
      opacity: isShown ? 1 : 0,
    }
  }

  const autoSequence = buildAutoAnimationSequence(animations)
  const autoEntry = autoSequence.find((entry) => entry.animation.id === animation.id)

  if (!autoEntry) {
    return { visible: true, opacity: 1 }
  }

  if (state.timelinePositionMs <= autoEntry.startMs) {
    return { visible: false, opacity: 0 }
  }

  if (state.timelinePositionMs >= autoEntry.endMs) {
    return { visible: true, opacity: 1 }
  }

  const progress = (state.timelinePositionMs - autoEntry.startMs) / Math.max(autoEntry.animation.durationMs, 1)
  return {
    visible: true,
    opacity: animation.effect === 'appear' ? 1 : progress,
  }
}

export function evaluateAnimationGeometry(
  animation: NormalizedAnimation,
  animations: NormalizedAnimation[],
  state: TimelineCursorState,
): AnimationGeometryState | null {
  if (!animation.motionPath) {
    return null
  }

  const progress = getAnimationProgress(animation, animations, state)
  const xDelta = animation.motionPath.xTo - animation.motionPath.xFrom
  const yDelta = animation.motionPath.yTo - animation.motionPath.yFrom
  const rotateDelta = animation.motionPath.rotateTo - animation.motionPath.rotateFrom

  return {
    progress,
    translateX: animation.motionPath.xFrom + xDelta * progress,
    translateY: animation.motionPath.yFrom + yDelta * progress,
    rotate: animation.motionPath.rotateFrom + rotateDelta * progress,
  }
}

function getAnimationProgress(
  animation: NormalizedAnimation,
  animations: NormalizedAnimation[],
  state: TimelineCursorState,
) {
  if (animation.trigger === 'onClick') {
    const triggerIndex = getOnClickAnimationIndex(animations, animation.id)
    return triggerIndex >= 0 && triggerIndex < state.currentTriggerIndex ? 1 : 0
  }

  const autoSequence = buildAutoAnimationSequence(animations)
  const autoEntry = autoSequence.find((entry) => entry.animation.id === animation.id)

  if (!autoEntry) {
    return 1
  }

  if (state.timelinePositionMs <= autoEntry.startMs) {
    return 0
  }

  if (state.timelinePositionMs >= autoEntry.endMs) {
    return 1
  }

  return (state.timelinePositionMs - autoEntry.startMs) / Math.max(autoEntry.animation.durationMs, 1)
}
