import type { EvaluatedSlideFrame, PresentationFrame } from '../../types/presentation'

export interface StageViewportDescriptor {
  key: string
  slide: EvaluatedSlideFrame | undefined
  active: boolean
  transitionProgress: number
  transitionRole?: 'current' | 'previous'
  transitionType?: string
  transitionDirection?: string
  transitionOrientation?: string
}

export function getStageViewportDescriptors(frame: PresentationFrame): StageViewportDescriptor[] {
  const descriptors: StageViewportDescriptor[] = []

  if (frame.isTransitioning && frame.previous) {
    descriptors.push({
      key: `previous-${frame.previous.slideId}`,
      slide: frame.previous,
      active: false,
      transitionProgress: frame.transitionProgress,
      transitionRole: 'previous',
      transitionType: frame.transitionType,
      transitionDirection: frame.transitionDirection,
      transitionOrientation: frame.transitionOrientation,
    })
  }

  descriptors.push({
    key: `current-${frame.current?.slideId ?? frame.currentSlideIndex}`,
    slide: frame.current,
    active: true,
    transitionProgress: frame.isTransitioning ? frame.transitionProgress : 1,
    transitionRole: frame.isTransitioning ? 'current' : undefined,
    transitionType: frame.isTransitioning ? frame.transitionType : undefined,
    transitionDirection: frame.isTransitioning ? frame.transitionDirection : undefined,
    transitionOrientation: frame.isTransitioning ? frame.transitionOrientation : undefined,
  })

  return descriptors
}
