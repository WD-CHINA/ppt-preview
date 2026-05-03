import { describe, expect, it } from 'vitest'
import { getShapeSvgLayoutModel } from './shapeSvgLayout'

describe('shapeSvgLayout', () => {
  it('keeps regular closed shapes unchanged', () => {
    expect(
      getShapeSvgLayoutModel({
        shapeType: 'rect',
        boundsWidth: 120,
        boundsHeight: 80,
        viewBoxWidth: 90,
        viewBoxHeight: 60,
        strokeWidth: 3,
      }),
    ).toEqual({
      renderWidth: 120,
      renderHeight: 80,
      viewBoxWidth: 90,
      viewBoxHeight: 60,
      offsetX: 0,
      offsetY: 0,
      pathTransform: undefined,
    })
  })

  it('gives horizontal connectors a visible height when bounds height is zero', () => {
    expect(
      getShapeSvgLayoutModel({
        shapeType: 'straightConnector1',
        boundsWidth: 190.6141,
        boundsHeight: 0,
        viewBoxWidth: 142.9606,
        viewBoxHeight: 0,
        strokeWidth: 2,
      }),
    ).toEqual({
      renderWidth: 190.6141,
      renderHeight: 2,
      viewBoxWidth: 142.9606,
      viewBoxHeight: 2,
      offsetX: 0,
      offsetY: -1,
      pathTransform: 'translate(0 1)',
    })
  })

  it('gives vertical connectors a visible width when bounds width is zero', () => {
    expect(
      getShapeSvgLayoutModel({
        shapeType: 'straightConnector1',
        boundsWidth: 0,
        boundsHeight: 33.9843,
        viewBoxWidth: 0,
        viewBoxHeight: 25.4882,
        strokeWidth: 2,
      }),
    ).toEqual({
      renderWidth: 2,
      renderHeight: 33.9843,
      viewBoxWidth: 2,
      viewBoxHeight: 25.4882,
      offsetX: -1,
      offsetY: 0,
      pathTransform: 'translate(1 0)',
    })
  })
})
