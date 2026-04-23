import type { RawPptxDocument, RawPptxElement, RawPptxSlide } from './types'
import type {
  MediaResource,
  NormalizedElement,
  NormalizedElementType,
  NormalizedPresentation,
  SlideBackground,
  SlideTransitionMeta,
} from '../../types/presentation'

const DEFAULT_WIDTH = 1280
const DEFAULT_HEIGHT = 720

export function normalizePresentation(raw: RawPptxDocument): NormalizedPresentation {
  const slides = Array.isArray(raw.slides) ? raw.slides : []

  return {
    width: normalizeNumber(raw.size?.width, DEFAULT_WIDTH),
    height: normalizeNumber(raw.size?.height, DEFAULT_HEIGHT),
    theme: {
      colors: raw.themeColors ?? {},
    },
    usedFonts: Array.isArray(raw.usedFonts) ? raw.usedFonts : [],
    slides: slides.map((slide, index) => normalizeSlide(slide, index)),
  }
}

function normalizeSlide(rawSlide: RawPptxSlide, slideIndex: number) {
  const elements = [
    ...(Array.isArray(rawSlide.layoutElements) ? rawSlide.layoutElements : []),
    ...(Array.isArray(rawSlide.elements) ? rawSlide.elements : []),
  ]

  return {
    id: String(rawSlide.id ?? `slide-${slideIndex + 1}`),
    name: rawSlide.name ?? `Slide ${slideIndex + 1}`,
    note: typeof rawSlide.note === 'string' ? rawSlide.note : undefined,
    background: normalizeBackground(rawSlide),
    transition: normalizeTransition(rawSlide.transition),
    autoplay: {
      advanceOnClick: rawSlide.autoplay?.advanceOnClick ?? true,
      advanceAfterMs: rawSlide.autoplay?.advanceAfterMs,
    },
    elements: elements.map((element, index) => normalizeElement(element, slideIndex, index)),
    animations: [],
  }
}

function normalizeBackground(rawSlide: RawPptxSlide): SlideBackground {
  return {
    color: rawSlide.fill?.color ?? '#ffffff',
  }
}

function normalizeTransition(rawTransition: RawPptxSlide['transition']): SlideTransitionMeta | undefined {
  if (!rawTransition) {
    return undefined
  }

  return {
    type: rawTransition.type ?? 'fade',
    durationMs: normalizeNumber(rawTransition.durationMs ?? rawTransition.duration, 400),
  }
}

function normalizeElement(
  rawElement: RawPptxElement,
  slideIndex: number,
  elementIndex: number,
): NormalizedElement {
  const type = normalizeElementType(rawElement.type ?? rawElement.kind)
  const media = normalizeMedia(type, rawElement)
  const text = normalizeText(rawElement)

  return {
    id: String(rawElement.id ?? `slide-${slideIndex + 1}-element-${elementIndex + 1}`),
    type,
    name: rawElement.name ?? `${type}-${elementIndex + 1}`,
    bounds: {
      x: normalizeNumber(rawElement.x ?? rawElement.left, 0),
      y: normalizeNumber(rawElement.y ?? rawElement.top, 0),
      width: normalizeNumber(rawElement.width ?? rawElement.w, 160),
      height: normalizeNumber(rawElement.height ?? rawElement.h, 90),
      rotate: normalizeNumber(rawElement.rotate ?? rawElement.rotation, 0),
    },
    text,
    html: typeof rawElement.html === 'string' ? rawElement.html : undefined,
    style: normalizeStyle(type, rawElement),
    media,
    raw: rawElement,
  }
}

function normalizeElementType(input?: string): NormalizedElementType {
  switch (input) {
    case 'text':
    case 'image':
    case 'shape':
    case 'table':
    case 'chart':
    case 'video':
    case 'audio':
    case 'math':
    case 'diagram':
    case 'group':
      return input
    default:
      return 'unknown'
  }
}

function normalizeStyle(type: NormalizedElementType, rawElement: RawPptxElement): Record<string, string> {
  const base: Record<string, string> = {
    position: 'absolute',
    overflow: 'hidden',
  }

  if (type === 'shape') {
    base.background = rawElement.fill?.color ?? '#e5e7eb'
    base.borderRadius = '12px'
  }

  if (type === 'text') {
    base.whiteSpace = 'pre-wrap'
    base.color = '#111827'
    base.padding = '4px'
  }

  return {
    ...base,
    ...(rawElement.style ?? {}),
  }
}

function normalizeMedia(type: NormalizedElementType, rawElement: RawPptxElement): MediaResource | undefined {
  if (!['image', 'video', 'audio'].includes(type)) {
    return undefined
  }

  return {
    src: typeof rawElement.src === 'string' ? rawElement.src : undefined,
    blob: rawElement.blob instanceof Blob ? rawElement.blob : undefined,
    mimeType: typeof rawElement.mimeType === 'string' ? rawElement.mimeType : undefined,
    preload: type === 'audio' ? 'metadata' : 'auto',
  }
}

function normalizeText(rawElement: RawPptxElement): string | undefined {
  if (typeof rawElement.text === 'string') {
    return rawElement.text
  }

  if (typeof rawElement.content === 'string') {
    return rawElement.content
  }

  return undefined
}

function normalizeNumber(input: number | undefined, fallback: number): number {
  return typeof input === 'number' && Number.isFinite(input) ? input : fallback
}
