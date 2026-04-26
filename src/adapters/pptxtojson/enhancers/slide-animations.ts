import type { RawPptxAnimation, RawPptxSlide } from '../types'

const SUPPORTED_NODE_TYPES = new Map<string, RawPptxAnimation['trigger']>([
  ['clickEffect', 'onClick'],
  ['withEffect', 'withPrevious'],
  ['afterEffect', 'afterPrevious'],
])

export function extractSlideAnimationMetadata(slideXml: string): RawPptxAnimation[] {
  const timingXml = extractTagBlock(slideXml, 'p:timing')

  if (!timingXml) {
    return []
  }

  return Array.from(SUPPORTED_NODE_TYPES.entries()).flatMap(([nodeType, trigger]) => {
    const effectRegex = new RegExp(`<p:cTn\\b([^>]*)nodeType="${nodeType}"([^>]*)>([\\s\\S]*?)<\\/p:cTn>`, 'g')

    return Array.from(timingXml.matchAll(effectRegex)).flatMap((match) => {
      const openTag = `<p:cTn${match[1] ?? ''}${match[2] ?? ''}>`
      const innerXml = match[3] ?? ''
      const targetElementId = extractShapeTargetId(innerXml)

      if (!targetElementId) {
        return []
      }

      const paragraphIndex = extractParagraphIndex(innerXml)

      return [
        {
          ...(extractAttribute(openTag, 'id') ? { id: extractAttribute(openTag, 'id') } : {}),
          trigger,
          durationMs: extractBehaviorDurationMs(innerXml),
          effect: inferAnimationEffect(innerXml),
          targetElementId,
          ...(paragraphIndex != null ? { targetParagraphIndex: paragraphIndex } : {}),
        } satisfies RawPptxAnimation,
      ]
    })
  })
}

export function applySlideAnimationMetadata(slide: RawPptxSlide, animations: RawPptxAnimation[]) {
  if (!animations.length) {
    return
  }

  slide.animations = [
    ...(Array.isArray(slide.animations) ? slide.animations : []),
    ...animations,
  ]
}

function extractTagBlock(source: string, tagName: string) {
  const startTag = `<${tagName}`
  const startIndex = source.indexOf(startTag)

  if (startIndex < 0) {
    return undefined
  }

  const endTag = `</${tagName}>`
  const endIndex = source.indexOf(endTag, startIndex)

  if (endIndex < 0) {
    return undefined
  }

  return source.slice(startIndex, endIndex + endTag.length)
}

function extractAttribute(source: string, name: string) {
  const match = source.match(new RegExp(`${name}="([^"]+)"`))
  return match?.[1]
}

function extractShapeTargetId(source: string) {
  const match = source.match(/<p:spTgt\b[^>]*spid="([^"]+)"/)
  return match?.[1]
}

function extractBehaviorDurationMs(source: string) {
  const behaviorNode = source.match(/<p:cBhvr>[\s\S]*?<p:cTn\b[^>]*dur="([^"]+)"/)
  const parsed = behaviorNode?.[1] ? Number.parseInt(behaviorNode[1], 10) : Number.NaN
  return Number.isFinite(parsed) ? parsed : 350
}

function inferAnimationEffect(source: string): RawPptxAnimation['effect'] {
  if (source.includes('<p:set')) {
    return 'appear'
  }

  return 'fade'
}

function extractParagraphIndex(source: string) {
  const match = source.match(/<p:pRg\b[^>]*st="(\d+)"/)
  return match?.[1] != null ? Number.parseInt(match[1], 10) : undefined
}
