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
  direction?: string
  orientation?: string
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
  crop?: {
    left: number
    right: number
    top: number
    bottom: number
  }
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
  verticalMode?: string
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

export interface NormalizedTableBorder {
  color?: string
  width?: number
  type?: string
}

export interface NormalizedTableCell {
  text?: string
  rowSpan?: number
  colSpan?: number
  vMerge?: number
  hMerge?: number
  vAlign?: 'up' | 'mid' | 'down' | string
  fontFamily?: string
  fontSize?: number
  fontBold?: boolean
  fontItalic?: boolean
  fontUnderline?: boolean
  fontStrike?: boolean
  fontColor?: string
  fillColor?: string
  highlightColor?: string
  letterSpacing?: number
  language?: string
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none' | string
  padding?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
  borders?: Partial<Record<'top' | 'right' | 'bottom' | 'left', NormalizedTableBorder>>
}

export interface NormalizedTableMeta {
  rowHeights: number[]
  colWidths: number[]
  cells: NormalizedTableCell[][]
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
  table?: NormalizedTableMeta
  children?: NormalizedElement[]
  raw: unknown
}

export interface NormalizedMotionPath {
  xFrom: number
  yFrom: number
  xTo: number
  yTo: number
  rotateFrom: number
  rotateTo: number
}

export interface NormalizedAnimation {
  id: string
  trigger: 'withPrevious' | 'afterPrevious' | 'onClick'
  durationMs: number
  targetElementIds: string[]
  targetParagraphIndex?: number
  effect: 'appear' | 'fade'
  motionPath?: NormalizedMotionPath
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

export interface EvaluatedAnimationGeometry {
  progress: number
  translateX: number
  translateY: number
  rotate: number
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
  renderedHtml?: string
  media?: MediaResource
  mediaPlayback?: EvaluatedMediaFrame['playback']
  bounds: NormalizedElementBounds
  animationGeometry?: EvaluatedAnimationGeometry
  shape?: NormalizedShapeMeta
  table?: NormalizedTableMeta
  children?: EvaluatedElementFrame[]
}

export interface EvaluatedMediaFrame {
  elementId: string
  type: Extract<NormalizedElementType, 'image' | 'video' | 'audio' | 'math'>
  media: MediaResource
  playback?: {
    action: 'play' | 'pause'
    muted: boolean
    playbackRate: number
    seekMs: number
  }
}

export interface EvaluatedSlideFrame {
  slideId: string
  slideName: string
  background: SlideBackground
  elements: EvaluatedElementFrame[]
  media: EvaluatedMediaFrame[]
}

export interface PresentationFrame {
  width: number
  height: number
  currentSlideIndex: number
  isTransitioning: boolean
  transitionProgress: number
  transitionType?: string
  transitionDirection?: string
  transitionOrientation?: string
  current?: EvaluatedSlideFrame
  previous?: EvaluatedSlideFrame
  next?: EvaluatedSlideFrame
}
