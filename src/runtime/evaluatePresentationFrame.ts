import type {
  EvaluatedElementFrame,
  EvaluatedMediaFrame,
  EvaluatedSlideFrame,
  NormalizedElement,
  NormalizedPresentation,
  NormalizedSlide,
  PresentationFrame,
  PresentationRuntimeState,
} from '../types/presentation'
import { evaluateAnimationVisibility } from './timeline/timelineEngine'

export function evaluatePresentationFrame(
  model: NormalizedPresentation,
  state: PresentationRuntimeState,
): PresentationFrame {
  const isTransitioning = state.transitionToSlideIndex != null
  const currentSlideIndex = isTransitioning ? (state.transitionToSlideIndex ?? state.activeSlideIndex) : state.activeSlideIndex

  return {
    width: model.width,
    height: model.height,
    currentSlideIndex,
    isTransitioning,
    transitionProgress: state.transitionProgress,
    previous: isTransitioning
      ? evaluateSlideFrame(model.slides[state.transitionFromSlideIndex ?? -1])
      : evaluateSlideFrame(model.slides[currentSlideIndex - 1]),
    current: evaluateSlideFrame(model.slides[currentSlideIndex], state),
    next: isTransitioning ? undefined : evaluateSlideFrame(model.slides[currentSlideIndex + 1]),
  }
}

function evaluateSlideFrame(
  slide: NormalizedSlide | undefined,
  state?: PresentationRuntimeState,
): EvaluatedSlideFrame | undefined {
  if (!slide) {
    return undefined
  }

  return {
    slideId: slide.id,
    slideName: slide.name,
    background: slide.background,
    elements: slide.elements.map((element) => evaluateElementFrame(slide, element, state)),
    media: collectEvaluatedMediaFrames(slide.elements, state),
  }
}

function collectEvaluatedMediaFrames(
  elements: NormalizedElement[],
  state?: PresentationRuntimeState,
): EvaluatedMediaFrame[] {
  return elements.flatMap((element) => {
    const childMedia = element.children ? collectEvaluatedMediaFrames(element.children, state) : []

    if (!element.media || !isEvaluatedMediaType(element.type)) {
      return childMedia
    }

    const frame: EvaluatedMediaFrame = {
      elementId: element.id,
      type: element.type,
      media: element.media,
    }

    if (state && (element.type === 'video' || element.type === 'audio')) {
      frame.playback = {
        action: state.sessionStatus === 'playing' || state.sessionStatus === 'transitioning' ? 'play' : 'pause',
        muted: state.isMuted,
        playbackRate: state.playbackRate,
        seekMs: Math.max(0, state.timelinePositionMs),
      }
    }

    return [frame, ...childMedia]
  })
}

function isEvaluatedMediaType(type: NormalizedElement['type']): type is EvaluatedMediaFrame['type'] {
  return type === 'image' || type === 'video' || type === 'audio' || type === 'math'
}

function evaluateElementFrame(
  slide: NormalizedSlide,
  element: NormalizedElement,
  state?: PresentationRuntimeState,
): EvaluatedElementFrame {
  const animationState = state ? evaluateElementAnimationState(slide, element.id, state) : { visible: true, opacity: 1 }

  return {
    id: element.id,
    name: element.name,
    type: element.type,
    order: element.order,
    visible: animationState.visible,
    opacity: animationState.opacity,
    transform: `translate(${element.bounds.x}px, ${element.bounds.y}px) rotate(${element.bounds.rotate}deg)`,
    style: element.style,
    text: element.text,
    html: element.html,
    media: element.media,
    bounds: element.bounds,
    shape: element.shape,
    children: element.children?.map((child) => evaluateElementFrame(slide, child, state)),
  }
}

function evaluateElementAnimationState(
  slide: NormalizedSlide,
  elementId: string,
  state: PresentationRuntimeState,
) {
  const animation = slide.animations.find((candidate) => candidate.targetElementIds.includes(elementId))

  if (!animation) {
    return { visible: true, opacity: 1 }
  }

  return evaluateAnimationVisibility(animation, slide.animations, state)
}
