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
