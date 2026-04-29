import { describe, expect, it } from 'vitest'
import { findBuildListNode, findTimingNode, parseAnimations, parseTransition } from './animation'

describe('vendor animation parser', () => {
  it('parses transition orientation, duration and advance timing explicitly', () => {
    const transition = parseTransition({
      attrs: {
        spd: 'med',
        advTm: '6500',
        'p14:dur': '1500',
      },
      'p:pull': {
        attrs: {
          dir: 'l',
          orient: 'horz',
        },
      },
    })

    expect(transition).toEqual({
      type: 'uncover',
      duration: 1500,
      durationMs: 1500,
      direction: 'l',
      orientation: 'horz',
      advTm: 6500,
      advanceAfterMs: 6500,
      autoNextAfter: 6500,
    })
  })

  it('parses explicit timing and build list animations without regex fallback', () => {
    const slideContent = {
      'p:sld': {
        'p:timing': {
          'p:tnLst': {
            'p:par': {
              'p:cTn': {
                attrs: { id: '1', nodeType: 'tmRoot' },
                'p:childTnLst': {
                  'p:seq': {
                    'p:cTn': {
                      attrs: { id: '2', nodeType: 'mainSeq' },
                      'p:childTnLst': {
                        'p:par': [
                          {
                            'p:cTn': {
                              attrs: { id: '11', nodeType: 'clickEffect' },
                              'p:childTnLst': {
                                'p:set': {
                                  'p:cBhvr': {
                                    'p:cTn': { attrs: { dur: '500' } },
                                    'p:tgtEl': {
                                      'p:spTgt': {
                                        attrs: { spid: '7' },
                                        'p:txEl': {
                                          'p:pRg': { attrs: { st: '0', end: '0' } },
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                          {
                            'p:cTn': {
                              attrs: { id: '21', nodeType: 'withEffect' },
                              'p:childTnLst': {
                                'p:animEffect': {
                                  attrs: { filter: 'fade' },
                                  'p:cBhvr': {
                                    'p:cTn': { attrs: { dur: '600' } },
                                    'p:tgtEl': { 'p:spTgt': { attrs: { spid: '8' } } },
                                  },
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
        'p:bldLst': {
          'p:bldP': {
            attrs: { id: '41', spid: '7' },
            'p:txEl': { 'p:pRg': { attrs: { st: '1', end: '1' } } },
          },
        },
      },
    }

    const animations = parseAnimations(
      findTimingNode(slideContent, 'p:sld'),
      findBuildListNode(slideContent, 'p:sld'),
    )

    expect(animations).toEqual([
      {
        id: '11',
        trigger: 'onClick',
        durationMs: 500,
        effect: 'appear',
        targetElementId: '7',
        targetParagraphIndex: 0,
      },
      {
        id: '21',
        trigger: 'withPrevious',
        durationMs: 600,
        effect: 'fade',
        targetElementId: '8',
      },
      {
        id: '41',
        trigger: 'onClick',
        durationMs: 350,
        effect: 'fade',
        targetElementId: '7',
        targetParagraphIndex: 1,
      },
    ])
  })
})
