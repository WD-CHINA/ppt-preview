<script setup lang="ts">
import { computed } from 'vue'
import type { PresentationRuntime } from '../../runtime/createPresentationRuntime'

const props = defineProps<{
  runtime: PresentationRuntime
  slideCount: number
  canAdvance: boolean
}>()

const emit = defineEmits<{
  fullscreen: []
}>()

const slideLabel = computed(() => `${props.runtime.state.activeSlideIndex + 1} / ${props.slideCount || 1}`)
const playLabel = computed(() => (props.runtime.state.sessionStatus === 'playing' ? '暂停' : '播放'))
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-group">
      <button class="toolbar-button" type="button" @click="props.runtime.previousSlide()">上一页</button>
      <button class="toolbar-button" type="button" @click="props.runtime.retreat()">上一步</button>
      <button class="toolbar-button toolbar-button--primary" type="button" @click="props.runtime.togglePlay()">
        {{ playLabel }}
      </button>
      <button class="toolbar-button" type="button" :disabled="!props.canAdvance" @click="props.runtime.advance()">
        下一步
      </button>
      <button class="toolbar-button" type="button" @click="props.runtime.nextSlide()">下一页</button>
    </div>

    <div class="toolbar-group toolbar-group--status">
      <span class="toolbar-pill">{{ slideLabel }}</span>
      <span class="toolbar-pill">状态 {{ props.runtime.state.sessionStatus }}</span>
      <span v-if="props.runtime.state.waitingTrigger" class="toolbar-pill">等待点击触发</span>
      <button class="toolbar-button" type="button" @click="props.runtime.setMuted(!props.runtime.state.isMuted)">
        {{ props.runtime.state.isMuted ? '取消静音' : '静音' }}
      </button>
      <button
        class="toolbar-button"
        type="button"
        @click="props.runtime.setPresenterMode(!props.runtime.state.presenterMode)"
      >
        {{ props.runtime.state.presenterMode ? '关闭备注' : '演讲者模式' }}
      </button>
      <button class="toolbar-button" type="button" @click="emit('fullscreen')">全屏</button>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 1.25rem;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(16px);
}

.toolbar-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
}

.toolbar-group--status {
  justify-content: flex-end;
}

.toolbar-button,
.toolbar-pill {
  min-height: 2.75rem;
  padding: 0.7rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(30, 41, 59, 0.9);
  color: #e2e8f0;
}

.toolbar-button {
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}

.toolbar-button:hover:enabled {
  transform: translateY(-1px);
  border-color: rgba(148, 163, 184, 0.45);
}

.toolbar-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.toolbar-button--primary {
  background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
  color: #fff7ed;
  border-color: transparent;
}

.toolbar-pill {
  display: inline-flex;
  align-items: center;
  font-size: 0.92rem;
}
</style>
