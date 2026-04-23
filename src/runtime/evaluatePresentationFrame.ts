import type {
  EvaluatedElementFrame,
  EvaluatedSlideFrame,
  NormalizedAnimation,
  NormalizedElement,
  NormalizedPresentation,
  NormalizedSlide,
  PresentationFrame,
  PresentationRuntimeState,
} from '../types/presentation'

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
  }
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

  if (animation.trigger === 'onClick') {
    const triggerIndex = getOnClickAnimationIndex(slide.animations, animation.id)
    const isShown = triggerIndex < state.currentTriggerIndex
    return {
      visible: isShown,
      opacity: isShown ? 1 : 0,
    }
  }

  const autoSequence = buildAutoSequence(slide.animations)
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

function getOnClickAnimationIndex(animations: NormalizedAnimation[], animationId: string) {
  return animations.filter((animation) => animation.trigger === 'onClick').findIndex((animation) => animation.id === animationId)
}

function buildAutoSequence(animations: NormalizedAnimation[]) {
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
