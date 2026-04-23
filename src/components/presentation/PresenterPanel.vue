<script setup lang="ts">
import { computed } from 'vue'
import type { NormalizedPresentation, NormalizedSlide, PresentationRuntimeState } from '../../types/presentation'

const props = defineProps<{
  model: NormalizedPresentation
  activeSlide?: NormalizedSlide
  state: PresentationRuntimeState
}>()

const progressLabel = computed(() => {
  if (!props.activeSlide?.autoplay.advanceAfterMs) {
    return '无自动翻页'
  }

  const total = props.activeSlide.autoplay.advanceAfterMs
  const current = Math.min(props.state.slideElapsedMs, total)
  return `${Math.round((current / total) * 100)}%`
})
</script>

<template>
  <aside class="panel">
    <section class="panel-card">
      <div class="panel-label">当前页</div>
      <div class="panel-title">{{ props.activeSlide?.name ?? '暂无内容' }}</div>
      <div class="panel-note">{{ props.activeSlide?.note ?? '该页面没有备注。' }}</div>
    </section>

    <section class="panel-card">
      <div class="panel-label">播放遥测</div>
      <div class="metric-row">
        <span>页内时间</span>
        <strong>{{ Math.round(props.state.timelinePositionMs) }} ms</strong>
      </div>
      <div class="metric-row">
        <span>点击触发</span>
        <strong>{{ props.state.currentTriggerIndex }}</strong>
      </div>
      <div class="metric-row">
        <span>自动翻页进度</span>
        <strong>{{ progressLabel }}</strong>
      </div>
      <div class="metric-row">
        <span>字体数</span>
        <strong>{{ props.model.usedFonts.length }}</strong>
      </div>
    </section>

    <section class="panel-card">
      <div class="panel-label">主题色</div>
      <div class="color-grid">
        <div
          v-for="(color, key) in props.model.theme.colors"
          :key="key"
          class="color-chip"
        >
          <span class="color-swatch" :style="{ backgroundColor: color }"></span>
          <span class="color-name">{{ key }}</span>
        </div>
        <div v-if="Object.keys(props.model.theme.colors).length === 0" class="panel-note">未解析到主题色。</div>
      </div>
    </section>
  </aside>
</template>

<style scoped>
.panel {
  display: grid;
  gap: 1rem;
}

.panel-card {
  padding: 1.2rem;
  border-radius: 1.4rem;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 24px 60px rgba(148, 163, 184, 0.18);
}

.panel-label {
  margin-bottom: 0.6rem;
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.panel-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
}

.panel-note {
  margin-top: 0.7rem;
  color: #475569;
  line-height: 1.6;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  color: #334155;
}

.metric-row:last-child {
  border-bottom: 0;
}

.color-grid {
  display: grid;
  gap: 0.7rem;
}

.color-chip {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.color-swatch {
  width: 1rem;
  height: 1rem;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
}

.color-name {
  color: #334155;
}
</style>
