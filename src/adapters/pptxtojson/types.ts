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
  text?: string
  html?: string
  content?: string
  src?: string
  blob?: Blob
  mimeType?: string
  fill?: { color?: string }
  style?: Record<string, string>
  [key: string]: unknown
}

export interface RawPptxSlide {
  id?: string | number
  name?: string
  note?: string
  fill?: { color?: string }
  transition?: { type?: string; durationMs?: number; duration?: number }
  elements?: RawPptxElement[]
  layoutElements?: RawPptxElement[]
  autoplay?: { advanceOnClick?: boolean; advanceAfterMs?: number }
  [key: string]: unknown
}

export interface RawPptxDocument {
  size?: RawPptxSize
  themeColors?: Record<string, string>
  usedFonts?: string[]
  slides?: RawPptxSlide[]
  [key: string]: unknown
}

export interface PptxToJsonModule {
  parse: (input: ArrayBuffer, options?: PptxToJsonParseOptions) => Promise<RawPptxDocument>
}
