<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import type { EvaluatedElementFrame } from '../../types/presentation'

const props = defineProps<{
  element: EvaluatedElementFrame
}>()

const elementStyle = computed<CSSProperties>(() => {
  const hasText = Boolean(props.element.html || props.element.text)
  const shapeVisualStyle = props.element.type === 'shape'

  return {
    left: `${props.element.bounds.x}px`,
    top: `${props.element.bounds.y}px`,
    width: `${props.element.bounds.width}px`,
    height: `${props.element.bounds.height}px`,
    transform: `rotate(${props.element.bounds.rotate}deg)`,
    opacity: props.element.opacity,
    display: props.element.visible ? 'block' : 'none',
    zIndex: props.element.order,
    ...props.element.style,
    overflow: hasText ? 'visible' : props.element.style.overflow,
    background: shapeVisualStyle ? 'transparent' : props.element.style.background,
    border: shapeVisualStyle ? 'none' : props.element.style.border,
    borderRadius: shapeVisualStyle ? undefined : props.element.style.borderRadius,
    boxShadow: shapeVisualStyle ? undefined : props.element.style.boxShadow,
  }
})

const mediaSource = computed(() => {
  const inlineBlob = typeof props.element.media?.blob === 'string' ? props.element.media.blob : ''
  return props.element.media?.objectUrl ?? inlineBlob ?? props.element.media?.src ?? ''
})

const mediaStyle = computed<CSSProperties>(() => {
  const crop = props.element.media?.crop

  if (!crop) {
    return {}
  }

  const visibleWidth = Math.max(1 - crop.left - crop.right, 0.01)
  const visibleHeight = Math.max(1 - crop.top - crop.bottom, 0.01)

  return {
    position: 'absolute',
    width: `${100 / visibleWidth}%`,
    height: `${100 / visibleHeight}%`,
    maxWidth: 'none',
    maxHeight: 'none',
    left: `${(-crop.left / visibleWidth) * 100}%`,
    top: `${(-crop.top / visibleHeight) * 100}%`,
    objectFit: 'fill',
  }
})

const sanitizedHtml = computed(() => sanitizePresentationHtml(props.element.html))

const textClass = computed(() => ({
  'element-text': true,
  'element-text--single-line': isShortSingleLineText(
    sanitizedHtml.value,
    props.element.text,
    props.element.bounds.width,
    props.element.style.fontSize,
  ),
}))

const childElements = computed(() => props.element.children ?? [])

const hasTextContent = computed(() => Boolean(props.element.html || props.element.text))

const shouldRenderText = computed(() => props.element.type === 'text' || hasTextContent.value)

const shapePath = computed(() => props.element.shape?.path)
const shouldRenderShapeSvg = computed(() => shouldRenderSvgShape(props.element) && Boolean(shapePath.value))

const shapeFill = computed(() => {
  const background = props.element.style.background

  if (!background || background === 'transparent') {
    return 'none'
  }

  return background
})

const shapeStroke = computed(() => parseBorderColor(props.element.style.border))

const shapeStrokeWidth = computed(() => parseBorderWidth(props.element.style.border))

const shapeStrokeDasharray = computed(() => props.element.style['--ppt-stroke-dasharray'])

const markerIdBase = computed(() => `marker-${props.element.id}`.replace(/[^a-zA-Z0-9_-]/g, '-'))

const shapeMarkerStart = computed(() => {
  if (!shouldRenderLineMarker(props.element.shape?.lineHeadEnd?.type)) {
    return undefined
  }

  return `url(#${markerIdBase.value}-start)`
})

const shapeMarkerEnd = computed(() => {
  if (!shouldRenderLineMarker(props.element.shape?.lineTailEnd?.type)) {
    return undefined
  }

  return `url(#${markerIdBase.value}-end)`
})

const shapePathTransform = computed(() => {
  const width = props.element.shape?.viewBoxWidth ?? props.element.bounds.width
  const height = props.element.shape?.viewBoxHeight ?? props.element.bounds.height
  const transforms: string[] = []

  if (props.element.shape?.isFlipH) {
    transforms.push(`translate(${width} 0) scale(-1 1)`)
  }

  if (props.element.shape?.isFlipV) {
    transforms.push(`translate(0 ${height}) scale(1 -1)`)
  }

  return transforms.join(' ')
})

