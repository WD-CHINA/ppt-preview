export interface PptxToJsonParseOptions {
  imageMode?: 'blob' | 'base64' | 'both'
  videoMode?: 'blob' | 'base64' | 'both'
  audioMode?: 'blob' | 'base64' | 'both'
}

export interface RawPptxSize {
  width?: number
  height?: number
}

export interface RawPptxElement {
  type?: string
  kind?: string
  name?: string
  id?: string | number
  x?: number
  y?: number
  left?: number
  top?: number
  width?: number
  height?: number
  w?: number
  h?: number
  rotate?: number
  rotation?: number
  order?: number | string
  text?: string
  html?: string
  content?: string
  src?: string
  blob?: Blob | string
  base64?: string
  ref?: string
  mimeType?: string
  fill?:
    | { color?: string }
    | {
        type?: 'color' | 'gradient' | 'image' | 'pattern'
        value?: unknown
      }
  style?: Record<string, string>
  poster?: string
  animations?: RawPptxAnimation[]
  borderColor?: string
  borderWidth?: number
  borderType?: string
  borderStrokeDasharray?: string
  shadow?: {
    color?: string
    blur?: number
    offsetX?: number
    offsetY?: number
    opacity?: number
  }
  elements?: RawPptxElement[]
  contentHtml?: string
  path?: string
  shapType?: string
  vAlign?: 'up' | 'mid' | 'down' | string
  isVertical?: boolean
  isFlipH?: boolean
  isFlipV?: boolean
  textBodyInset?: RawTextBodyInset
  lineHeadEnd?: RawLineEnd
  lineTailEnd?: RawLineEnd
  rect?: RawMediaRect
  [key: string]: unknown
}

export interface RawTextBodyInset {
  left?: number
  right?: number
  top?: number
  bottom?: number
}

export interface RawLineEnd {
  type?: string
  width?: string
  length?: string
}

export interface RawMediaRect {
  l?: number
  r?: number
  t?: number
  b?: number
}

export interface RawPptxAnimation {
  id?: string | number
  trigger?: 'withPrevious' | 'afterPrevious' | 'onClick' | string
  durationMs?: number
  duration?: number
  effect?: 'appear' | 'fade' | string
  targetElementIds?: Array<string | number>
  targetElementId?: string | number
}

export interface RawPptxSlide {
  id?: string | number
  name?: string
  note?: string
  fill?:
    | { color?: string }
    | {
        type?: 'color' | 'gradient' | 'image' | 'pattern'
        value?: unknown
      }
  transition?: { type?: string; durationMs?: number; duration?: number }
  elements?: RawPptxElement[]
  layoutElements?: RawPptxElement[]
  autoplay?: { advanceOnClick?: boolean; advanceAfterMs?: number }
  animations?: RawPptxAnimation[]
  [key: string]: unknown
}

export interface RawPptxDocument {
  size?: RawPptxSize
  themeColors?: Record<string, string> | string[]
  usedFonts?: string[]
  slides?: RawPptxSlide[]
  [key: string]: unknown
}

export interface PptxToJsonModule {
  parse: (input: ArrayBuffer, options?: PptxToJsonParseOptions) => Promise<RawPptxDocument>
}
