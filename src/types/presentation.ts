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
}

export interface SlideTransitionMeta {
  type: string
  durationMs: number
}

export interface MediaResource {
  src?: string
  blob?: Blob
  mimeType?: string
  poster?: string
  preload?: 'auto' | 'metadata' | 'none'
}

export interface NormalizedElementBounds {
  x: number
  y: number
  width: number
  height: number
  rotate: number
}

export interface NormalizedElement {
  id: string
  type: NormalizedElementType
  name: string
  bounds: NormalizedElementBounds
  text?: string
  html?: string
  style: Record<string, string>
  media?: MediaResource
  raw: unknown
}

export interface NormalizedAnimation {
  id: string
  trigger: 'withPrevious' | 'afterPrevious' | 'onClick'
  durationMs: number
  targetElementIds: string[]
}

export interface NormalizedSlide {
  id: string
  name: string
  note?: string
  background: SlideBackground
  transition?: SlideTransitionMeta
  autoplay: {
    advanceOnClick: boolean
    advanceAfterMs?: number
  }
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
  currentTriggerIndex: number
  waitingTrigger: boolean
  transitionProgress: number
  isFullscreen: boolean
  isMuted: boolean
  presenterMode: boolean
  loopEnabled: boolean
  playbackRate: number
}

export interface EvaluatedElementFrame {
  id: string
  type: NormalizedElementType
  visible: boolean
  opacity: number
  transform: string
  style: Record<string, string>
  text?: string
  html?: string
  media?: MediaResource
  bounds: NormalizedElementBounds
}

export interface EvaluatedSlideFrame {
  slideId: string
  background: SlideBackground
  elements: EvaluatedElementFrame[]
}

export interface PresentationFrame {
  width: number
  height: number
  currentSlideIndex: number
  current?: EvaluatedSlideFrame
  previous?: EvaluatedSlideFrame
  next?: EvaluatedSlideFrame
}
