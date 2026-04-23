import type { EvaluatedSlideFrame, NormalizedPresentation, NormalizedSlide, PresentationFrame, PresentationRuntimeState } from '../types/presentation'

export function evaluatePresentationFrame(
  model: NormalizedPresentation,
  state: PresentationRuntimeState,
): PresentationFrame {
  return {
    width: model.width,
    height: model.height,
    currentSlideIndex: state.activeSlideIndex,
    previous: evaluateSlideFrame(model.slides[state.activeSlideIndex - 1]),
    current: evaluateSlideFrame(model.slides[state.activeSlideIndex]),
    next: evaluateSlideFrame(model.slides[state.activeSlideIndex + 1]),
  }
}

function evaluateSlideFrame(slide: NormalizedSlide | undefined): EvaluatedSlideFrame | undefined {
  if (!slide) {
    return undefined
  }

  return {
    slideId: slide.id,
    background: slide.background,
    elements: slide.elements.map((element) => ({
      id: element.id,
      type: element.type,
      visible: true,
      opacity: 1,
      transform: `translate(${element.bounds.x}px, ${element.bounds.y}px) rotate(${element.bounds.rotate}deg)`,
      style: element.style,
      text: element.text,
      html: element.html,
      media: element.media,
      bounds: element.bounds,
    })),
  }
}
