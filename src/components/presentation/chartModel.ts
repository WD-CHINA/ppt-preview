import type { NormalizedChartMeta, NormalizedChartPoint, NormalizedChartSeries } from '../../types/presentation'

export interface ChartRenderPoint {
  key: string
  label: string
  value: number
  widthRatio: number
}

export interface ChartRenderBar {
  key: string
  seriesKey: string
  seriesName: string
  color?: string
  value: number
  x: number
  y: number
  width: number
  height: number
}

export interface ChartRenderCategoryBand {
  key: string
  label: string
  x: number
  width: number
  bars: ChartRenderBar[]
}

export interface ChartRenderTick {
  key: string
  label: string
  value: number
  y: number
}

export interface ChartRenderPieSlice {
  key: string
  label: string
  value: number
  color?: string
  path: string
  labelX: number
  labelY: number
}

export interface ChartRenderPiePlot {
  slices: ChartRenderPieSlice[]
  total: number
  centerX: number
  centerY: number
  radius: number
}

export interface ChartRenderScatterPoint {
  key: string
  label: string
  xValue: number
  yValue: number
  x: number
  y: number
  color?: string
}

export interface ChartRenderScatterPlot {
  points: ChartRenderScatterPoint[]
  xTicks: Array<{ key: string; label: string; x: number }>
  yTicks: Array<{ key: string; label: string; y: number }>
  plotLeft: number
  plotTop: number
  plotWidth: number
  plotHeight: number
}

export interface ChartRenderLinePoint {
  key: string
  label: string
  value: number
  x: number
  y: number
}

export interface ChartRenderLineSeries {
  key: string
  name: string
  color?: string
  linePath: string
  areaPath?: string
  points: ChartRenderLinePoint[]
}

export interface ChartRenderLinePlot {
  series: ChartRenderLineSeries[]
  categoryAxisTitle?: string
  valueAxisTitle?: string
  xTicks: Array<{ key: string; label: string; x: number }>
  yTicks: Array<{ key: string; label: string; y: number }>
  plotLeft: number
  plotTop: number
  plotWidth: number
  plotHeight: number
  baselineY: number
}

export interface ChartRenderPlot {
  categoryAxisTitle?: string
  valueAxisTitle?: string
  categories: ChartRenderCategoryBand[]
  ticks: ChartRenderTick[]
  plotLeft: number
  plotTop: number
  plotWidth: number
  plotHeight: number
}

export interface ChartRenderSeries {
  key: string
  name: string
  color?: string
  total: number
  points: ChartRenderPoint[]
}

export interface ChartRenderModel {
  title: string
  typeLabel: string
  subtitle?: string
  legendItems: Array<{ key: string; label: string; color?: string }>
  series: ChartRenderSeries[]
  plot?: ChartRenderPlot
  piePlot?: ChartRenderPiePlot
  scatterPlot?: ChartRenderScatterPlot
  linePlot?: ChartRenderLinePlot
}

export function createChartRenderModel(chart?: NormalizedChartMeta): ChartRenderModel | undefined {
  if (!chart) {
    return undefined
  }

  const sortedSeries = [...chart.series].sort(compareChartSeriesOrder)
  const maxValue = Math.max(
    0,
    ...sortedSeries.flatMap((series) =>
      series.points.map((point) => Math.abs(point.y ?? 0)).concat(series.values.map((value) => Math.abs(value))),
    ),
  )

  return {
    title: chart.title ?? 'Chart',
    typeLabel: formatChartTypeLabel(chart.chartType),
    subtitle: buildChartSubtitle(chart),
    legendItems: sortedSeries.map((series) => ({
      key: series.key,
      label: series.name,
      color: resolveModelSeriesColor(chart, series),
    })),
    series: sortedSeries.map((series) => buildChartRenderSeries(series, chart, maxValue)),
    plot: createChartRenderPlot(chart, sortedSeries, maxValue),
    piePlot: createPieChartRenderPlot(chart, sortedSeries),
    scatterPlot: createScatterChartRenderPlot(chart, sortedSeries),
    linePlot: createLineChartRenderPlot(chart, sortedSeries),
  }
}

