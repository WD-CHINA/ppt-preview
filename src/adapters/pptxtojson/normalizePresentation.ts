import type { RawPptxAnimation, RawPptxDocument, RawPptxElement, RawPptxSlide } from './types'
import type {
  MediaResource,
  NormalizedAnimation,
  NormalizedElement,
  NormalizedElementType,
  NormalizedPresentation,
  SlideBackground,
  SlideTransitionMeta,
} from '../../types/presentation'

const DEFAULT_WIDTH = 1280
const DEFAULT_HEIGHT = 720
const CSS_PX_PER_POINT = 96 / 72

export function normalizePresentation(raw: RawPptxDocument): NormalizedPresentation {
  const slides = Array.isArray(raw.slides) ? raw.slides : []
  const themeColors = normalizeThemeColors(raw.themeColors)

  return {
    width: normalizeOptionalPointLength(raw.size?.width, DEFAULT_WIDTH),
    height: normalizeOptionalPointLength(raw.size?.height, DEFAULT_HEIGHT),
    theme: {
      colors: themeColors,
    },
    usedFonts: Array.isArray(raw.usedFonts) ? raw.usedFonts : [],
    slides: slides.map((slide, index) => normalizeSlide(slide, index, themeColors)),
  }
}

function normalizeSlide(
  rawSlide: RawPptxSlide,
  slideIndex: number,
  themeColors: Record<string, string>,
) {
  const elements = [
    ...(Array.isArray(rawSlide.layoutElements) ? rawSlide.layoutElements : []),
    ...(Array.isArray(rawSlide.elements) ? rawSlide.elements : []),
  ]
  const normalizedElements = harmonizeRepeatedTextColors(
    elements.map((element, index) => normalizeElement(element, slideIndex, index)),
  )
  applyPlaceholderThemeColors(normalizedElements, themeColors)

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
    elements: normalizedElements
      .filter((element) => !isImageAuxiliaryRect(element, normalizedElements))
      .sort((a, b) => a.order - b.order),
    animations: normalizeAnimations(rawSlide, elements, slideIndex),
  }
}

function applyPlaceholderThemeColors(elements: NormalizedElement[], themeColors: Record<string, string>) {
  const lightTextColor = normalizeColorValue(themeColors['theme-4'] ?? themeColors['theme-2'])

  if (!lightTextColor) {
    return
  }

  for (const element of elements) {
    if (!isTextLikeElement(element)) {
      continue
    }

    const rawElement = element.raw as RawPptxElement | undefined
    const placeholderType = rawElement?.placeholderType
    const currentColor = extractResolvedTextColor(element)

    if (!placeholderType || !currentColor || !isDefaultTextColor(currentColor)) {
      continue
    }

    if (placeholderType === 'subTitle' || placeholderType === 'body') {
      applyResolvedTextColor(element, lightTextColor)
    }
  }
}

function harmonizeRepeatedTextColors(elements: NormalizedElement[]) {
  const groups = new Map<string, NormalizedElement[]>()

  for (const element of elements) {
    if (!isTextLikeElement(element)) {
      continue
    }

    const signature = getRepeatedTextSignature(element)

    if (!signature) {
      continue
    }

    const siblings = groups.get(signature)

    if (siblings) {
      siblings.push(element)
      continue
    }

    groups.set(signature, [element])
  }

  for (const siblings of groups.values()) {
    if (siblings.length < 2) {
      continue
    }

    const referenceColor = siblings
      .map((element) => extractResolvedTextColor(element))
      .find((color) => color != null && !isDefaultTextColor(color))

    if (!referenceColor) {
      continue
    }

    for (const element of siblings) {
      const currentColor = extractResolvedTextColor(element)

      if (!currentColor || !isDefaultTextColor(currentColor)) {
        continue
      }

      applyResolvedTextColor(element, referenceColor)
    }
  }

  return elements
}

function isTextLikeElement(element: NormalizedElement) {
  return element.type === 'text' || typeof element.html === 'string' || typeof element.text === 'string'
}

function getRepeatedTextSignature(element: NormalizedElement) {
  const content = normalizeRepeatedTextContent(element.html ?? element.text)

  if (!content) {
    return undefined
  }

  return [
    content,
    element.style.fontFamily ?? '',
    element.style.fontSize ?? '',
    Math.round(element.bounds.width),
    Math.round(element.bounds.height),
  ].join('|')
}

