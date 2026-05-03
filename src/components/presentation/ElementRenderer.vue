<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import type { EvaluatedElementFrame, NormalizedElement } from '../../types/presentation'
import TableRenderer from './TableRenderer.vue'
import MediaRenderer from './MediaRenderer.vue'
import ChartRenderer from './ChartRenderer.vue'
import DiagramRenderer from './DiagramRenderer.vue'
import { createLineMarkerModel } from './lineMarkerModel'
import { getShapeSvgLayoutModel } from './shapeSvgLayout'
import { getShapeSvgPaintModel } from './shapeSvgModel'
import { sanitizePresentationHtml } from './textHtmlSanitizer'

const props = defineProps<{
  element: EvaluatedElementFrame
}>()

const shapePaintModel = computed(() =>
  getShapeSvgPaintModel({
    shapeType: props.element.shape?.type,
    background: props.element.style.background,
    border: props.element.style.border,
  }),
)

const shapeStrokeWidth = computed(() => shapePaintModel.value.strokeWidth)

const shapeLayoutModel = computed(() =>
  getShapeSvgLayoutModel({
    shapeType: props.element.shape?.type,
    boundsWidth: props.element.bounds.width,
    boundsHeight: props.element.bounds.height,
    viewBoxWidth: props.element.shape?.viewBoxWidth,
    viewBoxHeight: props.element.shape?.viewBoxHeight,
    strokeWidth: shapeStrokeWidth.value,
    isFlipH: props.element.shape?.isFlipH,
    isFlipV: props.element.shape?.isFlipV,
  }),
)

