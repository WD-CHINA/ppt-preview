import { describe, expect, it } from 'vitest'
import type { PresentationFrame } from '../../types/presentation'
import { getStageViewportDescriptors } from './stageViewportModel'

const baseFrame: PresentationFrame = {
  width: 1280,
  height: 720,
  currentSlideIndex: 1,
  isTransitioning: false,
  transitionProgress: 1,
  current: {
    slideId: 'slide-2',
    slideName: 'Slide 2',
    background: {},
    elements: [],
    media: [],
  },
  previous: {
    slideId: 'slide-1',
    slideName: 'Slide 1',
    background: {},
    elements: [],
    media: [],
  },
}

describe('stageViewportModel', () => {
  it('renders only the current viewport when no transition is active', () => {
    expect(getStageViewportDescriptors(baseFrame)).toEqual([
      {
        key: 'current-slide-2',
        slide: baseFrame.current,
        active: true,
        transitionProgress: 1,
        transitionRole: undefined,
        transitionType: undefined,
        transitionOrientation: undefined,
      },
    ])
  })

  it('renders previous + current viewports only while transitioning', () => {
    expect(
      getStageViewportDescriptors({
        ...baseFrame,
        isTransitioning: true,
        transitionProgress: 0.4,
        transitionType: 'push',
        transitionDirection: 'u',
        transitionOrientation: 'vert',
      }),
    ).toEqual([
      {
        key: 'previous-slide-1',
        slide: baseFrame.previous,
        active: false,
        transitionProgress: 0.4,
        transitionRole: 'previous',
        transitionType: 'push',
        transitionDirection: 'u',
        transitionOrientation: 'vert',
      },
      {
        key: 'current-slide-2',
        slide: baseFrame.current,
        active: true,
        transitionProgress: 0.4,
        transitionRole: 'current',
        transitionType: 'push',
        transitionDirection: 'u',
        transitionOrientation: 'vert',
      },
    ])
  })
})
