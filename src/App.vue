<script setup lang="ts">
import PresentationShell from './components/presentation/PresentationShell.vue'
import { usePresentationPlayer } from './composables/presentation/usePresentationPlayer'

const { model, runtime, frame, activeSlide, slideCount, canAdvance, isLoading, error, lastFileName, loadFile } =
  usePresentationPlayer()
</script>

<template>
  <PresentationShell
    :model="model"
    :runtime="runtime"
    :frame="frame"
    :active-slide="activeSlide"
    :slide-count="slideCount"
    :can-advance="canAdvance"
    :is-loading="isLoading"
    :error="error"
    :last-file-name="lastFileName"
    @load-file="loadFile"
  />
</template>