function buildChartRenderSeries(
  series: NormalizedChartSeries,
  chart: NormalizedChartMeta,
  maxValue: number,
): ChartRenderSeries {
  const sourcePoints: NormalizedChartPoint[] = series.points.length > 0
    ? series.points
    : series.values.map((value, index) => ({ y: value, x: String(index) }))
  const points = sourcePoints
    .map((point, pointIndex) => {
      const value = point.y ?? series.values[pointIndex] ?? 0
      const labelSource = point.category ?? chart.categories[pointIndex] ?? point.x ?? `Point ${pointIndex + 1}`

      return {
        key: `${series.key}-${pointIndex}`,
        label: String(labelSource),
        value,
        widthRatio: maxValue > 0 ? Math.abs(value) / maxValue : 0,
      }
    })

  return {
    key: series.key,
    name: series.name,
    color: resolveModelSeriesColor(chart, series),
    total: points.reduce((sum, point) => sum + point.value, 0),
    points,
  }
}

function resolveModelSeriesColor(chart: NormalizedChartMeta, series: NormalizedChartSeries) {
  if (series.color) {
    return series.color
  }

  const originalIndex = chart.series.findIndex((candidate) => candidate.key === series.key)
  return originalIndex >= 0 ? chart.colors[originalIndex] : undefined
}

function buildChartSubtitle(chart: NormalizedChartMeta) {
  const parts = [
    chart.mode ? formatChartModeLabel(chart.mode) : undefined,
    chart.categoryAxis?.title,
    chart.valueAxis?.title,
  ].filter((entry): entry is string => Boolean(entry))

  return parts.length > 0 ? parts.join(' · ') : undefined
}

function createChartRenderPlot(
  chart: NormalizedChartMeta,
  sortedSeries: NormalizedChartSeries[],
  maxValue: number,
): ChartRenderPlot | undefined {
  if (chart.chartType !== 'barChart' || chart.categories.length === 0 || sortedSeries.length === 0 || maxValue <= 0) {
    return undefined
  }

  const plotLeft = 12
  const plotTop = 8
  const plotWidth = 78
  const plotHeight = 66
  const groupWidth = plotWidth / chart.categories.length
  const innerGroupWidth = groupWidth * 0.72
  const groupOffset = (groupWidth - innerGroupWidth) / 2
  const barGap = Math.min(1.2, innerGroupWidth * 0.08)
  const barWidth = Math.max(3, (innerGroupWidth - barGap * Math.max(sortedSeries.length - 1, 0)) / sortedSeries.length)
  const tickCount = 4
  const tickStep = maxValue / tickCount

  return {
    categoryAxisTitle: chart.categoryAxis?.title,
    valueAxisTitle: chart.valueAxis?.title,
    categories: chart.categories.map((category, categoryIndex) => {
      const categoryX = plotLeft + groupWidth * categoryIndex

      return {
        key: `${category}-${categoryIndex}`,
        label: category,
        x: categoryX,
        width: groupWidth,
        bars: sortedSeries.map((series, seriesIndex) => {
          const point = series.points[categoryIndex]
          const value = point?.y ?? series.values[categoryIndex] ?? 0
          const height = maxValue > 0 ? (Math.abs(value) / maxValue) * plotHeight : 0

          return {
            key: `${series.key}-${categoryIndex}`,
            seriesKey: series.key,
            seriesName: series.name,
            color: resolveModelSeriesColor(chart, series),
            value,
            x: categoryX + groupOffset + seriesIndex * (barWidth + barGap),
            y: plotTop + plotHeight - height,
            width: barWidth,
            height,
          }
        }),
      }
    }),
    ticks: Array.from({ length: tickCount + 1 }, (_, index) => {
      const value = tickStep * index

      return {
        key: `tick-${index}`,
        label: formatTickLabel(value),
        value,
        y: plotTop + plotHeight - (value / maxValue) * plotHeight,
      }
    }),
    plotLeft,
    plotTop,
    plotWidth,
    plotHeight,
  }
}

