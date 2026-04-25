import type {
  MediaResource,
  NormalizedElement,
  NormalizedElementType,
  NormalizedPresentation,
  PresentationRuntimeState,
} from '../../types/presentation'

export type MediaEngineEntryStatus = 'idle' | 'preloaded' | 'active' | 'released' | 'error'
export type RuntimeMediaType = Extract<NormalizedElementType, 'image' | 'video' | 'audio' | 'math'>
export type MediaPlaybackAction = 'play' | 'pause'

export interface MediaRegistryEntry {
  elementId: string
  slideId: string
  slideIndex: number
  type: RuntimeMediaType
  media: MediaResource
  order: number
  sequence: number
  status: MediaEngineEntryStatus
}

export interface MediaEngineState {
  entries: Record<string, MediaRegistryEntry>
}

export interface MediaPlaybackPlanEntry {
  elementId: string
  action: MediaPlaybackAction
  muted: boolean
  playbackRate: number
  seekMs: number
}

const MEDIA_CACHE_RADIUS = 1
const PLAYABLE_MEDIA_TYPES = new Set<RuntimeMediaType>(['video', 'audio'])

export function createMediaEngineState(model: NormalizedPresentation): MediaEngineState {
  return {
    entries: Object.fromEntries(collectMediaRegistry(model).map((entry) => [entry.elementId, entry])),
  }
}

export function collectMediaRegistry(model: NormalizedPresentation): MediaRegistryEntry[] {
  let sequence = 0

  return model.slides.flatMap((slide, slideIndex) =>
    collectSlideMediaElements(slide.elements).map((element) => ({
      elementId: element.id,
      slideId: slide.id,
      slideIndex,
      type: element.type as RuntimeMediaType,
      media: element.media as MediaResource,
      order: element.order,
      sequence: sequence++,
      status: 'idle' as const,
    })),
  )
}

export function syncMediaEngine(
  engine: MediaEngineState,
  state: PresentationRuntimeState,
  model: NormalizedPresentation,
) {
  const activeSlideIndex = getMediaActiveSlideIndex(state)
  const retainedSlideIndexes = getRetainedSlideIndexes(model, activeSlideIndex)

  for (const entry of Object.values(engine.entries)) {
    if (entry.slideIndex === activeSlideIndex) {
      entry.status = 'active'
      continue
    }

    if (retainedSlideIndexes.has(entry.slideIndex)) {
      entry.status = 'preloaded'
      continue
    }

    entry.status = 'released'
  }
}

export function getMediaPlaybackPlan(
  engine: MediaEngineState,
  state: PresentationRuntimeState,
): MediaPlaybackPlanEntry[] {
  const shouldPlay = state.sessionStatus === 'playing' || state.sessionStatus === 'transitioning'
  const action: MediaPlaybackAction = shouldPlay ? 'play' : 'pause'

  return Object.values(engine.entries)
    .filter((entry) => entry.status === 'active' && PLAYABLE_MEDIA_TYPES.has(entry.type))
    .sort((a, b) => a.slideIndex - b.slideIndex || a.order - b.order || a.sequence - b.sequence)
    .map((entry) => ({
      elementId: entry.elementId,
      action,
      muted: state.isMuted,
      playbackRate: state.playbackRate,
      seekMs: Math.max(0, state.timelinePositionMs),
    }))
}

export function getMediaActiveSlideIndex(state: PresentationRuntimeState) {
  return state.transitionToSlideIndex ?? state.activeSlideIndex
}

function getRetainedSlideIndexes(model: NormalizedPresentation, activeSlideIndex: number) {
  const retained = new Set<number>()

  for (let index = activeSlideIndex - MEDIA_CACHE_RADIUS; index <= activeSlideIndex + MEDIA_CACHE_RADIUS; index += 1) {
    if (index >= 0 && index < model.slides.length) {
      retained.add(index)
    }
  }

  return retained
}

function collectSlideMediaElements(elements: NormalizedElement[]): NormalizedElement[] {
  return elements.flatMap((element) => {
    const descendants = element.children ? collectSlideMediaElements(element.children) : []

    if (isMediaElement(element)) {
      return [element, ...descendants]
    }

    return descendants
  })
}

function isMediaElement(element: NormalizedElement) {
  return Boolean(element.media) && isRuntimeMediaType(element.type)
}

function isRuntimeMediaType(type: NormalizedElementType): type is RuntimeMediaType {
  return type === 'image' || type === 'video' || type === 'audio' || type === 'math'
}
