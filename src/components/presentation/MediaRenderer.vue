<script setup lang="ts">
import { computed, shallowRef, useTemplateRef, watch } from 'vue'
import type { CSSProperties } from 'vue'
import type { EvaluatedElementFrame } from '../../types/presentation'
import { syncMediaElementPlayback } from './mediaPlayback'
import { getMediaFallbackMode, getMediaPosterSource } from './mediaFallback'

const props = defineProps<{
  element: EvaluatedElementFrame
}>()

const mediaSource = computed(() => {
  const inlineBlob = typeof props.element.media?.blob === 'string' ? props.element.media.blob : ''
  return props.element.media?.objectUrl ?? inlineBlob ?? props.element.media?.src ?? ''
})

const mediaLoadFailed = shallowRef(false)
const mediaPosterSource = computed(() => getMediaPosterSource(props.element))
const mediaRenderMode = computed(() => getMediaFallbackMode(props.element, Boolean(mediaSource.value), mediaLoadFailed.value))
const mediaElementRef = useTemplateRef<HTMLMediaElement>('mediaElement')

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

function syncMediaPlayback() {
  syncMediaElementPlayback(mediaElementRef.value, props.element.mediaPlayback)
}

function handleMediaError() {
  mediaLoadFailed.value = true
}

watch(
  () => mediaSource.value,
  () => {
    mediaLoadFailed.value = false
  },
)

watch(
  () => [props.element.mediaPlayback, mediaSource.value],
  () => syncMediaPlayback(),
  { immediate: true, flush: 'post' },
)
</script>

<template>
  <img
    v-if="props.element.type === 'image' && mediaSource && mediaRenderMode === 'media'"
    class="element-media"
    :style="mediaStyle"
    :src="mediaSource"
    :alt="props.element.name"
    @error="handleMediaError"
  />

  <video
    v-else-if="props.element.type === 'video' && mediaSource && mediaRenderMode === 'media'"
    ref="mediaElement"
    class="element-media"
    :src="mediaSource"
    :poster="props.element.media?.poster"
    :muted="props.element.mediaPlayback?.muted ?? true"
    preload="metadata"
    controls
    @loadedmetadata="syncMediaPlayback"
    @error="handleMediaError"
  />

  <img
    v-else-if="props.element.type === 'video' && mediaRenderMode === 'poster' && mediaPosterSource"
    class="element-media"
    :src="mediaPosterSource"
    :alt="props.element.name"
  />

  <audio
    v-else-if="props.element.type === 'audio' && mediaSource && mediaRenderMode === 'media'"
    ref="mediaElement"
    class="element-audio"
    :src="mediaSource"
    preload="metadata"
    controls
    @loadedmetadata="syncMediaPlayback"
    @error="handleMediaError"
  />

  <img
    v-else-if="props.element.type === 'audio' && mediaRenderMode === 'poster' && mediaPosterSource"
    class="element-media"
    :src="mediaPosterSource"
    :alt="props.element.name"
  />

  <img
    v-else-if="props.element.type === 'math' && mediaSource && mediaRenderMode === 'media'"
    class="element-media"
    :style="mediaStyle"
    :src="mediaSource"
    :alt="props.element.name"
    @error="handleMediaError"
  />

  <div v-else class="element-placeholder">
    <span class="element-type">{{ props.element.type }}</span>
    <span class="element-name">{{ props.element.name }}</span>
  </div>
</template>
