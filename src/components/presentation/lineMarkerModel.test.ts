import { describe, expect, it } from 'vitest'
import { createLineMarkerModel } from './lineMarkerModel'

describe('lineMarkerModel', () => {
  it('builds a triangle end marker with length/width-aware geometry', () => {
    expect(createLineMarkerModel({ type: 'triangle', width: 'lg', length: 'sm' }, 'end')).toMatchObject({
      markerWidth: 5,
      markerHeight: 9,
      refX: 5,
      refY: 4.5,
      orient: 'auto',
      path: 'M 0 0 L 5 4.5 L 0 9 z',
    })
  })

  it('builds a stealth start marker with a notched arrow path', () => {
    expect(createLineMarkerModel({ type: 'stealth', width: 'med', length: 'lg' }, 'start')).toMatchObject({
      markerWidth: 9,
      markerHeight: 7,
      refX: 9,
      refY: 3.5,
      orient: 'auto-start-reverse',
      path: 'M 0 0 L 9 3.5 L 0 7 L 2.7 3.5 z',
    })
  })

  it('builds an oval marker with ellipse-like geometry', () => {
    expect(createLineMarkerModel({ type: 'oval', width: 'sm', length: 'sm' }, 'end')).toMatchObject({
      markerWidth: 5,
      markerHeight: 5,
      refX: 2.5,
      refY: 2.5,
      path: 'M 2.5 0 A 2.5 2.5 0 1 1 2.499 0 z',
    })
  })
})
