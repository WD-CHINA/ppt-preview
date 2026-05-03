import { describe, expect, it } from 'vitest'
import { normalizePresentation } from './normalizePresentation'
import type { RawPptxDocument } from './types'

describe('normalizePresentation table elements', () => {
  it('normalizes pptxtojson table data, row heights, column widths, and cell spans', () => {
    const raw: RawPptxDocument = {
      slides: [
        {
          elements: [
            {
              type: 'table',
              id: 'table-1',
              left: 10,
              top: 20,
              width: 180,
              height: 60,
              rowHeights: [15, 30],
              colWidths: [45, 90],
              data: [
                [
                  {
                    text: '<p>Header</p>',
                    colSpan: 2,
                    fillColor: '#0f172a',
                    fontColor: '#ffffff',
                    fontFace: 'Aptos',
                    fontSize: 12,
                    fontBold: true,
                    fontItalic: true,
                    underline: true,
                    vAlign: 'mid',
                  },
                ],
                [
                  { text: 'A1', hMerge: 1 },
                  { text: 'B1', rowSpan: 2, vMerge: 1, borders: { bottom: { color: '#111827', width: 1 } } },
                ],
              ],
            },
          ],
        },
      ],
    }

    const table = normalizePresentation(raw).slides[0]?.elements[0]

    expect(table?.type).toBe('table')
    expect(table?.table).toEqual({
      rowHeights: [20, 40],
      colWidths: [60, 120],
      cells: [
        [
          {
            text: '<p>Header</p>',
            colSpan: 2,
            fillColor: '#0f172a',
            fontColor: '#ffffff',
            fontFamily: 'Aptos',
            fontSize: 16,
            fontBold: true,
            fontItalic: true,
            fontUnderline: true,
            vAlign: 'mid',
            borders: undefined,
          },
        ],
        [
          { text: 'A1', hMerge: 1, borders: undefined },
          { text: 'B1', rowSpan: 2, vMerge: 1, borders: { bottom: { color: '#111827', width: 1 } } },
        ],
      ],
    })
  })
})