const elementStyle = computed<CSSProperties>(() => {
  const hasText = Boolean(props.element.renderedHtml || props.element.html || props.element.text)
  const shapeVisualStyle = props.element.type === 'shape'

  return {
    left: `${props.element.bounds.x + shapeLayoutModel.value.offsetX}px`,
    top: `${props.element.bounds.y + shapeLayoutModel.value.offsetY}px`,
    width: `${shapeLayoutModel.value.renderWidth}px`,
    height: `${shapeLayoutModel.value.renderHeight}px`,
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

const sanitizedHtml = computed(() => (
  typeof props.element.html === 'string'
    ? sanitizePresentationHtml(props.element.html)
    : undefined
))
const sanitizedRenderedHtml = computed(() => (
  typeof props.element.renderedHtml === 'string'
    ? sanitizePresentationHtml(props.element.renderedHtml)
    : undefined
))
const resolvedHtml = computed(() => sanitizedRenderedHtml.value ?? sanitizedHtml.value ?? props.element.text ?? '')

const textClass = computed(() => ({
  'element-text': true,
  'element-text--single-line': isShortSingleLineText(
    resolvedHtml.value,
    props.element.text,
    props.element.bounds.width,
    props.element.style.fontSize,
  ),
}))

const childElements = computed(() => props.element.children ?? [])
const chartMeta = computed(() => props.element.chart)
const diagramMeta = computed(() => props.element.diagram)

const hasTextContent = computed(() => Boolean(props.element.renderedHtml || props.element.html || props.element.text))

const shouldRenderText = computed(() => props.element.type === 'text' || hasTextContent.value)

const shapePath = computed(() => props.element.shape?.path)
const shouldRenderShapeSvg = computed(() => shouldRenderSvgShape(props.element) && Boolean(shapePath.value))

const shapeFill = computed(() => shapePaintModel.value.fill)

const shapeStroke = computed(() => shapePaintModel.value.stroke)

const shapeStrokeDasharray = computed(() => props.element.style['--ppt-stroke-dasharray'])

const markerIdBase = computed(() => `marker-${props.element.id}`.replace(/[^a-zA-Z0-9_-]/g, '-'))

const shapeMarkerStart = computed(() => {
  if (!shouldRenderLineMarker(props.element.shape?.lineHeadEnd?.type)) {
    return undefined
  }

  return `url(#${markerIdBase.value}-start)`
})

const shapeMarkerStartModel = computed(() => createLineMarkerModel(props.element.shape?.lineHeadEnd, 'start'))

const shapeMarkerEnd = computed(() => {
  if (!shouldRenderLineMarker(props.element.shape?.lineTailEnd?.type)) {
    return undefined
  }

  return `url(#${markerIdBase.value}-end)`
})

const shapeMarkerEndModel = computed(() => createLineMarkerModel(props.element.shape?.lineTailEnd, 'end'))

const shapePathTransform = computed(() => shapeLayoutModel.value.pathTransform)

const shapeViewBox = computed(() => {
  const width = shapeLayoutModel.value.viewBoxWidth
  const height = shapeLayoutModel.value.viewBoxHeight
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
  writingMode: resolveWritingMode(props.element.shape),
  textOrientation: resolveTextOrientation(props.element.shape),
  ...formatTextInset(shouldApplyTextInset.value ? props.element.shape?.textInset : undefined),
}))

function resolveWritingMode(shape?: NormalizedElement['shape']): CSSProperties['writingMode'] {
  const mode = shape?.verticalMode

  switch (mode) {
    case 'vert':
    case 'mongolianVert':
      return 'vertical-lr'
    case 'vert270':
      return 'sideways-rl'
    case 'wordArtVert':
    case 'wordArtVertRtl':
    case 'eaVert':
      return 'vertical-rl'
    default:
      return shape?.isVertical ? 'vertical-rl' : 'horizontal-tb'
  }
}

function resolveTextOrientation(shape?: NormalizedElement['shape']): CSSProperties['textOrientation'] {
  const mode = shape?.verticalMode

  if (mode === 'vert270' || mode === 'wordArtVertRtl') {
    return 'sideways'
  }

  if (shape?.isVertical) {
    return 'mixed'
  }

  return 'mixed'
}

const shouldApplyVerticalAlign = computed(() => props.element.type === 'shape')

const shouldApplyTextInset = computed(() => {
  const shapeType = props.element.shape?.type
  return props.element.type === 'text' || (props.element.type === 'shape' && (!shapeType || shapeType === 'rect'))
})

const shouldRenderPlaceholder = computed(() => {
  if (props.element.type === 'shape' || props.element.type === 'group') {
    return false
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
          v-if="shapeMarkerStart && shapeMarkerStartModel"
          :id="`${markerIdBase}-start`"
          :markerWidth="shapeMarkerStartModel.markerWidth"
          :markerHeight="shapeMarkerStartModel.markerHeight"
          :refX="shapeMarkerStartModel.refX"
          :refY="shapeMarkerStartModel.refY"
          :orient="shapeMarkerStartModel.orient"
          markerUnits="strokeWidth"
        >
          <path :d="shapeMarkerStartModel.path" :fill="shapeStroke" />
        </marker>
        <marker
          v-if="shapeMarkerEnd && shapeMarkerEndModel"
          :id="`${markerIdBase}-end`"
          :markerWidth="shapeMarkerEndModel.markerWidth"
          :markerHeight="shapeMarkerEndModel.markerHeight"
          :refX="shapeMarkerEndModel.refX"
          :refY="shapeMarkerEndModel.refY"
          :orient="shapeMarkerEndModel.orient"
          markerUnits="strokeWidth"
        >
          <path :d="shapeMarkerEndModel.path" :fill="shapeStroke" />
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

    <div v-if="shouldRenderText" :class="textClass" :style="textBoxStyle" v-html="resolvedHtml"></div>

    <MediaRenderer v-else-if="props.element.type === 'image' || props.element.type === 'video' || props.element.type === 'audio' || props.element.type === 'math'" :element="props.element" />

    <TableRenderer
      v-else-if="props.element.type === 'table' && props.element.table"
      :table="props.element.table"
    />

    <ChartRenderer
      v-else-if="props.element.type === 'chart' && chartMeta"
      :chart="chartMeta"
    />

    <DiagramRenderer
      v-else-if="props.element.type === 'diagram' && diagramMeta"
      :diagram="diagramMeta"
      :name="props.element.name"
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

function isShortSingleLineText(
  html?: string,
  text?: string,
  boundsWidth?: number,
  fontSizeValue?: string,
) {
  const fontSize = resolveFontSize(fontSizeValue, html)

  if (fontSize >= 36) {
    return false
  }

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

function resolveFontSize(value?: string, html?: string) {
  const fromStyle = parseFontSize(value)

  if (value && Number.isFinite(Number.parseFloat(value))) {
    return fromStyle
  }

  if (!html) {
    return fromStyle
  }

  const match = html.match(/font-size\s*:\s*([0-9.]+)(?:pt|px)?/i)
  return match?.[1] ? parseFontSize(match[1]) : fromStyle
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

</script>
