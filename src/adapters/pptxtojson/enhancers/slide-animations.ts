import type { RawPptxAnimation, RawPptxSlide } from '../types'

const SUPPORTED_NODE_TYPES = new Map<string, RawPptxAnimation['trigger']>([
  ['clickEffect', 'onClick'],
  ['withEffect', 'withPrevious'],
  ['afterEffect', 'afterPrevious'],
])

export function extractSlideAnimationMetadata(slideXml: string): RawPptxAnimation[] {
  const timingXml = extractTagBlock(slideXml, 'p:timing')
  const timingAnimations = timingXml ? extractTimingAnimationMetadata(timingXml) : []
  const buildListAnimations = extractBuildListAnimationMetadata(slideXml)

  return dedupeRawAnimations(resolveCharacterRangeParagraphBuilds([...timingAnimations, ...buildListAnimations]))
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

function extractTimingAnimationMetadata(timingXml: string) {
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
      const characterRange = paragraphIndex == null ? extractCharacterRange(innerXml) : undefined

      return [
        {
          ...(extractAttribute(openTag, 'id') ? { id: extractAttribute(openTag, 'id') } : {}),
          trigger,
          durationMs: extractBehaviorDurationMs(innerXml),
          effect: inferAnimationEffect(innerXml),
          targetElementId,
          ...(paragraphIndex != null ? { targetParagraphIndex: paragraphIndex } : {}),
          ...(characterRange ? { targetCharacterRange: characterRange } : {}),
        } satisfies RawPptxAnimation,
      ]
    })
  })
}

function extractBuildListAnimationMetadata(slideXml: string) {
  const buildListXml = extractTagBlock(slideXml, 'p:bldLst')

  if (!buildListXml) {
    return []
  }

  const buildRegex = /<p:bldP\b([^>]*)\/>|<p:bldP\b([^>]*)>([\s\S]*?)<\/p:bldP>/g

  return Array.from(buildListXml.matchAll(buildRegex)).flatMap((match, index) => {
    const openTag = `<p:bldP${match[1] ?? match[2] ?? ''}>`
    const innerXml = match[3] ?? ''
    const targetElementId =
      extractAttribute(openTag, 'spid') ?? extractShapeTargetId(innerXml) ?? extractAttribute(openTag, 'spTgt')

    if (!targetElementId) {
      return []
    }

    const paragraphIndex = extractParagraphIndex(`${openTag}${innerXml}`)
    const characterRange = paragraphIndex == null ? extractCharacterRange(`${openTag}${innerXml}`) : undefined

    return [
      {
        id: extractAttribute(openTag, 'id') ?? `build-${index + 1}`,
        trigger: 'onClick',
        durationMs: extractBehaviorDurationMs(innerXml),
        effect: inferAnimationEffect(innerXml),
        targetElementId,
        ...(paragraphIndex != null ? { targetParagraphIndex: paragraphIndex } : {}),
        ...(characterRange ? { targetCharacterRange: characterRange } : {}),
      } satisfies RawPptxAnimation,
    ]
  })
}

function dedupeRawAnimations(animations: RawPptxAnimation[]) {
  const seen = new Set<string>()
  const result: RawPptxAnimation[] = []

  for (const animation of animations) {
    const key = JSON.stringify({
      id: animation.id ?? '',
      trigger: animation.trigger ?? '',
      durationMs: animation.durationMs ?? animation.duration ?? '',
      effect: animation.effect ?? '',
      targetElementId: animation.targetElementId ?? '',
      targetElementIds: animation.targetElementIds ?? [],
      targetParagraphIndex: animation.targetParagraphIndex ?? '',
      targetCharacterRange: animation.targetCharacterRange ?? null,
      motionPath: animation.motionPath ?? null,
    })

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    result.push(animation)
  }

  return result
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

function extractCharacterRange(source: string) {
  const match = source.match(/<p:charRg\b[^>]*st="(\d+)"[^>]*end="(\d+)"/)

  if (!match) {
    return undefined
  }

  const startText = match[1]
  const endText = match[2]

  if (!startText || !endText) {
    return undefined
  }

  return {
    start: Number.parseInt(startText, 10),
    end: Number.parseInt(endText, 10),
  }
}

function resolveCharacterRangeParagraphBuilds(animations: RawPptxAnimation[]) {
  const nextParagraphIndexByTarget = new Map<string, number>()

  return animations.map((animation, index) => {
    if (
      animation.trigger !== 'onClick'
      || animation.targetParagraphIndex != null
      || !animation.targetCharacterRange
      || animation.targetElementId == null
    ) {
      return animation
    }

    const targetElementId = String(animation.targetElementId)
    const hasEarlierWholeReveal = animations.some((candidate, candidateIndex) => (
      candidateIndex < index
      && candidate.trigger === 'onClick'
      && String(candidate.targetElementId ?? '') === targetElementId
      && candidate.targetParagraphIndex == null
      && candidate.targetCharacterRange == null
    ))
    const startOffset = hasEarlierWholeReveal ? 1 : 0
    const nextParagraphIndex = nextParagraphIndexByTarget.get(targetElementId) ?? startOffset

    nextParagraphIndexByTarget.set(targetElementId, nextParagraphIndex + 1)

    return {
      ...animation,
      targetParagraphIndex: nextParagraphIndex,
    }
  })
}
