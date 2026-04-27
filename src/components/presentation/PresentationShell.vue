<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import PlaybackToolbar from './PlaybackToolbar.vue'
import PresentationStage from './PresentationStage.vue'
import PresenterPanel from './PresenterPanel.vue'
import type { PresentationRuntime } from '../../runtime/createPresentationRuntime'
import {
  executeInputCommand,
  getKeyboardInputCommand,
  getPointerInputCommand,
  getTouchInputCommand,
  type TouchInputDescriptor,
} from '../../runtime/input/inputEngine'
import type { NormalizedPresentation, NormalizedSlide, PresentationFrame } from '../../types/presentation'

const props = defineProps<{
  model: NormalizedPresentation
  runtime: PresentationRuntime
  frame: PresentationFrame
  activeSlide?: NormalizedSlide
  slideCount: number
  canAdvance: boolean
  isLoading: boolean
  error: string
  lastFileName: string
}>()

const emit = defineEmits<{
  loadFile: [file: File]
}>()

const fileInputRef = useTemplateRef<HTMLInputElement>('fileInput')

const statusText = computed(() => {
  if (props.isLoading) {
    return '正在解析 PPTX...'
  }

  if (props.error) {
    return props.error
  }

  if (props.lastFileName) {
    return `已加载 ${props.lastFileName}`
  }

  return '上传一个 .pptx 文件，系统会按 pptxtojson -> normalize -> runtime -> renderer 链路播放。'
})

function openFilePicker() {
  fileInputRef.value?.click()
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  emit('loadFile', file)
  input.value = ''
}

async function toggleFullscreen() {
  const root = document.documentElement

  if (!document.fullscreenElement) {
    await root.requestFullscreen()
    props.runtime.setFullscreen(true)
    return
  }

  await document.exitFullscreen()
  props.runtime.setFullscreen(false)
}

async function exitFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen()
  }
  props.runtime.setFullscreen(false)
}

function handleKeyboardInput(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  const command = getKeyboardInputCommand({
    key: event.key,
    code: event.code,
    targetTagName: target?.tagName,
    isContentEditable: target?.isContentEditable,
    altKey: event.altKey,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
  })

  if (command.preventDefault) {
    event.preventDefault()
  }
  executeInputCommand(props.runtime, command, { toggleFullscreen, exitFullscreen })
}

function handleStageClick(event: MouseEvent) {
  const command = getPointerInputCommand({ button: event.button })

  if (command.preventDefault) {
    event.preventDefault()
  }
  executeInputCommand(props.runtime, command, { toggleFullscreen, exitFullscreen })
}

function handleStageSwipe(touch: TouchInputDescriptor) {
  const command = getTouchInputCommand(touch)
  executeInputCommand(props.runtime, command, { toggleFullscreen, exitFullscreen })
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyboardInput)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyboardInput)
})
</script>

<template>
  <main class="shell">
    <section class="hero">
      <div class="hero-copy">
        <div class="hero-kicker">PPT Runtime Reconstruction</div>
        <h1 class="hero-title">把设计文档里的运行时分层，真正还原成可运行的 `ppt-preview` 项目。</h1>
        <p class="hero-description">
          现在仓库已经按解析适配层、标准化模型、播放 runtime、Evaluator 和 Vue 播放器 UI 串起来了。
        </p>
      </div>

      <div class="hero-actions">
        <input
          ref="fileInput"
          class="hero-input"
          type="file"
          accept=".pptx"
          @change="handleFileChange"
        />
        <button class="hero-button hero-button--primary" type="button" @click="openFilePicker">
          {{ props.isLoading ? '解析中...' : '上传 PPTX' }}
        </button>
        <button class="hero-button" type="button" @click="props.runtime.setLoopEnabled(!props.runtime.state.loopEnabled)">
          {{ props.runtime.state.loopEnabled ? '关闭循环' : '开启循环' }}
        </button>
        <select
          class="hero-select"
          :value="props.runtime.state.playbackRate"
          @change="props.runtime.setPlaybackRate(Number(($event.target as HTMLSelectElement).value))"
        >
          <option :value="0.5">0.5x</option>
          <option :value="1">1.0x</option>
          <option :value="1.25">1.25x</option>
          <option :value="1.5">1.5x</option>
          <option :value="2">2.0x</option>
        </select>
      </div>
    </section>

    <div class="status-banner" :class="{ 'status-banner--error': props.error }">
      {{ statusText }}
    </div>

    <PlaybackToolbar
      :runtime="props.runtime"
      :slide-count="props.slideCount"
      :can-advance="props.canAdvance"
      @fullscreen="toggleFullscreen"
    />

    <section class="workspace">
      <PresentationStage
        class="workspace-stage"
        :frame="props.frame"
        @stage-click="handleStageClick"
        @stage-swipe="handleStageSwipe"
      />
      <PresenterPanel
        v-if="props.runtime.state.presenterMode"
        class="workspace-panel"
        :model="props.model"
        :active-slide="props.activeSlide"
        :state="props.runtime.state"
      />
    </section>
  </main>
</template>

<style scoped>
.shell {
  display: grid;
  gap: 1.25rem;
  min-height: 100%;
  padding: 1.5rem;
}

.hero {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 2rem;
  background:
    radial-gradient(circle at top left, rgba(251, 146, 60, 0.26), transparent 28%),
    radial-gradient(circle at 85% 10%, rgba(14, 165, 233, 0.24), transparent 24%),
    linear-gradient(135deg, #fff7ed 0%, #f8fafc 42%, #eff6ff 100%);
  border: 1px solid rgba(251, 146, 60, 0.18);
}

.hero-copy {
  max-width: 50rem;
}

.hero-kicker {
  color: #c2410c;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 0.78rem;
  margin-bottom: 0.8rem;
}

.hero-title {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.6rem);
  line-height: 1;
  color: #111827;
}

.hero-description {
  margin: 0.9rem 0 0;
  max-width: 46rem;
  font-size: 1.05rem;
  line-height: 1.7;
  color: #475569;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.hero-input {
  display: none;
}

.hero-button,
.hero-select {
  min-height: 3rem;
  padding: 0.75rem 1.05rem;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #0f172a;
}

.hero-button {
  cursor: pointer;
}

.hero-button--primary {
  border-color: transparent;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: #fff7ed;
}

.status-banner {
  padding: 0.95rem 1.15rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.18);
  color: #334155;
}

.status-banner--error {
  color: #991b1b;
  border-color: rgba(239, 68, 68, 0.25);
  background: rgba(254, 242, 242, 0.9);
}

.workspace {
  display: grid;
  gap: 1rem;
  min-height: 0;
}

.workspace-stage {
  min-width: 0;
}

.workspace-panel {
  align-self: start;
}

@media (max-width: 1100px) {
  .workspace {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .shell {
    padding: 1rem;
  }

  .hero {
    padding: 1.2rem;
  }

  .hero-title {
    font-size: 2rem;
  }
}
</style>
