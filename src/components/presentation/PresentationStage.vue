<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
import SlideViewport from './SlideViewport.vue'
import { getStageViewportDescriptors } from './stageViewportModel'
import { getTransitionViewportStyle } from './transitionViewportModel'
import type { TouchInputDescriptor } from '../../runtime/input/inputEngine'
import type { PresentationFrame } from '../../types/presentation'

const props = defineProps<{
  frame: PresentationFrame
}>()

const emit = defineEmits<{
  stageClick: [event: MouseEvent]
  stageSwipe: [touch: TouchInputDescriptor]
}>()

const stageRef = useTemplateRef<HTMLElement>('stage')
const stageWidth = shallowRef(0)
const touchStart = shallowRef<{ x: number; y: number } | null>(null)
let resizeObserver: ResizeObserver | undefined

const stageStyle = computed(() => ({
  aspectRatio: `${props.frame.width} / ${props.frame.height}`,
}))

const canvasStyle = computed(() => {
  const scale = stageWidth.value > 0 ? stageWidth.value / props.frame.width : 1

  return {
    width: `${props.frame.width}px`,
    height: `${props.frame.height}px`,
    transform: `scale(${scale})`,
  }
})

const viewportDescriptors = computed(() => getStageViewportDescriptors(props.frame))
const showTransitionDebug = computed(() => {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return false
  }

  const params = new URLSearchParams(window.location.search)
  return params.has('transitionCase') || params.get('debugTransition') === '1'
})

const transitionDebugText = computed(() => {
  if (!showTransitionDebug.value) {
    return ''
  }

  return JSON.stringify({
    frame: {
      currentSlideIndex: props.frame.currentSlideIndex,
      isTransitioning: props.frame.isTransitioning,
      transitionType: props.frame.transitionType,
      transitionDirection: props.frame.transitionDirection,
      transitionOrientation: props.frame.transitionOrientation,
      transitionProgress: props.frame.transitionProgress,
    },
    viewports: viewportDescriptors.value.map((descriptor) => ({
      role: descriptor.transitionRole ?? 'current',
      style: getTransitionViewportStyle({
        transitionType: descriptor.transitionType,
        transitionDirection: descriptor.transitionDirection,
        transitionOrientation: descriptor.transitionOrientation,
        role: descriptor.transitionRole,
        progress: descriptor.transitionProgress,
        width: props.frame.width,
        height: props.frame.height,
      }),
    })),
  }, null, 2)
})

function handleMouseUp(event: MouseEvent) {
  emit('stageClick', event)
}

function handleTouchStart(event: TouchEvent) {
  const touch = event.changedTouches[0]

  if (!touch) {
    return
  }

  touchStart.value = { x: touch.clientX, y: touch.clientY }
}

function handleTouchEnd(event: TouchEvent) {
  const start = touchStart.value
  const touch = event.changedTouches[0]
  touchStart.value = null

  if (!start || !touch) {
    return
  }

  emit('stageSwipe', {
    startX: start.x,
    startY: start.y,
    endX: touch.clientX,
    endY: touch.clientY,
  })
}

onMounted(() => {
  if (!stageRef.value) {
    return
  }

  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0]

    if (!entry) {
      return
    }

    stageWidth.value = entry.contentRect.width
  })
  resizeObserver.observe(stageRef.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="stage-shell" @mouseup="handleMouseUp" @touchstart.passive="handleTouchStart" @touchend="handleTouchEnd">
    <div ref="stage" class="stage" :style="stageStyle">
      <div class="stage-canvas" :style="canvasStyle">
        <SlideViewport
          v-for="descriptor in viewportDescriptors"
          :key="descriptor.key"
          :slide="descriptor.slide"
          :width="props.frame.width"
          :height="props.frame.height"
          :active="descriptor.active"
          :transition-progress="descriptor.transitionProgress"
          :transition-type="descriptor.transitionType"
          :transition-direction="descriptor.transitionDirection"
          :transition-orientation="descriptor.transitionOrientation"
          :transition-role="descriptor.transitionRole"
        />
      </div>
    </div>
    <pre v-if="showTransitionDebug" class="stage-debug">{{ transitionDebugText }}</pre>
  </div>
</template>

<style scoped>
.stage-shell {
  position: relative;
  min-height: 0;
  padding: 1rem;
  border-radius: 2rem;
  background:
    radial-gradient(circle at top left, rgba(249, 115, 22, 0.14), transparent 28%),
    radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.16), transparent 30%),
    rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.stage {
  position: relative;
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
}

.stage-canvas {
  position: absolute;
  inset: 0 auto auto 0;
  transform-origin: top left;
}

.stage-debug {
  margin: 1rem 0 0;
  padding: 0.85rem 1rem;
  overflow: auto;
  border-radius: 1rem;
  background: rgba(15, 23, 42, 0.84);
  color: #cbd5e1;
  font-size: 0.78rem;
  line-height: 1.45;
  white-space: pre-wrap;
}
</style>