describe('normalizePresentation chart and diagram elements', () => {
  it('normalizes chart schema and diagram summary metadata for renderer consumption', () => {
    const raw: RawPptxDocument = {
      slides: [
        {
          elements: [
            {
              type: 'chart',
              id: 'chart-1',
              title: 'Revenue',
              chartType: 'barChart',
              colors: ['#3366CC', '#DC3912'],
              schema: {
                mode: 'categorical-multi',
                categories: ['Q1', 'Q2'],
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
                ],
              },
              categoryAxis: {
                title: 'Quarter',
              },
              valueAxis: {
                title: 'Amount',
              },
            },
            {
              type: 'diagram',
              id: 'diagram-1',
              layoutKind: 'urn:microsoft.com/office/officeart/2005/8/layout/hierarchy1',
              textList: ['Root', 'Child A'],
              tree: [
                {
                  id: '0',
                  type: 'node',
                  text: 'Root',
                  children: [
                    {
                      id: '1',
                      type: 'node',
                      text: 'Child A',
                      children: [],
                    },
                  ],
                },
              ],
              nodes: [{ id: '0' }, { id: '1' }],
              relations: [{ id: 'r1' }],
              drawingTargets: [{ name: 'Root Shape' }],
              elements: [
                {
                  type: 'shape',
                  id: 'shape-1',
                  left: 0,
                  top: 0,
                  width: 60,
                  height: 30,
                  shapType: 'rect',
                },
              ],
            },
          ],
        },
      ],
    }

    const slide = normalizePresentation(raw).slides[0]
    const chart = slide?.elements.find((element) => element.type === 'chart')
    const diagram = slide?.elements.find((element) => element.type === 'diagram')

    expect(chart?.chart).toEqual({
      chartType: 'barChart',
      title: 'Revenue',
      mode: 'categorical-multi',
      categories: ['Q1', 'Q2'],
      legend: undefined,
      series: [
        {
          key: 'Series 1',
          name: 'Series 1',
          index: undefined,
          order: '1',
          values: [10, 20],
          points: [
            { category: 'Q1', x: '0', y: 10 },
            { category: 'Q2', x: '1', y: 20 },
          ],
          color: '#3366CC',
        },
      ],
      colors: ['#3366CC', '#DC3912'],
      barDirection: undefined,
      grouping: undefined,
      stacked: undefined,
      percentStacked: undefined,
      dataLabels: undefined,
      categoryAxis: {
        id: undefined,
        title: 'Quarter',
        orientation: undefined,
        reverseOrder: undefined,
        position: undefined,
        crosses: undefined,
        majorGridlines: undefined,
        minorGridlines: undefined,
      },
      valueAxis: {
        id: undefined,
        title: 'Amount',
        orientation: undefined,
        reverseOrder: undefined,
        position: undefined,
        crosses: undefined,
        majorGridlines: undefined,
        minorGridlines: undefined,
      },
    })
    expect(diagram?.diagram).toEqual({
      layoutKind: 'urn:microsoft.com/office/officeart/2005/8/layout/hierarchy1',
      tree: [
        {
          id: '0',
          type: 'node',
          text: 'Root',
          children: [
            { id: '1', type: 'node', text: 'Child A', children: [] },
          ],
        },
      ],
      textList: ['Root', 'Child A'],
      nodeCount: 2,
      relationCount: 1,
      drawingTargetNames: ['Root Shape'],
    })
    expect(diagram?.children).toHaveLength(1)
  })

  it('preserves numeric scatter x values during chart normalization', () => {
    const raw: RawPptxDocument = {
      slides: [
        {
          elements: [
            {
              type: 'chart',
              id: 'chart-scatter',
              chartType: 'scatterChart',
              colors: ['#3366CC'],
              schema: {
                mode: 'xy',
                series: [
                  {
                    key: 'Series XY',
                    name: 'Series XY',
                    order: '0',
                    points: [
                      { x: 1, y: 10 },
                      { x: 2, y: 20 },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ],
    }

    const chart = normalizePresentation(raw).slides[0]?.elements[0]

    expect(chart?.chart?.series[0]?.points).toEqual([
      { x: 1, y: 10 },
      { x: 2, y: 20 },
    ])
  })

  it('drops array-like style keys so Vue style patching stays safe', () => {
    const raw: RawPptxDocument = {
      slides: [
        {
          elements: [
            {
              type: 'chart',
              id: 'chart-style-safe',
              style: ['bad'] as unknown as Record<string, string>,
            },
          ],
        },
      ],
    }

    const chart = normalizePresentation(raw).slides[0]?.elements[0]

    expect(chart?.style).toMatchObject({
      position: 'absolute',
      overflow: 'hidden',
    })
    expect(Object.keys(chart?.style ?? {})).not.toContain('0')
  })
})

describe('normalizePresentation motion-path animations', () => {
  it('normalizes timing-derived element animations into the runtime animation model', () => {
    const raw: RawPptxDocument = {
      slides: [
        {
          elements: [
            {
              type: 'text',
              id: '7',
              left: 10,
              top: 20,
              width: 120,
              height: 40,
              text: 'Step 1',
            },
          ],
          animations: [
            {
              id: 'build-1',
              trigger: 'onClick',
              durationMs: 500,
              effect: 'appear',
              targetElementId: '7',
              targetParagraphIndex: 0,
            },
          ],
        },
      ],
    }

    const animation = normalizePresentation(raw).slides[0]?.animations[0]

    expect(animation).toMatchObject({
      id: 'build-1',
      trigger: 'onClick',
      durationMs: 500,
      effect: 'appear',
      targetElementIds: ['7'],
      targetParagraphIndex: 0,
    })
  })

  it('normalizes motion-path descriptors into the runtime animation model', () => {
    const raw: RawPptxDocument = {
      slides: [
        {
          elements: [
            {
              type: 'shape',
              id: 'line-1',
              left: 10,
              top: 20,
              width: 120,
              height: 8,
              path: 'M 0 4 L 120 4',
            },
          ],
          animations: [
            {
              id: 'move-line-1',
              trigger: 'afterPrevious',
              duration: 800,
              effect: 'fade',
              targetElementId: 'line-1',
              motionPath: {
                xFrom: 0,
                yFrom: 0,
                xTo: 48,
                yTo: -24,
                rotateFrom: 0,
                rotateTo: 12,
              },
            },
          ],
        },
      ],
    }

    const animation = normalizePresentation(raw).slides[0]?.animations[0]

    expect(animation).toMatchObject({
      id: 'move-line-1',
      trigger: 'afterPrevious',
      durationMs: 800,
      effect: 'fade',
      targetElementIds: ['line-1'],
      motionPath: {
        xFrom: 0,
        yFrom: 0,
        xTo: 48,
        yTo: -24,
        rotateFrom: 0,
        rotateTo: 12,
      },
    })
  })

  it('uses transition advance timing as autoplay fallback when pptxtojson omits autoplay metadata', () => {
    const raw: RawPptxDocument = {
      slides: [
        {
          transition: {
            type: 'push',
            direction: 'r',
            durationMs: 800,
            advTm: 6500,
          },
          elements: [],
        },
      ],
    }

    const slide = normalizePresentation(raw).slides[0]

    expect(slide?.transition).toEqual({ type: 'push', direction: 'r', durationMs: 800 })
    expect(slide?.autoplay).toEqual({ advanceOnClick: true, advanceAfterMs: 6500 })
  })
})