function normalizeRepeatedTextContent(input?: string) {
  if (!input) {
    return ''
  }

  const plainText = input.replace(/<[^>]+>/g, ' ')
  return plainText.replace(/\s+/g, ' ').trim().toLowerCase()
}

function extractResolvedTextColor(element: NormalizedElement) {
  const spanColor = extractHtmlTextColor(element.html)

  if (spanColor) {
    return spanColor
  }

  return normalizeColorValue(element.style.color)
}

function extractHtmlTextColor(html?: string) {
  if (!html) {
    return undefined
  }

  const match = html.match(/color\s*:\s*([^;"]+)/i)
  return normalizeColorValue(match?.[1])
}

function normalizeColorValue(value?: string) {
  if (!value) {
    return undefined
  }

  return value.replace(/\s+/g, '').toLowerCase()
}

function isDefaultTextColor(color: string) {
  return color === '#000000' || color === '#111827' || color === 'rgb(0,0,0)' || color === 'rgb(17,24,39)'
}

function applyResolvedTextColor(element: NormalizedElement, color: string) {
  element.style.color = color

  if (!element.html) {
    return
  }

  if (/color\s*:/i.test(element.html)) {
    element.html = element.html.replace(/color\s*:\s*([^;"]+)/gi, `color: ${color}`)
    return
  }

  if (/style=/i.test(element.html)) {
    element.html = element.html.replace(/style="([^"]*)"/i, `style="$1; color: ${color};"`)
    return
  }

  element.html = element.html.replace(/<span\b([^>]*)>/i, `<span$1 style="color: ${color};">`)
}

function normalizeBackground(rawSlide: RawPptxSlide): SlideBackground {
  const fill = rawSlide.fill

  if (!fill) {
    return { color: '#ffffff', css: '#ffffff' }
  }

  if ('color' in fill && typeof fill.color === 'string') {
    return { color: fill.color, css: fill.color }
  }

  if (!('type' in fill)) {
    return { color: '#ffffff', css: '#ffffff' }
  }

  if (fill.type === 'color' && typeof fill.value === 'string') {
    return { color: fill.value, css: fill.value }
  }

  if (fill.type === 'image') {
    const imageUrl = normalizeFillImageSource(fill.value)

    if (imageUrl) {
      return {
        imageUrl,
        css: `center / cover no-repeat url(${imageUrl})`,
      }
    }
  }

  if (fill.type === 'gradient') {
    const css = normalizeGradientFill(fill.value)

    if (css) {
      return { css }
    }
  }

  if (fill.type === 'pattern') {
    const pattern = fill.value as { backgroundColor?: string; foregroundColor?: string } | undefined
    const color = pattern?.backgroundColor ?? '#ffffff'
    return {
      color,
      css: color,
    }
  }

  return {
    color: '#ffffff',
    css: '#ffffff',
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
  const html = normalizeHtml(rawElement)
  const text = html ? undefined : normalizeText(rawElement)

  return {
    id: String(rawElement.id ?? `slide-${slideIndex + 1}-element-${elementIndex + 1}`),
    type,
    name: rawElement.name ?? `${type}-${elementIndex + 1}`,
    order: normalizeElementOrder(rawElement.order, elementIndex),
    bounds: {
      x: normalizePointLength(rawElement.x ?? rawElement.left, 0),
      y: normalizePointLength(rawElement.y ?? rawElement.top, 0),
      width: normalizePointLength(rawElement.width ?? rawElement.w, 160),
      height: normalizePointLength(rawElement.height ?? rawElement.h, 90),
      rotate: normalizeNumber(rawElement.rotate ?? rawElement.rotation, 0),
    },
    text,
    html,
    style: normalizeStyle(type, rawElement),
    media,
    shape: normalizeShapeMeta(rawElement),
    children: normalizeChildren(rawElement, slideIndex),
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

  applyFillStyle(base, rawElement.fill)
  applyBorderStyle(base, rawElement)
  applyShadowStyle(base, rawElement)

  if (type === 'shape') {
    const borderRadius = resolveShapeBorderRadius(rawElement)

    if (borderRadius) {
      base.borderRadius = borderRadius
    }
  }

  if (type === 'text') {
    base.whiteSpace = 'pre-wrap'
    base.color = '#111827'
    base.padding = '0'
  }

  if (type === 'image') {
    base.background = 'transparent'
  }

  if (type === 'group') {
    base.background = 'transparent'
    base.overflow = 'visible'
  }

  return {
    ...base,
    ...(rawElement.style ?? {}),
  }
}

function resolveShapeBorderRadius(rawElement: RawPptxElement) {
  if (rawElement.style?.borderRadius) {
    return rawElement.style.borderRadius
  }

  if (rawElement.shapType === 'roundRect') {
    return '16px'
  }

  if (!rawElement.path || rawElement.shapType === 'rect') {
    return '12px'
  }

  return undefined
}

function normalizeMedia(type: NormalizedElementType, rawElement: RawPptxElement): MediaResource | undefined {
  if (!['image', 'video', 'audio', 'math'].includes(type)) {
    return undefined
  }

  const blobSource = rawElement.blob instanceof Blob || typeof rawElement.blob === 'string'
    ? rawElement.blob
    : rawElement.picBlob
  const directBlobUrl = typeof blobSource === 'string' ? blobSource : undefined
  const objectUrl =
    blobSource instanceof Blob && typeof URL !== 'undefined' ? URL.createObjectURL(blobSource) : undefined

  return {
    src: normalizeMediaSource(rawElement),
    objectUrl: objectUrl ?? directBlobUrl,
    blob: blobSource instanceof Blob || typeof blobSource === 'string' ? blobSource : undefined,
    mimeType: typeof rawElement.mimeType === 'string' ? rawElement.mimeType : undefined,
    poster: typeof rawElement.poster === 'string' ? rawElement.poster : undefined,
    preload: type === 'audio' ? 'metadata' : 'auto',
    cleanup: objectUrl ? 'revoke-object-url' : 'keep',
    crop: normalizeMediaCrop(rawElement),
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

function normalizeHtml(rawElement: RawPptxElement): string | undefined {
  const candidates = [rawElement.html, rawElement.contentHtml, rawElement.content, rawElement.text]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && looksLikeHtml(candidate)) {
      return candidate
    }
  }

  return undefined
}

function normalizeNumber(input: number | undefined, fallback: number): number {
  return typeof input === 'number' && Number.isFinite(input) ? input : fallback
}

function normalizeOptionalPointLength(input: number | undefined, fallback: number): number {
  if (typeof input !== 'number' || !Number.isFinite(input)) {
    return fallback
  }

  return pointToCssPx(input)
}

function normalizePointLength(input: number | undefined, fallback: number): number {
  return pointToCssPx(normalizeNumber(input, fallback))
}

function pointToCssPx(value: number): number {
  return numberToFixed(value * CSS_PX_PER_POINT)
}

function normalizeElementOrder(input: RawPptxElement['order'], fallback: number): number {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return input
  }

  if (typeof input === 'string') {
    const value = Number(input)
    return Number.isFinite(value) ? value : fallback
  }

  return fallback
}

function normalizeThemeColors(input: RawPptxDocument['themeColors']) {
  if (Array.isArray(input)) {
    return Object.fromEntries(input.map((color, index) => [`theme-${index + 1}`, color]))
  }

  return input ?? {}
}

function normalizeMediaSource(rawElement: RawPptxElement) {
  const candidates = [rawElement.src, rawElement.base64, rawElement.ref, rawElement.picRef]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate
    }
  }

  return undefined
}

function normalizeMediaCrop(rawElement: RawPptxElement) {
  const rect = rawElement.rect

  if (!rect || typeof rect !== 'object') {
    return undefined
  }

  const left = normalizeCropRatio(rect.l)
  const right = normalizeCropRatio(rect.r)
  const top = normalizeCropRatio(rect.t)
  const bottom = normalizeCropRatio(rect.b)

  if (left === 0 && right === 0 && top === 0 && bottom === 0) {
    return undefined
  }

  return { left, right, top, bottom }
}

function normalizeCropRatio(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }

  return Math.min(Math.max(value / 100, 0), 0.95)
}

function normalizeFillImageSource(value: unknown) {
  if (typeof value === 'string') {
    return value
  }

  if (!value || typeof value !== 'object') {
    return undefined
  }

  const imageValue = value as Record<string, unknown>
  const candidates = [imageValue.blob, imageValue.base64, imageValue.ref]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) {
      return candidate
    }
  }

  return undefined
}

function normalizeGradientFill(value: unknown) {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const gradient = value as {
    rot?: number
    colors?: Array<{ pos?: string; color?: string }>
  }

  if (!Array.isArray(gradient.colors) || gradient.colors.length === 0) {
    return undefined
  }

  const angle = typeof gradient.rot === 'number' ? gradient.rot : 180
  const stops = gradient.colors
    .filter((stop) => typeof stop.color === 'string')
    .map((stop) => `${stop.color} ${stop.pos ?? ''}`.trim())

  return stops.length > 0 ? `linear-gradient(${angle}deg, ${stops.join(', ')})` : undefined
}

function normalizeChildren(rawElement: RawPptxElement, slideIndex: number) {
  if (!Array.isArray(rawElement.elements)) {
    return undefined
  }

  return rawElement.elements
    .map((child, childIndex) => normalizeElement(child, slideIndex, childIndex))
    .sort((a, b) => a.order - b.order)
}

function normalizeShapeMeta(rawElement: RawPptxElement) {
  if (
    typeof rawElement.path !== 'string' &&
    typeof rawElement.shapType !== 'string' &&
    rawElement.lineHeadEnd == null &&
    rawElement.lineTailEnd == null &&
    rawElement.vAlign == null &&
    rawElement.isVertical == null &&
    rawElement.isFlipH == null &&
    rawElement.isFlipV == null &&
    rawElement.textBodyInset == null
  ) {
    return undefined
  }

  return {
    path: typeof rawElement.path === 'string' ? rawElement.path : undefined,
    type: typeof rawElement.shapType === 'string' ? rawElement.shapType : undefined,
    viewBoxWidth: normalizeNumber(rawElement.width ?? rawElement.w, 160),
    viewBoxHeight: normalizeNumber(rawElement.height ?? rawElement.h, 90),
    lineHeadEnd: rawElement.lineHeadEnd,
    lineTailEnd: rawElement.lineTailEnd,
    vAlign: rawElement.vAlign,
    isVertical: rawElement.isVertical,
    isFlipH: rawElement.isFlipH,
    isFlipV: rawElement.isFlipV,
    textInset: rawElement.textBodyInset
      ? {
          left: normalizePointLength(rawElement.textBodyInset.left, 7.2),
          right: normalizePointLength(rawElement.textBodyInset.right, 7.2),
          top: normalizePointLength(rawElement.textBodyInset.top, 3.6),
          bottom: normalizePointLength(rawElement.textBodyInset.bottom, 3.6),
        }
      : undefined,
  }
}

function looksLikeHtml(input: string) {
  return /<\/?[a-z][\s\S]*>/i.test(input)
}

function applyFillStyle(style: Record<string, string>, fill: RawPptxElement['fill']) {
  if (!fill) {
    return
  }

  if ('color' in fill && typeof fill.color === 'string') {
    style.background = fill.color
    return
  }

  if (!('type' in fill)) {
    return
  }

  if (fill.type === 'color' && typeof fill.value === 'string') {
    style.background = fill.value
  }

  if (fill.type === 'image' && fill.value && typeof fill.value === 'object') {
    const imageFill = fill.value as Record<string, unknown>
    const imageSource = [imageFill.blob, imageFill.base64, imageFill.ref].find(
      (candidate) => typeof candidate === 'string' && candidate.length > 0,
    ) as string | undefined

    if (imageSource) {
      style.backgroundImage = `url(${imageSource})`
      style.backgroundPosition = 'center'
      style.backgroundRepeat = 'no-repeat'
      style.backgroundSize = 'cover'
    }
  }
}

function applyBorderStyle(style: Record<string, string>, rawElement: RawPptxElement) {
  if (typeof rawElement.borderWidth !== 'number' || rawElement.borderWidth <= 0) {
    return
  }

  const lineStyle = normalizeBorderLineStyle(rawElement)
  style.border = `${pointToCssPx(rawElement.borderWidth)}px ${lineStyle} ${rawElement.borderColor ?? '#94a3b8'}`

  const dashArray = normalizeStrokeDasharray(rawElement.borderStrokeDasharray)

  if (dashArray) {
    style['--ppt-stroke-dasharray'] = dashArray
  }
}

function applyShadowStyle(style: Record<string, string>, rawElement: RawPptxElement) {
  const shadow = rawElement.shadow

  if (!shadow) {
    return
  }

  const x = normalizePointLength(shadow.offsetX, 0)
  const y = normalizePointLength(shadow.offsetY, 0)
  const blur = normalizePointLength(shadow.blur, 0)
  const color = shadow.color ?? 'rgba(15, 23, 42, 0.22)'

  style.boxShadow = `${x}px ${y}px ${blur}px ${color}`
}

function numberToFixed(value: number): number {
  return Number(value.toFixed(4))
}

function normalizeBorderLineStyle(rawElement: RawPptxElement) {
  if (normalizeStrokeDasharray(rawElement.borderStrokeDasharray)) {
    return 'dashed'
  }

  if (rawElement.borderType === 'dashed' || rawElement.borderType === 'dotted') {
    return rawElement.borderType
  }

  return 'solid'
}

function normalizeStrokeDasharray(input: RawPptxElement['borderStrokeDasharray']) {
  if (typeof input !== 'string' || input === '0') {
    return undefined
  }

  const values = input
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0)
    .map(pointToCssPx)

  return values.length > 0 ? values.join(' ') : undefined
}

