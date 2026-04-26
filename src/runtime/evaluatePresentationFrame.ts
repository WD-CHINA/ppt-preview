import type {
  EvaluatedAnimationGeometry,
  EvaluatedElementFrame,
  EvaluatedMediaFrame,
  EvaluatedSlideFrame,
  NormalizedAnimation,
  NormalizedElement,
  NormalizedPresentation,
  NormalizedSlide,
  PresentationFrame,
  PresentationRuntimeState,
} from '../types/presentation'
import { evaluateAnimationGeometry, evaluateAnimationVisibility } from './timeline/timelineEngine'
import { buildParagraphVisibilityHtml } from './timeline/paragraphBuild'

export function evaluatePresentationFrame(
  model: NormalizedPresentation,
  state: PresentationRuntimeState,
): PresentationFrame {
  const isTransitioning = state.transitionToSlideIndex != null
  const currentSlideIndex = isTransitioning ? (state.transitionToSlideIndex ?? state.activeSlideIndex) : state.activeSlideIndex
  const transitionSlide = isTransitioning ? model.slides[state.transitionToSlideIndex ?? currentSlideIndex] : undefined

  return {
    width: model.width,
    height: model.height,
    currentSlideIndex,
    isTransitioning,
    transitionProgress: state.transitionProgress,
    transitionType: transitionSlide?.transition?.type,
    transitionDirection: transitionSlide?.transition?.direction,
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

  const mediaPlaybackByElementId = state ? createMediaPlaybackByElementId(slide, state) : new Map<string, NonNullable<EvaluatedMediaFrame['playback']>>()

  return {
    slideId: slide.id,
    slideName: slide.name,
    background: slide.background,
    elements: slide.elements.map((element) => evaluateElementFrame(slide, element, state, mediaPlaybackByElementId)),
    media: collectEvaluatedMediaFrames(slide.elements, state),
  }
}

function createMediaPlaybackByElementId(
  slide: NormalizedSlide,
  state: PresentationRuntimeState,
) {
  const playbackById = new Map<string, NonNullable<EvaluatedMediaFrame['playback']>>()

  for (const frame of collectEvaluatedMediaFrames(slide.elements, state)) {
    if (frame.playback) {
      playbackById.set(frame.elementId, frame.playback)
    }
  }

  return playbackById
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
  mediaPlaybackByElementId: Map<string, NonNullable<EvaluatedMediaFrame['playback']>> = new Map(),
): EvaluatedElementFrame {
  const animationState = state ? evaluateElementAnimationState(slide, element.id, state) : { visible: true, opacity: 1 }
  const animationGeometry = state ? evaluateElementAnimationGeometry(slide, element.id, state) : undefined
  const evaluatedBounds = {
    ...element.bounds,
    x: element.bounds.x + (animationGeometry?.translateX ?? 0),
    y: element.bounds.y + (animationGeometry?.translateY ?? 0),
    rotate: element.bounds.rotate + (animationGeometry?.rotate ?? 0),
  }
  const renderedHtml = state ? evaluateElementRenderedHtml(slide, element, state) : undefined
  const mediaPlayback = mediaPlaybackByElementId.get(element.id)

  return {
    id: element.id,
    name: element.name,
    type: element.type,
    order: element.order,
    visible: animationState.visible,
    opacity: animationState.opacity,
    transform: `translate(${evaluatedBounds.x}px, ${evaluatedBounds.y}px) rotate(${evaluatedBounds.rotate}deg)`,
    style: element.style,
    text: element.text,
    html: element.html,
    renderedHtml,
    mediaPlayback,
    media: element.media,
    bounds: evaluatedBounds,
    animationGeometry,
    shape: element.shape,
    table: element.table,
    children: element.children?.map((child) => evaluateElementFrame(slide, child, state)),
  }
}

function evaluateElementAnimationState(
  slide: NormalizedSlide,
  elementId: string,
  state: PresentationRuntimeState,
) {
  const animations = getTargetAnimations(slide, elementId)

  if (animations.length === 0) {
    return { visible: true, opacity: 1 }
  }

  return animations.reduce(
    (current, animation) => {
      if (animation.effect !== 'appear' && animation.effect !== 'fade') {
        return current
      }

      return evaluateAnimationVisibility(animation, slide.animations, state)
    },
    { visible: true, opacity: 1 },
  )
}

function evaluateElementAnimationGeometry(
  slide: NormalizedSlide,
  elementId: string,
  state: PresentationRuntimeState,
): EvaluatedAnimationGeometry | undefined {
  const animations = getTargetAnimations(slide, elementId)
  const geometryStates = animations
    .map((animation) => evaluateAnimationGeometry(animation, slide.animations, state))
    .filter((geometry): geometry is EvaluatedAnimationGeometry => geometry != null)

  if (geometryStates.length === 0) {
    return undefined
  }

  return geometryStates.reduce(
    (combined, geometry) => ({
      progress: Math.max(combined.progress, geometry.progress),
      translateX: combined.translateX + geometry.translateX,
      translateY: combined.translateY + geometry.translateY,
      rotate: combined.rotate + geometry.rotate,
    }),
    { progress: 0, translateX: 0, translateY: 0, rotate: 0 },
  )
}

function evaluateElementRenderedHtml(
  slide: NormalizedSlide,
  element: NormalizedElement,
  state: PresentationRuntimeState,
): string | undefined {
  const sourceHtml = element.html ?? (typeof element.text === 'string' ? element.text : undefined)

  if (!sourceHtml) {
    return undefined
  }

  const buildCount = getVisibleParagraphBuildCount(slide, element.id, state.currentTriggerIndex)

  if (buildCount == null) {
    return undefined
  }

  return buildCount > 0 ? buildParagraphVisibilityHtml(sourceHtml, buildCount) : ''
}

function getVisibleParagraphBuildCount(
  slide: NormalizedSlide,
  elementId: string,
  currentTriggerIndex: number,
) {
  const paragraphBuilds = slide.animations
    .map((animation, index) => ({ animation, index }))
    .filter(({ animation }) => animation.targetElementIds.includes(elementId) && typeof animation.targetParagraphIndex === 'number')

  if (paragraphBuilds.length === 0) {
    return null
  }

  let visibleParagraphCount = 0

  for (const { animation, index } of paragraphBuilds) {
    if (animation.trigger !== 'onClick' || index >= currentTriggerIndex) {
      continue
    }

    visibleParagraphCount = Math.max(visibleParagraphCount, (animation.targetParagraphIndex ?? 0) + 1)
  }

  return visibleParagraphCount
}

function getTargetAnimations(slide: NormalizedSlide, elementId: string): NormalizedAnimation[] {
  return slide.animations.filter((candidate) => candidate.targetElementIds.includes(elementId))
}