const shapeMarkerStartSize = computed(() => getMarkerSize(props.element.shape?.lineHeadEnd))

const shapeMarkerEndSize = computed(() => getMarkerSize(props.element.shape?.lineTailEnd))

const shapeViewBox = computed(() => {
  const width = props.element.shape?.viewBoxWidth ?? props.element.bounds.width
  const height = props.element.shape?.viewBoxHeight ?? props.element.bounds.height
  return `0 0 ${width} ${height}`
})

const shapeLayerStyle = computed<CSSProperties>(() => {
  if (props.element.type !== 'shape') {
    return {}
  }

  const hasShapePath = shouldRenderSvgShape(props.element)

  return {
    background: hasShapePath ? 'transparent' : props.element.style.background,
    border: hasShapePath ? 'none' : props.element.style.border,
    borderRadius: props.element.style.borderRadius,
    boxShadow: props.element.style.boxShadow,
  }
})

const textBoxStyle = computed<CSSProperties>(() => ({
  justifyContent: shouldApplyVerticalAlign.value ? mapVerticalAlign(props.element.shape?.vAlign) : 'flex-start',
  writingMode: props.element.shape?.isVertical ? 'vertical-rl' : 'horizontal-tb',
  ...formatTextInset(shouldApplyTextInset.value ? props.element.shape?.textInset : undefined),
}))

const shouldApplyVerticalAlign = computed(() => props.element.type === 'shape')

const shouldApplyTextInset = computed(() => {
  const shapeType = props.element.shape?.type
  return props.element.type === 'text' || (props.element.type === 'shape' && (!shapeType || shapeType === 'rect'))
})

const shouldRenderPlaceholder = computed(() => {
  if (props.element.type === 'shape' || props.element.type === 'group') {
    return false
  }

  if (props.element.type === 'image' || props.element.type === 'video' || props.element.type === 'audio' || props.element.type === 'math') {
    return !mediaSource.value
  }

  return !shouldRenderText.value
})
</script>

<template>
  <div class="element" :style="elementStyle">
    <svg
      v-if="props.element.type === 'shape' && shouldRenderShapeSvg"
      class="element-shape-svg"
      :style="shapeLayerStyle"
      :viewBox="shapeViewBox"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <marker
          v-if="shapeMarkerStart"
          :id="`${markerIdBase}-start`"
          :markerWidth="shapeMarkerStartSize.width"
          :markerHeight="shapeMarkerStartSize.height"
          :refX="shapeMarkerStartSize.width"
          :refY="shapeMarkerStartSize.height / 2"
          orient="auto-start-reverse"
          markerUnits="strokeWidth"
        >
          <path :d="`M 0 0 L ${shapeMarkerStartSize.width} ${shapeMarkerStartSize.height / 2} L 0 ${shapeMarkerStartSize.height} z`" :fill="shapeStroke" />
        </marker>
        <marker
          v-if="shapeMarkerEnd"
          :id="`${markerIdBase}-end`"
          :markerWidth="shapeMarkerEndSize.width"
          :markerHeight="shapeMarkerEndSize.height"
          :refX="shapeMarkerEndSize.width"
          :refY="shapeMarkerEndSize.height / 2"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path :d="`M 0 0 L ${shapeMarkerEndSize.width} ${shapeMarkerEndSize.height / 2} L 0 ${shapeMarkerEndSize.height} z`" :fill="shapeStroke" />
        </marker>
      </defs>
      <path
        :d="shapePath"
        :fill="shapeFill"
        :stroke="shapeStroke"
        :stroke-width="shapeStrokeWidth"
        :stroke-dasharray="shapeStrokeDasharray"
        :transform="shapePathTransform"
        :marker-start="shapeMarkerStart"
        :marker-end="shapeMarkerEnd"
      />
    </svg>

    <div v-else-if="props.element.type === 'shape'" class="element-shape" :style="shapeLayerStyle"></div>

    <div v-if="shouldRenderText" :class="textClass" :style="textBoxStyle" v-html="sanitizedHtml || props.element.text"></div>

    <img
      v-else-if="props.element.type === 'image' && mediaSource"
      class="element-media"
      :style="mediaStyle"
      :src="mediaSource"
      :alt="props.element.name"
    />

    <video
      v-else-if="props.element.type === 'video' && mediaSource"
      class="element-media"
      :src="mediaSource"
      :poster="props.element.media?.poster"
      :muted="true"
      preload="metadata"
      controls
    />

    <audio
      v-else-if="props.element.type === 'audio' && mediaSource"
      class="element-audio"
      :src="mediaSource"
      preload="metadata"
      controls
    />

    <img
      v-else-if="props.element.type === 'math' && mediaSource"
      class="element-media"
      :style="mediaStyle"
      :src="mediaSource"
      :alt="props.element.name"
    />

    <template v-else-if="props.element.type === 'group' && childElements.length">
      <ElementRenderer
        v-for="child in childElements"
        :key="child.id"
        :element="child"
      />
    </template>

    <div v-else-if="shouldRenderPlaceholder" class="element-placeholder">
      <span class="element-type">{{ props.element.type }}</span>
      <span class="element-name">{{ props.element.name }}</span>
    </div>
  </div>