function isImageAuxiliaryRect(element: NormalizedElement, elements: NormalizedElement[]) {
  if (!isDashedEmptyRect(element)) {
    return false
  }

  return elements.some((candidate) => candidate.type === 'image' && containsBounds(candidate, element))
}

function isDashedEmptyRect(element: NormalizedElement) {
  return (
    element.type === 'shape' &&
    element.shape?.type === 'rect' &&
    Boolean(element.style['--ppt-stroke-dasharray']) &&
    !element.style.background &&
    !element.style.backgroundImage &&
    !element.html &&
    !element.text &&
    !element.children?.length
  )
}

function containsBounds(container: NormalizedElement, child: NormalizedElement) {
  const tolerance = 1
  const containerRight = container.bounds.x + container.bounds.width
  const containerBottom = container.bounds.y + container.bounds.height
  const childRight = child.bounds.x + child.bounds.width
  const childBottom = child.bounds.y + child.bounds.height

  return (
    child.bounds.x >= container.bounds.x - tolerance &&
    child.bounds.y >= container.bounds.y - tolerance &&
    childRight <= containerRight + tolerance &&
    childBottom <= containerBottom + tolerance
  )
}

function normalizeAnimations(
  rawSlide: RawPptxSlide,
  elements: RawPptxElement[],
  slideIndex: number,
): NormalizedAnimation[] {
  const rawAnimations = Array.isArray(rawSlide.animations)
    ? rawSlide.animations
    : elements.flatMap((element) => (Array.isArray(element.animations) ? element.animations : []))

  return rawAnimations
    .map((animation, animationIndex) => normalizeAnimation(animation, slideIndex, animationIndex))
    .filter((animation): animation is NormalizedAnimation => animation !== null)
}