function createPieChartRenderPlot(
  chart: NormalizedChartMeta,
  sortedSeries: NormalizedChartSeries[],
): ChartRenderPiePlot | undefined {
  if (chart.chartType !== 'pieChart' || sortedSeries.length === 0) {
    return undefined
  }

  const primarySeries = sortedSeries[0]
  if (!primarySeries) {
    return undefined
  }
  const points = primarySeries.points.length > 0
    ? primarySeries.points
    : primarySeries.values.map((value, index) => ({
        category: chart.categories[index] ?? `Slice ${index + 1}`,
        x: String(index),
        y: value,
      }))
  const total = points.reduce((sum, point, index) => sum + Math.abs(point.y ?? primarySeries.values[index] ?? 0), 0)

  if (total <= 0) {
    return undefined
  }

  const centerX = 50
  const centerY = 46
  const radius = 28
  let currentAngle = -Math.PI / 2

  return {
    total,
    centerX,
    centerY,
    radius,
    slices: points.map((point, index) => {
      const value = Math.abs(point.y ?? primarySeries.values[index] ?? 0)
      const angle = (value / total) * Math.PI * 2
      const startAngle = currentAngle
      const endAngle = currentAngle + angle
      currentAngle = endAngle
      const midAngle = startAngle + angle / 2

      return {
        key: `${primarySeries.key}-${index}`,
        label: point.category ?? chart.categories[index] ?? `Slice ${index + 1}`,
        value,
        color: chart.colors[index] ?? primarySeries.color,
        path: describePieSlice(centerX, centerY, radius, startAngle, endAngle),
        labelX: centerX + Math.cos(midAngle) * radius * 0.72,
        labelY: centerY + Math.sin(midAngle) * radius * 0.72,
      }
    }),
  }
}

function createScatterChartRenderPlot(
  chart: NormalizedChartMeta,
  sortedSeries: NormalizedChartSeries[],
): ChartRenderScatterPlot | undefined {
  if (chart.chartType !== 'scatterChart' || sortedSeries.length === 0) {
    return undefined
  }

  const sourcePoints: ChartRenderScatterPoint[] = []

  for (const series of sortedSeries) {
    for (const [index, point] of series.points.entries()) {
      const xValue = typeof point.x === 'number'
        ? point.x
        : typeof point.x === 'string'
          ? Number(point.x)
          : Number.NaN
      const yValue = point.y ?? series.values[index]

      if (!Number.isFinite(xValue) || !Number.isFinite(yValue)) {
        continue
      }

      const yNumeric = Number(yValue)

      sourcePoints.push({
        key: `${series.key}-${index}`,
        label: point.category ?? series.name,
        xValue,
        yValue: yNumeric,
        x: 0,
        y: 0,
        color: resolveModelSeriesColor(chart, series),
      })
    }
  }

  if (sourcePoints.length === 0) {
    return undefined
  }

  const plotLeft = 12
  const plotTop = 8
  const plotWidth = 78
  const plotHeight = 66
  const maxX = Math.max(...sourcePoints.map((point) => point.xValue))
  const minX = Math.min(...sourcePoints.map((point) => point.xValue))
  const maxY = Math.max(...sourcePoints.map((point) => point.yValue))
  const minY = Math.min(...sourcePoints.map((point) => point.yValue))
  const rangeX = maxX - minX || 1
  const rangeY = maxY - minY || 1
  const tickCount = 4

  return {
    plotLeft,
    plotTop,
    plotWidth,
    plotHeight,
    points: sourcePoints.map((point) => ({
      ...point,
      x: plotLeft + ((point.xValue - minX) / rangeX) * plotWidth,
      y: plotTop + plotHeight - ((point.yValue - minY) / rangeY) * plotHeight,
    })),
    xTicks: Array.from({ length: tickCount + 1 }, (_, index) => {
      const value = minX + (rangeX / tickCount) * index
      return {
        key: `x-${index}`,
        label: formatTickLabel(value),
        x: plotLeft + (plotWidth / tickCount) * index,
      }
    }),
    yTicks: Array.from({ length: tickCount + 1 }, (_, index) => {
      const value = minY + (rangeY / tickCount) * index
      return {
        key: `y-${index}`,
        label: formatTickLabel(value),
        y: plotTop + plotHeight - (plotHeight / tickCount) * index,
      }
    }),
  }
}