</template>

<style scoped>
.element {
  position: absolute;
  transform-origin: center center;
  transition: opacity 220ms ease;
}

.element-text,
.element-media,
.element-shape,
.element-shape-svg,
.element-placeholder,
.element-audio {
  width: 100%;
  height: 100%;
}

.element-text {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  overflow: visible;
  line-height: normal;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  word-break: normal;
  overflow-wrap: normal;
}

.element-text :deep(p) {
  margin: 0;
  padding: 0;
}

.element-text :deep(span) {
  white-space: pre-wrap;
}

.element-text--single-line {
  width: max-content;
  min-width: max-content;
  max-width: none;
}

.element-text--single-line :deep(p),
.element-text--single-line :deep(span) {
  white-space: pre;
}

.element-text :deep(.ppt-bullet-marker) {
  flex: 0 0 auto;
}

.element-media {
  display: block;
  object-fit: contain;
}

.element-audio {
  min-height: 3rem;
}

.element-shape {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.element-shape-svg {
  position: absolute;
  inset: 0;
  overflow: visible;
}

.element-placeholder {
  display: grid;
  place-content: center;
  gap: 0.4rem;
  border: 1px dashed rgba(148, 163, 184, 0.5);
  border-radius: 1rem;
  color: #cbd5e1;
  background: rgba(15, 23, 42, 0.28);
  text-align: center;
}

.element-type {
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.72;
}

.element-name {
  font-size: 0.95rem;
}
</style>

<script lang="ts">
function sanitizePresentationHtml(html?: string) {
  if (!html || typeof DOMParser === 'undefined') {
    return ''
  }

  const parser = new DOMParser()
  const documentNode = parser.parseFromString(html, 'text/html')

  documentNode.querySelectorAll('script, style, iframe, object, embed').forEach((node) => node.remove())
  documentNode.querySelectorAll('li').forEach((node) => {
    if (isBlankListItem(node)) {
      node.remove()
    }
  })

  for (const element of documentNode.querySelectorAll('*')) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase()

      if (name.startsWith('on')) {
        element.removeAttribute(attribute.name)
      }
    }
  }

  return documentNode.body.innerHTML
}

function parseBorderWidth(border?: string) {
  if (!border) {
    return 0
  }

  const width = Number.parseFloat(border)
  return Number.isFinite(width) ? width : 0
}

function parseBorderColor(border?: string) {
  if (!border) {
    return 'none'
  }

  return border.split(' ').find((part) => part.startsWith('#') || part.startsWith('rgb')) ?? 'none'
}

function mapVerticalAlign(vAlign?: string) {
  switch (vAlign) {
    case 'mid':
      return 'center'
    case 'down':
      return 'flex-end'
    default:
      return 'flex-start'
  }
}