function normalizeAnimation(
  rawAnimation: RawPptxAnimation,
  slideIndex: number,
  animationIndex: number,
): NormalizedAnimation | null {
  const targetElementIds = normalizeTargetElementIds(rawAnimation)

  if (targetElementIds.length === 0) {
    return null
  }

  return {
    id: String(rawAnimation.id ?? `slide-${slideIndex + 1}-animation-${animationIndex + 1}`),
    trigger: normalizeAnimationTrigger(rawAnimation.trigger),
    durationMs: normalizeNumber(rawAnimation.durationMs ?? rawAnimation.duration, 350),
    targetElementIds,
    effect: rawAnimation.effect === 'appear' || rawAnimation.effect === 'fade' ? rawAnimation.effect : 'fade',
  }
}

function normalizeAnimationTrigger(rawTrigger: RawPptxAnimation['trigger']): NormalizedAnimation['trigger'] {
  switch (rawTrigger) {
    case 'withPrevious':
    case 'afterPrevious':
    case 'onClick':
      return rawTrigger
    default:
      return 'onClick'
  }
}

function normalizeTargetElementIds(rawAnimation: RawPptxAnimation): string[] {
  const ids = Array.isArray(rawAnimation.targetElementIds)
    ? rawAnimation.targetElementIds
    : rawAnimation.targetElementId != null
      ? [rawAnimation.targetElementId]
      : []

  return ids.map((id) => String(id))
}

export function disposePresentationMedia(presentation: NormalizedPresentation) {
  if (typeof URL === 'undefined') {
    return
  }

  for (const slide of presentation.slides) {
    for (const element of slide.elements) {
      if (element.media?.cleanup === 'revoke-object-url' && element.media.objectUrl) {
        URL.revokeObjectURL(element.media.objectUrl)
      }
    }
  }
}
