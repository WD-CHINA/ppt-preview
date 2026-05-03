import { describe, expect, it } from 'vitest'
import { createChartRenderModel } from './chartModel'
import type { NormalizedChartMeta } from '../../types/presentation'

describe('createChartRenderModel', () => {
  it('sorts series by order and maps point labels from categories', () => {
    const chart: NormalizedChartMeta = {
      chartType: 'barChart',
      title: 'Revenue',
      mode: 'categorical-multi',
      categories: ['Q1', 'Q2'],
      colors: ['#3366CC', '#DC3912'],
      series: [
        {
          key: 'Series 1',
          name: 'Series 1',
          order: '1',
          values: [10, 20],
          points: [
            { category: 'Q1', x: '0', y: 10 },
            { category: 'Q2', x: '1', y: 20 },
          ],
        },
        {
          key: 'Series 2',
          name: 'Series 2',
          order: '0',
          values: [30, 40],
          points: [
            { category: 'Q1', x: '0', y: 30 },
            { category: 'Q2', x: '1', y: 40 },
          ],
        },
      ],
      categoryAxis: {
        title: 'Quarter',
      },
      valueAxis: {
        title: 'Amount',
      },
    }

    const model = createChartRenderModel(chart)

    expect(model).toMatchObject({
      title: 'Revenue',
      typeLabel: 'Bar',
      subtitle: 'Multi-series · Quarter · Amount',
      legendItems: [
        { key: 'Series 2', label: 'Series 2', color: '#DC3912' },
        { key: 'Series 1', label: 'Series 1', color: '#3366CC' },
      ],
    })
    expect(model?.series[0]).toMatchObject({
      key: 'Series 2',
      total: 70,
      points: [
        { label: 'Q1', value: 30, widthRatio: 0.75 },
        { label: 'Q2', value: 40, widthRatio: 1 },
      ],
    })
    expect(model?.series[1]).toMatchObject({
      key: 'Series 1',
      total: 30,
      points: [
        { label: 'Q1', value: 10, widthRatio: 0.25 },
        { label: 'Q2', value: 20, widthRatio: 0.5 },
      ],
    })
    expect(model?.plot).toMatchObject({
      categoryAxisTitle: 'Quarter',
      valueAxisTitle: 'Amount',
      ticks: [
        { label: '0', y: 74 },
        { label: '10', y: 57.5 },
        { label: '20', y: 41 },
        { label: '30', y: 24.5 },
        { label: '40', y: 8 },
      ],
    })
    expect(model?.plot?.categories[0]).toMatchObject({
      label: 'Q1',
      bars: [
        { seriesKey: 'Series 2', value: 30, x: 17.46, y: 24.5, height: 49.5 },
        { seriesKey: 'Series 1', value: 10, x: 32.1, y: 57.5, height: 16.5 },
      ],
    })
    expect(model?.plot?.categories[1]).toMatchObject({
      label: 'Q2',
      bars: [
        { seriesKey: 'Series 2', value: 40, x: 56.46, y: 8, height: 66 },
        { seriesKey: 'Series 1', value: 20, x: 71.1, y: 41, height: 33 },
      ],
    })
  })

  it('builds pie slices from categorical-single series', () => {
    const chart: NormalizedChartMeta = {
      chartType: 'pieChart',
      title: 'Share',
      mode: 'categorical-single',
      categories: ['A', 'B'],
      colors: ['#3366CC', '#DC3912'],
      series: [
        {
          key: 'Share',
          name: 'Share',
          order: '0',
          values: [60, 40],
          points: [
            { category: 'A', x: '0', y: 60 },
            { category: 'B', x: '1', y: 40 },
          ],
        },
      ],
    }

    const model = createChartRenderModel(chart)

    expect(model?.piePlot?.total).toBe(100)
    expect(model?.piePlot?.slices).toHaveLength(2)
    expect(model?.piePlot?.slices[0]).toMatchObject({
      label: 'A',
      value: 60,
      color: '#3366CC',
    })
    expect(model?.piePlot?.slices[1]).toMatchObject({
      label: 'B',
      value: 40,
      color: '#DC3912',
    })
  })

  it('builds scatter plot coordinates from xy schema points', () => {
    const chart: NormalizedChartMeta = {
      chartType: 'scatterChart',
      title: 'Series XY',
      mode: 'xy',
      categories: [],
      colors: ['#3366CC'],
      series: [
        {
          key: 'Series XY',
          name: 'Series XY',
          order: '0',
          values: [],
          points: [
            { x: 1, y: 10 },
            { x: 2, y: 20 },
          ],
        },
      ],
    }

    const model = createChartRenderModel(chart)

    expect(model?.scatterPlot?.points).toHaveLength(2)
    expect(model?.scatterPlot?.points[0]).toMatchObject({
      label: 'Series XY',
      xValue: 1,
      yValue: 10,
      x: 12,
      y: 74,
      color: '#3366CC',
    })
    expect(model?.scatterPlot?.points[1]).toMatchObject({
      xValue: 2,
      yValue: 20,
      x: 90,
      y: 8,
    })
  })

  it('builds line plot geometry from categorical series', () => {
    const chart: NormalizedChartMeta = {
      chartType: 'lineChart',
      title: 'Trend',
      mode: 'categorical-multi',
      categories: ['Jan', 'Feb', 'Mar'],
      colors: ['#3366CC', '#DC3912'],
      series: [
        {
          key: 'North',
          name: 'North',
          order: '0',
          values: [10, 20, 15],
          points: [
            { category: 'Jan', x: '0', y: 10 },
            { category: 'Feb', x: '1', y: 20 },
            { category: 'Mar', x: '2', y: 15 },
          ],
        },
        {
          key: 'South',
          name: 'South',
          order: '1',
          values: [5, 12, 18],
          points: [
            { category: 'Jan', x: '0', y: 5 },
            { category: 'Feb', x: '1', y: 12 },
            { category: 'Mar', x: '2', y: 18 },
          ],
        },
      ],
      categoryAxis: {
        title: 'Month',
      },
      valueAxis: {
        title: 'Score',
      },
    }

    const model = createChartRenderModel(chart)

    expect(model?.linePlot?.xTicks).toMatchObject([
      { label: 'Jan', x: 12 },
      { label: 'Feb', x: 51 },
      { label: 'Mar', x: 90 },
    ])
    expect(model?.linePlot?.series[0]).toMatchObject({
      key: 'North',
      color: '#3366CC',
      linePath: 'M 12 52 L 51 8 L 90 30',
      points: [
        { label: 'Jan', value: 10, x: 12, y: 52 },
        { label: 'Feb', value: 20, x: 51, y: 8 },
        { label: 'Mar', value: 15, x: 90, y: 30 },
      ],
    })
  })

  it('builds filled area geometry for area charts', () => {
    const chart: NormalizedChartMeta = {
      chartType: 'areaChart',
      title: 'Coverage',
      mode: 'categorical-single',
      categories: ['Q1', 'Q2'],
      colors: ['#3366CC'],
      series: [
        {
          key: 'Coverage',
          name: 'Coverage',
          order: '0',
          values: [40, 60],
          points: [
            { category: 'Q1', x: '0', y: 40 },
            { category: 'Q2', x: '1', y: 60 },
          ],
        },
      ],
    }

    const model = createChartRenderModel(chart)

    expect(model?.linePlot?.series[0]).toMatchObject({
      linePath: 'M 12 74 L 90 8',
      areaPath: 'M 12 74 L 12 74 L 90 8 L 90 74 Z',
    })
  })
})