function formatTextInset(inset?: { left: number; right: number; top: number; bottom: number }): CSSProperties {
  if (!inset) {
    return {}
  }

  return {
    boxSizing: 'border-box',
    paddingLeft: `${inset.left}px`,
    paddingRight: `${inset.right}px`,
    paddingTop: `${inset.top}px`,
    paddingBottom: `${inset.bottom}px`,
  }
}

function isBlankListItem(node: Element) {
  const clone = node.cloneNode(true)

  if (clone instanceof Element) {
    clone.querySelectorAll('.ppt-bullet-marker').forEach((marker) => marker.remove())
  }

  const text = (clone.textContent ?? '').replace(/[\s\u00a0\u200b-\u200d\ufeff]/g, '')
  return text.length === 0
}

function isShortSingleLineText(
  html?: string,
  text?: string,
  boundsWidth?: number,
  fontSizeValue?: string,
) {
  const fontSize = parseFontSize(fontSizeValue)

  if (html && typeof DOMParser !== 'undefined') {
    const documentNode = new DOMParser().parseFromString(html, 'text/html')

    if (documentNode.querySelector('ul, ol, li, br')) {
      return false
    }

    if (hasCenteredText(documentNode)) {
      return false
    }

    const paragraphs = documentNode.querySelectorAll('p')
    const content = (documentNode.body.textContent ?? '').replace(/\s+/g, '')
    return (
      paragraphs.length <= 1 &&
      content.length > 0 &&
      content.length <= 32 &&
      !looksLikeSentence(content) &&
      canFitSingleLine(content, boundsWidth, fontSize)
    )
  }

  const content = text?.replace(/\s+/g, '') ?? ''
  return (
    content.length > 0 &&
    content.length <= 32 &&
    !looksLikeSentence(content) &&
    canFitSingleLine(content, boundsWidth, fontSize)
  )
}

function canFitSingleLine(content: string, boundsWidth?: number, fontSize = 16) {
  if (!boundsWidth || boundsWidth <= 0) {
    return false
  }

  const estimatedWidth = estimateTextWidth(content, fontSize)
  return estimatedWidth <= boundsWidth * 0.9
}

function estimateTextWidth(content: string, fontSize: number) {
  let width = 0

  for (const char of content) {
    if (/[\u4e00-\u9fff]/.test(char)) {
      width += fontSize
      continue
    }

    if (/[A-Z]/.test(char)) {
      width += fontSize * 0.68
      continue
    }

    if (/[a-z0-9]/.test(char)) {
      width += fontSize * 0.56
      continue
    }

    width += fontSize * 0.48
  }

  return width
}

function parseFontSize(value?: string) {
  const parsed = value ? Number.parseFloat(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : 16
}

function looksLikeSentence(content: string) {
  return /[，。！？；：、,.!?;:]/.test(content)
}

function hasCenteredText(documentNode: Document) {
  return Array.from(documentNode.querySelectorAll('p, span, div')).some((element) => {
    const align = (element.getAttribute('align') ?? '').toLowerCase()
    const style = (element.getAttribute('style') ?? '').toLowerCase().replace(/\s+/g, '')
    return (
      align === 'center' ||
      style.includes('text-align:center') ||
      style.includes('justify-content:center') ||
      style.includes('align-items:center')
    )
  })
}

function shouldRenderLineMarker(type?: string) {
  return Boolean(type && type !== 'none')
}

function shouldRenderSvgShape(element: EvaluatedElementFrame) {
  if (element.type !== 'shape' || !element.shape?.path) {
    return false
  }

  return element.shape.type !== 'rect' && element.shape.type !== 'roundRect'
}

function getMarkerSize(marker?: { width?: string; length?: string }) {
  const width = mapMarkerSize(marker?.width)
  const length = mapMarkerSize(marker?.length)

  return {
    width: length,
    height: width,
  }
}

function mapMarkerSize(value?: string) {
  switch (value) {
    case 'sm':
      return 5
    case 'lg':
      return 9
    default:
      return 7
  }
}
</script>