function createLineChartRenderPlot(
  chart: NormalizedChartMeta,
  sortedSeries: NormalizedChartSeries[],
): ChartRenderLinePlot | undefined {
  if ((chart.chartType !== 'lineChart' && chart.chartType !== 'areaChart') || chart.categories.length === 0 || sortedSeries.length === 0) {
    return undefined
  }

  const plotLeft = 12
  const plotTop = 8
  const plotWidth = 78
  const plotHeight = 66
  const baselineY = plotTop + plotHeight

  const sourceValues = sortedSeries.flatMap((series) =>
    chart.categories.map((_, categoryIndex) => series.points[categoryIndex]?.y ?? series.values[categoryIndex] ?? 0),
  )
  const maxValue = Math.max(...sourceValues)
  const minValue = Math.min(...sourceValues)
  const range = maxValue - minValue || 1
  const stepX = chart.categories.length > 1 ? plotWidth / (chart.categories.length - 1) : 0
  const tickCount = 4

  const series = sortedSeries.map((series) => {
    const points = chart.categories.map((category, categoryIndex) => {
      const value = series.points[categoryIndex]?.y ?? series.values[categoryIndex] ?? 0
      return {
        key: `${series.key}-${categoryIndex}`,
        label: category,
        value,
        x: plotLeft + stepX * categoryIndex,
        y: baselineY - ((value - minValue) / range) * plotHeight,
      }
    })

    return {
      key: series.key,
      name: series.name,
      color: resolveModelSeriesColor(chart, series),
      linePath: describeLinePath(points),
      areaPath: chart.chartType === 'areaChart' ? describeAreaPath(points, baselineY) : undefined,
      points,
    }
  })

  return {
    series,
    categoryAxisTitle: chart.categoryAxis?.title,
    valueAxisTitle: chart.valueAxis?.title,
    xTicks: chart.categories.map((category, index) => ({
      key: `x-${index}`,
      label: category,
      x: plotLeft + stepX * index,
    })),
    yTicks: Array.from({ length: tickCount + 1 }, (_, index) => {
      const value = minValue + (range / tickCount) * index
      return {
        key: `y-${index}`,
        label: formatTickLabel(value),
        y: baselineY - (plotHeight / tickCount) * index,
      }
    }),
    plotLeft,
    plotTop,
    plotWidth,
    plotHeight,
    baselineY,
  }
}

function compareChartSeriesOrder(left: NormalizedChartSeries, right: NormalizedChartSeries) {
  const leftOrder = parseChartOrder(left.order)
  const rightOrder = parseChartOrder(right.order)

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder
  }

  return left.name.localeCompare(right.name)
}

function parseChartOrder(value?: string) {
  const parsed = value ? Number(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER
}

function formatChartTypeLabel(input?: string) {
  if (!input) {
    return 'Chart'
  }

  return input
    .replace(/Chart$/u, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (letter) => letter.toUpperCase())
}

function formatChartModeLabel(input: string) {
  switch (input) {
    case 'categorical-multi':
      return 'Multi-series'
    case 'categorical-single':
      return 'Single-series'
    case 'xy':
      return 'XY plot'
    default:
      return input
  }
}

function formatTickLabel(value: number) {
  if (value >= 1000) {
    return `${Math.round(value / 100) / 10}k`
  }

  return Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10)
}

function describePieSlice(centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(centerX, centerY, radius, startAngle)
  const end = polarToCartesian(centerX, centerY, radius, endAngle)
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0

  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

function describeLinePath(points: ChartRenderLinePoint[]) {
  if (points.length === 0) {
    return ''
  }

  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
}

function describeAreaPath(points: ChartRenderLinePoint[], baselineY: number) {
  if (points.length === 0) {
    return ''
  }

  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]

  if (!firstPoint || !lastPoint) {
    return ''
  }

  return [
    `M ${firstPoint.x} ${baselineY}`,
    ...points.map((point, index) => `${index === 0 ? 'L' : 'L'} ${point.x} ${point.y}`),
    `L ${lastPoint.x} ${baselineY}`,
    'Z',
  ].join(' ')
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angle: number) {
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  }
}
