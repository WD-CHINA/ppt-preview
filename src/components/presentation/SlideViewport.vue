<script setup lang="ts">
import { computed } from 'vue'
import ElementRenderer from './ElementRenderer.vue'
import type { EvaluatedSlideFrame } from '../../types/presentation'

const props = defineProps<{
  slide?: EvaluatedSlideFrame
  width: number
  height: number
  active?: boolean
  transitionProgress?: number
  transitionRole?: 'current' | 'previous'
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

  if (props.transitionRole === 'previous') {
    return {
      ...base,
      opacity: 1 - (props.transitionProgress ?? 1),
      transform: `scale(${1 - (props.transitionProgress ?? 1) * 0.02})`,
    }
  }

  if (props.transitionRole === 'current') {
    return {
      ...base,
      opacity: props.transitionProgress ?? 1,
      transform: `translateY(${(1 - (props.transitionProgress ?? 1)) * 18}px)`,
    }
  }

  return base
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
