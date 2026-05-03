import { readFile } from 'node:fs/promises'
import { beforeAll, describe, expect, it } from 'vitest'
import { parseWithPptxtojson } from '../../adapters/pptxtojson/parseWithPptxtojson'
import { normalizePresentation } from '../../adapters/pptxtojson/normalizePresentation'
import type { NormalizedPresentation } from '../../types/presentation'

const COMPLEX_FIXTURE_PATH = new URL('../../../public/chart-diagram-fixture.pptx', import.meta.url)

let model: NormalizedPresentation

beforeAll(async () => {
  const input = await readFile(COMPLEX_FIXTURE_PATH)
  const arrayBuffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)
  model = normalizePresentation(await parseWithPptxtojson(arrayBuffer))
})

describe('complex element fixture regression', () => {
  it('parses chart and diagram slides from the dedicated fixture', () => {
    expect(model.slides).toHaveLength(7)
    expect(model.slides[0]?.elements.some((element) => element.type === 'chart')).toBe(true)
    expect(model.slides[1]?.elements.some((element) => element.type === 'diagram')).toBe(true)
    expect(model.slides[2]?.elements.some((element) => element.type === 'chart')).toBe(true)
    expect(model.slides[3]?.elements.some((element) => element.type === 'chart')).toBe(true)
    expect(model.slides[4]?.elements.some((element) => element.type === 'chart')).toBe(true)
    expect(model.slides[5]?.elements.some((element) => element.type === 'chart')).toBe(true)
    expect(model.slides[6]?.elements.some((element) => element.type === 'diagram')).toBe(true)
  })

  it('stabilizes chart metadata for the first-pass chart renderer', () => {
    const chart = model.slides[0]?.elements.find((element) => element.type === 'chart')

    expect(chart?.chart).toMatchObject({
      chartType: 'barChart',
      title: 'Revenue',
      mode: 'categorical-multi',
      categories: ['Q1', 'Q2'],
      colors: ['#3366CC', '#DC3912'],
      legend: {
        position: 'r',
        overlay: false,
      },
    })
    expect(chart?.chart?.series).toHaveLength(2)
    expect(chart?.chart?.categoryAxis?.title).toBe('Quarter')
    expect(chart?.chart?.valueAxis?.title).toBe('Amount')
  })

  it('stabilizes diagram metadata and child shape propagation', () => {
    const diagram = model.slides[1]?.elements.find((element) => element.type === 'diagram')

    expect(diagram?.diagram).toEqual({
      layoutKind: 'urn:microsoft.com/office/officeart/2005/8/layout/hierarchy1',
      tree: [
        {
          id: '0',
          type: 'node',
          text: 'Root',
          children: [
            { id: '1', type: 'node', text: 'Child A', children: [] },
            { id: '2', type: 'node', text: 'Child B', children: [] },
          ],
        },
      ],
      textList: ['Root', 'Child A', 'Child B'],
      nodeCount: 3,
      relationCount: 2,
      drawingTargetNames: ['Root Shape'],
    })
    expect(diagram?.children).toHaveLength(1)
    expect(diagram?.children?.[0]).toMatchObject({
      type: 'text',
      name: 'Root Shape',
    })
  })

  it('stabilizes cycle diagram metadata from the later fixture slide', () => {
    const diagram = model.slides[6]?.elements.find((element) => element.type === 'diagram')

    expect(diagram?.diagram).toMatchObject({
      layoutKind: 'urn:microsoft.com/office/officeart/2005/8/layout/cycle1',
      textList: ['Plan', 'Build', 'Launch'],
      nodeCount: 3,
      relationCount: 2,
      drawingTargetNames: ['Plan Shape'],
    })
  })

  it('stabilizes pie, scatter, line, and area chart metadata from later fixture slides', () => {
    const pieChart = model.slides[2]?.elements.find((element) => element.type === 'chart')
    const scatterChart = model.slides[3]?.elements.find((element) => element.type === 'chart')
    const lineChart = model.slides[4]?.elements.find((element) => element.type === 'chart')
    const areaChart = model.slides[5]?.elements.find((element) => element.type === 'chart')

    expect(pieChart?.chart).toMatchObject({
      chartType: 'pieChart',
      title: 'Share',
      mode: 'categorical-single',
      categories: ['A', 'B'],
      colors: ['#3366CC', '#DC3912'],
    })
    expect(scatterChart?.chart).toMatchObject({
      chartType: 'scatterChart',
      title: 'Series XY',
      mode: 'xy',
      colors: ['#3366CC'],
    })
    expect(scatterChart?.chart?.series[0]?.points).toEqual([
      { x: 1, y: 10 },
      { x: 2, y: 20 },
    ])
    expect(lineChart?.chart).toMatchObject({
      chartType: 'lineChart',
      title: 'Trend',
      mode: 'categorical-multi',
      categories: ['Jan', 'Feb', 'Mar'],
      colors: ['#3366CC', '#DC3912'],
      categoryAxis: {
        title: 'Month',
      },
      valueAxis: {
        title: 'Score',
      },
    })
    expect(areaChart?.chart).toMatchObject({
      chartType: 'areaChart',
      title: 'Coverage',
      mode: 'categorical-multi',
      categories: ['Q1', 'Q2'],
      colors: ['#3366CC'],
    })
  })
})
