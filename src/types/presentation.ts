export type SessionStatus = 'idle' | 'ready' | 'playing' | 'paused' | 'transitioning' | 'ended' | 'error'

export type NormalizedElementType =
  | 'text'
  | 'image'
  | 'shape'
  | 'table'
  | 'chart'
  | 'video'
  | 'audio'
  | 'math'
  | 'diagram'
  | 'group'
  | 'unknown'

export interface NormalizedTheme {
  colors: Record<string, string>
}

export interface SlideBackground {
  color?: string
  imageUrl?: string
  css?: string
}

export interface SlideTransitionMeta {
  type: string
  durationMs: number
}

export interface SlideAutoplay {
  advanceOnClick: boolean
  advanceAfterMs?: number
}

export type MediaCleanupPolicy = 'keep' | 'revoke-object-url'

export interface MediaResource {
  src?: string
  objectUrl?: string
  blob?: Blob | string
  mimeType?: string
  poster?: string
  preload?: 'auto' | 'metadata' | 'none'
  cleanup?: MediaCleanupPolicy
}

export interface NormalizedElementBounds {
  x: number
  y: number
  width: number
  height: number
  rotate: number
}

export interface NormalizedShapeMeta {
  path?: string
  type?: string
  viewBoxWidth?: number
  viewBoxHeight?: number
  lineHeadEnd?: LineEndMarker
  lineTailEnd?: LineEndMarker
  vAlign?: 'up' | 'mid' | 'down' | string
  isVertical?: boolean
  isFlipH?: boolean
  isFlipV?: boolean
  textInset?: {
    left: number
    right: number
    top: number
    bottom: number
  }
}

export interface LineEndMarker {
  type?: string
  width?: string
  length?: string
}

export interface NormalizedElement {
  id: string
  type: NormalizedElementType
  name: string
  order: number
  bounds: NormalizedElementBounds
  text?: string
  html?: string
  style: Record<string, string>
  media?: MediaResource
  shape?: NormalizedShapeMeta
  children?: NormalizedElement[]
  raw: unknown
}

export interface NormalizedAnimation {
  id: string
  trigger: 'withPrevious' | 'afterPrevious' | 'onClick'
  durationMs: number
  targetElementIds: string[]
  effect: 'appear' | 'fade'
}

export interface NormalizedSlide {
  id: string
  name: string
  note?: string
  background: SlideBackground
  transition?: SlideTransitionMeta
  autoplay: SlideAutoplay
  elements: NormalizedElement[]
  animations: NormalizedAnimation[]
}

export interface NormalizedPresentation {
  width: number
  height: number
  theme: NormalizedTheme
  usedFonts: string[]
  slides: NormalizedSlide[]
}

export interface PresentationRuntimeState {
  sessionStatus: SessionStatus
  activeSlideIndex: number
  timelinePositionMs: number
  slideElapsedMs: number
  currentTriggerIndex: number
  waitingTrigger: boolean
  transitionProgress: number
  transitionFromSlideIndex: number | null
  transitionToSlideIndex: number | null
  isFullscreen: boolean
  isMuted: boolean
  presenterMode: boolean
  loopEnabled: boolean
  playbackRate: number
}

export interface EvaluatedElementFrame {
  id: string
  name: string
  type: NormalizedElementType
  order: number
  visible: boolean
  opacity: number
  transform: string
  style: Record<string, string>
  text?: string
  html?: string
  media?: MediaResource
  bounds: NormalizedElementBounds
  shape?: NormalizedShapeMeta
  children?: EvaluatedElementFrame[]
}

export interface EvaluatedSlideFrame {
  slideId: string
  slideName: string
  background: SlideBackground
  elements: EvaluatedElementFrame[]
}

export interface PresentationFrame {
  width: number
  height: number
  currentSlideIndex: number
  isTransitioning: boolean
  transitionProgress: number
  current?: EvaluatedSlideFrame
  previous?: EvaluatedSlideFrame
  next?: EvaluatedSlideFrame
}
