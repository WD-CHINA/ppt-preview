<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
import SlideViewport from './SlideViewport.vue'
import type { PresentationFrame } from '../../types/presentation'

const props = defineProps<{
  frame: PresentationFrame
}>()

const stageRef = useTemplateRef<HTMLElement>('stage')
const stageWidth = shallowRef(0)
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
  <div class="stage-shell">
    <div ref="stage" class="stage" :style="stageStyle">
      <div class="stage-canvas" :style="canvasStyle">
        <SlideViewport
          v-if="props.frame.previous"
          :slide="props.frame.previous"
          :width="props.frame.width"
          :height="props.frame.height"
          :transition-progress="props.frame.transitionProgress"
          transition-role="previous"
        />

        <SlideViewport
          :slide="props.frame.current"
          :width="props.frame.width"
          :height="props.frame.height"
          active
          :transition-progress="props.frame.isTransitioning ? props.frame.transitionProgress : 1"
          :transition-role="props.frame.isTransitioning ? 'current' : undefined"
        />
      </div>
    </div>
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
</style>
