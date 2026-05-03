<script setup lang="ts">
import { computed } from 'vue'
import type { NormalizedChartMeta } from '../../types/presentation'
import { createChartRenderModel } from './chartModel'

const props = defineProps<{
  chart: NormalizedChartMeta
}>()

const model = computed(() => createChartRenderModel(props.chart))
</script>

<template>
  <div v-if="model" class="chart-renderer">
    <header class="chart-renderer__header">
      <div class="chart-renderer__heading">
        <p class="chart-renderer__eyebrow">{{ model.typeLabel }}</p>
        <h3 class="chart-renderer__title">{{ model.title }}</h3>
        <p v-if="model.subtitle" class="chart-renderer__subtitle">{{ model.subtitle }}</p>
      </div>

      <div v-if="model.legendItems.length" class="chart-renderer__legend">
        <span
          v-for="item in model.legendItems"
          :key="item.key"
          class="chart-renderer__legend-item"
        >
          <span class="chart-renderer__legend-swatch" :style="{ background: item.color ?? '#94a3b8' }"></span>
          {{ item.label }}
        </span>
      </div>
    </header>

    <div v-if="model.plot" class="chart-renderer__plot-shell">
      <svg class="chart-renderer__plot" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line
          class="chart-renderer__axis"
          :x1="model.plot.plotLeft"
          :x2="model.plot.plotLeft"
          :y1="model.plot.plotTop"
          :y2="model.plot.plotTop + model.plot.plotHeight"
        />
        <line
          class="chart-renderer__axis"
          :x1="model.plot.plotLeft"
          :x2="model.plot.plotLeft + model.plot.plotWidth"
          :y1="model.plot.plotTop + model.plot.plotHeight"
          :y2="model.plot.plotTop + model.plot.plotHeight"
        />

        <template v-for="tick in model.plot.ticks" :key="tick.key">
          <line
            class="chart-renderer__grid-line"
            :x1="model.plot.plotLeft"
            :x2="model.plot.plotLeft + model.plot.plotWidth"
            :y1="tick.y"
            :y2="tick.y"
          />
          <text class="chart-renderer__tick-label" :x="model.plot.plotLeft - 2" :y="tick.y + 1.2">{{ tick.label }}</text>
        </template>

        <g v-for="category in model.plot.categories" :key="category.key">
          <rect
            v-for="bar in category.bars"
            :key="bar.key"
            class="chart-renderer__bar"
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="bar.height"
            rx="1.4"
            :fill="bar.color ?? '#94a3b8'"
          />
          <text
            class="chart-renderer__category-label"
            :x="category.x + category.width / 2"
            :y="model.plot.plotTop + model.plot.plotHeight + 6"
          >
            {{ category.label }}
          </text>
        </g>

        <text
          v-if="model.plot.categoryAxisTitle"
          class="chart-renderer__axis-title"
          :x="model.plot.plotLeft + model.plot.plotWidth / 2"
          y="95"
        >
          {{ model.plot.categoryAxisTitle }}
        </text>
        <text
          v-if="model.plot.valueAxisTitle"
          class="chart-renderer__axis-title chart-renderer__axis-title--vertical"
          x="4"
          :y="model.plot.plotTop + model.plot.plotHeight / 2"
          transform="rotate(-90 4 41)"
        >
          {{ model.plot.valueAxisTitle }}
        </text>
      </svg>

      <div class="chart-renderer__bar-summary">
        <div
          v-for="series in model.series"
          :key="series.key"
          class="chart-renderer__bar-summary-item"
        >
          <div class="chart-renderer__series-name">
            <span class="chart-renderer__series-swatch" :style="{ background: series.color ?? '#94a3b8' }"></span>
            {{ series.name }}
          </div>
          <span class="chart-renderer__series-total">{{ series.total }}</span>
        </div>
      </div>
    </div>

    <div v-else-if="model.piePlot" class="chart-renderer__plot-shell">
      <svg class="chart-renderer__plot" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path
          v-for="slice in model.piePlot.slices"
          :key="slice.key"
          class="chart-renderer__pie-slice"
          :d="slice.path"
          :fill="slice.color ?? '#94a3b8'"
        />
        <text
          v-for="slice in model.piePlot.slices"
          :key="`${slice.key}-label`"
          class="chart-renderer__pie-label"
          :x="slice.labelX"
          :y="slice.labelY"
        >
          {{ slice.label }}
        </text>
      </svg>

      <div class="chart-renderer__bar-summary">
        <div
          v-for="slice in model.piePlot.slices"
          :key="`legend-${slice.key}`"
          class="chart-renderer__bar-summary-item"
        >
          <div class="chart-renderer__series-name">
            <span class="chart-renderer__series-swatch" :style="{ background: slice.color ?? '#94a3b8' }"></span>
            {{ slice.label }}
          </div>
          <span class="chart-renderer__series-total">{{ slice.value }}</span>
        </div>
      </div>
    </div>

    <div v-else-if="model.scatterPlot" class="chart-renderer__plot-shell">
      <svg class="chart-renderer__plot" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line
          class="chart-renderer__axis"
          :x1="model.scatterPlot.plotLeft"
          :x2="model.scatterPlot.plotLeft"
          :y1="model.scatterPlot.plotTop"
          :y2="model.scatterPlot.plotTop + model.scatterPlot.plotHeight"
        />
        <line
          class="chart-renderer__axis"
          :x1="model.scatterPlot.plotLeft"
          :x2="model.scatterPlot.plotLeft + model.scatterPlot.plotWidth"
          :y1="model.scatterPlot.plotTop + model.scatterPlot.plotHeight"
          :y2="model.scatterPlot.plotTop + model.scatterPlot.plotHeight"
        />

        <template v-for="tick in model.scatterPlot.yTicks" :key="tick.key">
          <line
            class="chart-renderer__grid-line"
            :x1="model.scatterPlot.plotLeft"
            :x2="model.scatterPlot.plotLeft + model.scatterPlot.plotWidth"
            :y1="tick.y"
            :y2="tick.y"
          />
          <text class="chart-renderer__tick-label" :x="model.scatterPlot.plotLeft - 2" :y="tick.y + 1.2">{{ tick.label }}</text>
        </template>

        <text
          v-for="tick in model.scatterPlot.xTicks"
          :key="tick.key"
          class="chart-renderer__category-label"
          :x="tick.x"
          :y="model.scatterPlot.plotTop + model.scatterPlot.plotHeight + 6"
        >
          {{ tick.label }}
        </text>

        <circle
          v-for="point in model.scatterPlot.points"
          :key="point.key"
          class="chart-renderer__scatter-point"
          :cx="point.x"
          :cy="point.y"
          r="2.2"
          :fill="point.color ?? '#94a3b8'"
        />
      </svg>

      <div class="chart-renderer__bar-summary">
        <div
          v-for="point in model.scatterPlot.points"
          :key="`point-${point.key}`"
          class="chart-renderer__bar-summary-item"
        >
          <div class="chart-renderer__series-name">
            <span class="chart-renderer__series-swatch" :style="{ background: point.color ?? '#94a3b8' }"></span>
            {{ point.label }}
          </div>
          <span class="chart-renderer__series-total">({{ point.xValue }}, {{ point.yValue }})</span>
        </div>
      </div>
    </div>

    <div v-else-if="model.linePlot" class="chart-renderer__plot-shell">
      <svg class="chart-renderer__plot" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line
          class="chart-renderer__axis"
          :x1="model.linePlot.plotLeft"
          :x2="model.linePlot.plotLeft"
          :y1="model.linePlot.plotTop"
          :y2="model.linePlot.plotTop + model.linePlot.plotHeight"
        />
        <line
          class="chart-renderer__axis"
          :x1="model.linePlot.plotLeft"
          :x2="model.linePlot.plotLeft + model.linePlot.plotWidth"
          :y1="model.linePlot.baselineY"
          :y2="model.linePlot.baselineY"
        />

        <template v-for="tick in model.linePlot.yTicks" :key="tick.key">
          <line
            class="chart-renderer__grid-line"
            :x1="model.linePlot.plotLeft"
            :x2="model.linePlot.plotLeft + model.linePlot.plotWidth"
            :y1="tick.y"
            :y2="tick.y"
          />
          <text class="chart-renderer__tick-label" :x="model.linePlot.plotLeft - 2" :y="tick.y + 1.2">{{ tick.label }}</text>
        </template>

        <path
          v-for="series in model.linePlot.series"
          :key="`${series.key}-area`"
          v-show="series.areaPath"
          class="chart-renderer__area"
          :d="series.areaPath"
          :fill="series.color ?? '#94a3b8'"
        />

        <path
          v-for="series in model.linePlot.series"
          :key="`${series.key}-line`"
          class="chart-renderer__line"
          :d="series.linePath"
          :stroke="series.color ?? '#94a3b8'"
        />

        <template v-for="series in model.linePlot.series" :key="series.key">
          <circle
            v-for="point in series.points"
            :key="point.key"
            class="chart-renderer__line-point"
            :cx="point.x"
            :cy="point.y"
            r="1.6"
            :fill="series.color ?? '#94a3b8'"
          />
        </template>

        <text
          v-for="tick in model.linePlot.xTicks"
          :key="tick.key"
          class="chart-renderer__category-label"
          :x="tick.x"
          :y="model.linePlot.plotTop + model.linePlot.plotHeight + 6"
        >
          {{ tick.label }}
        </text>

        <text
          v-if="model.linePlot.categoryAxisTitle"
          class="chart-renderer__axis-title"
          :x="model.linePlot.plotLeft + model.linePlot.plotWidth / 2"
          y="95"
        >
          {{ model.linePlot.categoryAxisTitle }}
        </text>
        <text
          v-if="model.linePlot.valueAxisTitle"
          class="chart-renderer__axis-title chart-renderer__axis-title--vertical"
          x="4"
          :y="model.linePlot.plotTop + model.linePlot.plotHeight / 2"
          transform="rotate(-90 4 41)"
        >
          {{ model.linePlot.valueAxisTitle }}
        </text>
      </svg>

      <div class="chart-renderer__bar-summary">
        <div
          v-for="series in model.linePlot.series"
          :key="`line-series-${series.key}`"
          class="chart-renderer__bar-summary-item"
        >
          <div class="chart-renderer__series-name">
            <span class="chart-renderer__series-swatch" :style="{ background: series.color ?? '#94a3b8' }"></span>
            {{ series.name }}
          </div>
          <span class="chart-renderer__series-total">
            {{ series.points.map((point) => point.value).join(' / ') }}
          </span>
        </div>
      </div>
    </div>

    <div v-else-if="model.series.length" class="chart-renderer__body">
      <section v-for="series in model.series" :key="series.key" class="chart-renderer__series">
        <div class="chart-renderer__series-header">
          <div class="chart-renderer__series-name">
            <span class="chart-renderer__series-swatch" :style="{ background: series.color ?? '#94a3b8' }"></span>
            {{ series.name }}
          </div>
          <span class="chart-renderer__series-total">{{ series.total }}</span>
        </div>

        <div class="chart-renderer__points">
          <div v-for="point in series.points" :key="point.key" class="chart-renderer__point">
            <span class="chart-renderer__point-label">{{ point.label }}</span>
            <div class="chart-renderer__point-track">
              <span
                class="chart-renderer__point-bar"
                :style="{ width: `${Math.max(point.widthRatio * 100, 6)}%`, background: series.color ?? '#94a3b8' }"
              ></span>
            </div>
            <span class="chart-renderer__point-value">{{ point.value }}</span>
          </div>
        </div>
      </section>
    </div>

    <div v-else class="chart-renderer__empty">No chart data</div>
  </div>
