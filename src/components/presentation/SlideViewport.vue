<script setup lang="ts">
import { computed } from 'vue'
import ElementRenderer from './ElementRenderer.vue'
import type { EvaluatedSlideFrame } from '../../types/presentation'
import { getTransitionViewportStyle } from './transitionViewportModel'

const props = defineProps<{
  slide?: EvaluatedSlideFrame
  width: number
  height: number
  active?: boolean
  transitionProgress?: number
  transitionRole?: 'current' | 'previous'
  transitionType?: string
}>()

const viewportStyle = computed(() => {
  const base = {
    width: `${props.width}px`,
    height: `${props.height}px`,
    background:
      props.slide?.background.css ??
      (props.slide?.background.imageUrl
        ? `center / cover no-repeat url(${props.slide.background.imageUrl})`
        : props.slide?.background.color ?? '#ffffff'),
  }

  return {
    ...base,
    ...getTransitionViewportStyle({
      transitionType: props.transitionType,
      role: props.transitionRole,
      progress: props.transitionProgress,
      width: props.width,
      height: props.height,
    }),
  }
})
</script>

<template>
  <div v-if="props.slide" class="viewport" :class="{ 'viewport--active': props.active }" :style="viewportStyle">
    <ElementRenderer
      v-for="element in props.slide.elements"
      :key="element.id"
      :element="element"
    />
  </div>
</template>

<style scoped>
.viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 1.6rem;
  box-shadow: 0 40px 120px rgba(15, 23, 42, 0.28);
  transition: opacity 240ms ease, transform 240ms ease;
}

.viewport--active {
  z-index: 2;
}
</style>
