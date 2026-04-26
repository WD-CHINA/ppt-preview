import { describe, expect, it } from 'vitest'
import type { NormalizedAnimation } from '../../types/presentation'
import {
  buildAutoAnimationSequence,
  countOnClickAnimations,
  evaluateAnimationGeometry,
  evaluateAnimationVisibility,
  getOnClickAnimationIndex,
} from './timelineEngine'

const animations: NormalizedAnimation[] = [
  {
    id: 'with-1',
    trigger: 'withPrevious',
    durationMs: 600,
    targetElementIds: ['title'],
    effect: 'fade',
  },
  {
    id: 'after-1',
    trigger: 'afterPrevious',
    durationMs: 400,
    targetElementIds: ['body'],
    effect: 'appear',
  },
  {
    id: 'click-1',
    trigger: 'onClick',
    durationMs: 200,
    targetElementIds: ['shape'],
    effect: 'fade',
  },
]

function animationAt(index: number): NormalizedAnimation {
  const animation = animations[index]
  if (!animation) {
    throw new Error(`Missing test animation at index ${index}`)
  }
  return animation
}

describe('timeline engine', () => {
  it('counts and indexes click-triggered animations', () => {
    expect(countOnClickAnimations(animations)).toBe(1)
    expect(getOnClickAnimationIndex(animations, 'click-1')).toBe(0)
    expect(getOnClickAnimationIndex(animations, 'missing')).toBe(-1)
  })

  it('builds the automatic animation sequence without click-triggered animations', () => {
    expect(buildAutoAnimationSequence(animations)).toEqual([
      { animation: animationAt(0), startMs: 0, endMs: 600 },
      { animation: animationAt(1), startMs: 600, endMs: 1000 },
    ])
  })

  it('evaluates click animation visibility from trigger index', () => {
    expect(evaluateAnimationVisibility(animationAt(2), animations, { timelinePositionMs: 0, currentTriggerIndex: 0 })).toEqual({
      visible: false,
      opacity: 0,
    })

    expect(evaluateAnimationVisibility(animationAt(2), animations, { timelinePositionMs: 0, currentTriggerIndex: 1 })).toEqual({
      visible: true,
      opacity: 1,
    })
  })

  it('evaluates automatic fade animation opacity from timeline position', () => {
    expect(evaluateAnimationVisibility(animationAt(0), animations, { timelinePositionMs: 300, currentTriggerIndex: 0 })).toEqual({
      visible: true,
      opacity: 0.5,
    })
  })

  it('evaluates motion-path geometry from timeline progress', () => {
    const movingAnimation: NormalizedAnimation = {
      id: 'move-line',
      trigger: 'afterPrevious',
      durationMs: 1000,
      targetElementIds: ['line-1'],
      effect: 'fade',
      motionPath: {
        xFrom: 0,
        yFrom: 0,
        xTo: 40,
        yTo: -20,
        rotateFrom: 0,
        rotateTo: 10,
      },
    }

    expect(evaluateAnimationGeometry(movingAnimation, [movingAnimation], { timelinePositionMs: 500, currentTriggerIndex: 0 })).toEqual({
      progress: 0.5,
      translateX: 20,
      translateY: -10,
      rotate: 5,
    })
  })
})