</template>

<style scoped>
.chart-renderer {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  box-sizing: border-box;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 1rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.96)),
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 45%);
  color: #0f172a;
}

.chart-renderer__header {
  display: grid;
  gap: 0.6rem;
}

.chart-renderer__heading,
.chart-renderer__legend,
.chart-renderer__series,
.chart-renderer__point,
.chart-renderer__series-header {
  display: grid;
}

.chart-renderer__eyebrow {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #475569;
}

.chart-renderer__title,
.chart-renderer__subtitle {
  margin: 0;
}

.chart-renderer__title {
  font-size: 1rem;
  font-weight: 700;
}

.chart-renderer__subtitle {
  font-size: 0.78rem;
  color: #64748b;
}

.chart-renderer__legend {
  grid-template-columns: repeat(auto-fit, minmax(7rem, max-content));
  gap: 0.45rem 0.75rem;
}

.chart-renderer__legend-item,
.chart-renderer__series-name {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.chart-renderer__legend-item {
  font-size: 0.74rem;
  color: #475569;
}

.chart-renderer__legend-swatch,
.chart-renderer__series-swatch {
  width: 0.72rem;
  height: 0.72rem;
  border-radius: 999px;
  flex: 0 0 auto;
}

.chart-renderer__body {
  min-height: 0;
  display: grid;
  align-content: start;
  gap: 0.65rem;
  overflow: auto;
}

.chart-renderer__plot-shell {
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 0.55rem;
}

.chart-renderer__plot {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: visible;
}

.chart-renderer__axis {
  stroke: rgba(51, 65, 85, 0.7);
  stroke-width: 0.55;
}

.chart-renderer__grid-line {
  stroke: rgba(148, 163, 184, 0.24);
  stroke-width: 0.35;
}

.chart-renderer__bar {
  filter: drop-shadow(0 6px 10px rgba(15, 23, 42, 0.08));
}

.chart-renderer__pie-slice,
.chart-renderer__scatter-point,
.chart-renderer__line-point {
  filter: drop-shadow(0 6px 10px rgba(15, 23, 42, 0.08));
}

.chart-renderer__line {
  fill: none;
  stroke-width: 1.1;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chart-renderer__area {
  opacity: 0.2;
}

.chart-renderer__tick-label,
.chart-renderer__category-label,
.chart-renderer__axis-title,
.chart-renderer__pie-label {
  fill: #475569;
  font-size: 3px;
}

.chart-renderer__tick-label {
  text-anchor: end;
  dominant-baseline: middle;
}

.chart-renderer__category-label,
.chart-renderer__axis-title {
  text-anchor: middle;
}

.chart-renderer__pie-label {
  text-anchor: middle;
  dominant-baseline: middle;
  fill: #0f172a;
  font-size: 2.8px;
  font-weight: 700;
}

.chart-renderer__axis-title--vertical {
  text-anchor: middle;
}

.chart-renderer__bar-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 0.45rem;
}

.chart-renderer__bar-summary-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.45rem;
  align-items: center;
  padding: 0.45rem 0.6rem;
  border-radius: 0.8rem;
  background: rgba(248, 250, 252, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.chart-renderer__series {
  gap: 0.45rem;
  padding: 0.7rem 0.75rem;
  border-radius: 0.85rem;
  background: rgba(248, 250, 252, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.chart-renderer__series-header {
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.5rem;
  align-items: center;
}

.chart-renderer__series-name,
.chart-renderer__series-total {
  font-size: 0.8rem;
}

.chart-renderer__series-name {
  font-weight: 600;
}

.chart-renderer__series-total {
  color: #475569;
}

.chart-renderer__points {
  display: grid;
  gap: 0.35rem;
}

.chart-renderer__point {
  grid-template-columns: minmax(0, 3.5rem) minmax(0, 1fr) auto;
  gap: 0.5rem;
  align-items: center;
}

.chart-renderer__point-label,
.chart-renderer__point-value {
  font-size: 0.72rem;
  color: #475569;
}

.chart-renderer__point-track {
  height: 0.45rem;
  border-radius: 999px;
  background: rgba(203, 213, 225, 0.55);
  overflow: hidden;
}

.chart-renderer__point-bar {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.chart-renderer__empty {
  display: grid;
  place-content: center;
  min-height: 100%;
  color: #64748b;
  font-size: 0.85rem;
}
</style>
