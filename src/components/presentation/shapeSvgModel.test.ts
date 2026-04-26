import { describe, expect, it } from 'vitest'
import { getShapeSvgPaintModel } from './shapeSvgModel'

describe('shapeSvgModel', () => {
  it('uses background color as connector stroke when open line shapes have no border', () => {
    expect(
      getShapeSvgPaintModel({
        shapeType: 'straightConnector1',
        background: '#4472C4',
      }),
    ).toEqual({
      fill: 'none',
      stroke: '#4472C4',
      strokeWidth: 1,
    })
  })

  it('keeps explicit border stroke for connectors when present', () => {
    expect(
      getShapeSvgPaintModel({
        shapeType: 'straightConnector1',
        background: '#4472C4',
        border: '2px solid #111827',
      }),
    ).toEqual({
      fill: 'none',
      stroke: '#111827',
      strokeWidth: 2,
    })
  })

  it('keeps filled closed shapes using background fill and border stroke', () => {
    expect(
      getShapeSvgPaintModel({
        shapeType: 'custom',
        background: '#f59e0b',
        border: '3px solid #7c2d12',
      }),
    ).toEqual({
      fill: '#f59e0b',
      stroke: '#7c2d12',
      strokeWidth: 3,
    })
  })
})
