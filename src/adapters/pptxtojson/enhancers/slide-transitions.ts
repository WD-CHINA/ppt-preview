import type { RawPptxSlide } from '../types'

export interface SlideTransitionMetadata {
  type?: string
  direction?: string
  durationMs?: number
  advanceAfterMs?: number
}

export function extractSlideTransitionMetadata(slideXml: string): SlideTransitionMetadata | undefined {
  const transitionMatch = slideXml.match(/<p:transition\b([^>]*)>([\s\S]*?)<\/p:transition>|<p:transition\b([^>]*)\/>/)

  if (!transitionMatch) {
    return undefined
  }

  const attributeSource = transitionMatch[1] ?? transitionMatch[3] ?? ''
  const innerXml = transitionMatch[2] ?? ''
  const typeMatch = innerXml.match(/<p:([a-zA-Z0-9]+)\b/)
  const type = typeMatch?.[1]
  const direction = extractChildAttribute(innerXml, type, 'dir')
  const speed = extractAttribute(attributeSource, 'spd')
  const customDurationMs = parseOptionalNumber(extractAttribute(attributeSource, 'p14:dur'))
  const advanceAfterMs = parseOptionalNumber(extractAttribute(attributeSource, 'advTm'))

  return {
    type,
    direction,
    durationMs: customDurationMs ?? mapTransitionSpeedToDuration(speed),
    advanceAfterMs,
  }
}

export function applySlideTransitionMetadata(slide: RawPptxSlide, metadata: SlideTransitionMetadata | undefined) {
  if (!metadata) {
    return
  }

  slide.transition = {
    ...(slide.transition ?? {}),
    ...(metadata.type ? { type: metadata.type } : {}),
    ...(metadata.direction ? { direction: metadata.direction } : {}),
    ...(metadata.durationMs != null ? { durationMs: metadata.durationMs } : {}),
    ...(metadata.advanceAfterMs != null ? { advanceAfterMs: metadata.advanceAfterMs } : {}),
  }

  if (metadata.advanceAfterMs != null) {
    slide.autoplay = {
      ...(slide.autoplay ?? {}),
      advanceOnClick: slide.autoplay?.advanceOnClick ?? true,
      advanceAfterMs: slide.autoplay?.advanceAfterMs ?? metadata.advanceAfterMs,
    }
  }
}

function mapTransitionSpeedToDuration(speed: string | null) {
  switch (speed) {
    case 'slow':
      return 1200
    case 'fast':
      return 500
    case 'med':
    default:
      return 800
  }
}

function extractAttribute(source: string, name: string) {
  const match = source.match(new RegExp(`${name}="([^"]+)"`))
  return match?.[1] ?? null
}

function extractChildAttribute(source: string, childTag: string | undefined, attributeName: string) {
  if (!childTag) {
    return undefined
  }

  const match = source.match(new RegExp(`<p:${childTag}\\b[^>]*${attributeName}="([^"]+)"`))
  return match?.[1] ?? undefined
}

function parseOptionalNumber(value: string | null) {
  const parsed = value == null ? Number.NaN : Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : undefined
}
