import { describe, expect, it } from 'vitest'
import type { RawPptxSlide } from '../types'
import { applySlideAnimationMetadata, extractSlideAnimationMetadata } from './slide-animations'

describe('slide animation enhancer', () => {
  it('extracts minimal click/with/after timing effects from slide xml', () => {
    const slideXml = `
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
        <p:timing>
          <p:tnLst>
            <p:par>
              <p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot">
                <p:childTnLst>
                  <p:seq concurrent="1" nextAc="seek">
                    <p:cTn id="2" dur="indefinite" nodeType="mainSeq">
                      <p:childTnLst>
                        <p:par>
                          <p:cTn id="11" fill="hold" nodeType="clickEffect">
                            <p:stCondLst><p:cond delay="0"/></p:stCondLst>
                            <p:childTnLst>
                              <p:set>
                                <p:cBhvr>
                                  <p:cTn id="12" dur="500" fill="hold"/>
                                  <p:tgtEl>
                                    <p:spTgt spid="7">
                                      <p:txEl><p:pRg st="0" end="0"/></p:txEl>
                                    </p:spTgt>
                                  </p:tgtEl>
                                </p:cBhvr>
                              </p:set>
                            </p:childTnLst>
                          </p:cTn>
                        </p:par>
                        <p:par>
                          <p:cTn id="21" fill="hold" nodeType="withEffect">
                            <p:stCondLst><p:cond delay="0"/></p:stCondLst>
                            <p:childTnLst>
                              <p:animEffect transition="in" filter="fade">
                                <p:cBhvr>
                                  <p:cTn id="22" dur="600" fill="hold"/>
                                  <p:tgtEl><p:spTgt spid="8"/></p:tgtEl>
                                </p:cBhvr>
                              </p:animEffect>
                            </p:childTnLst>
                          </p:cTn>
                        </p:par>
                        <p:par>
                          <p:cTn id="31" fill="hold" nodeType="afterEffect">
                            <p:stCondLst><p:cond delay="0"/></p:stCondLst>
                            <p:childTnLst>
                              <p:anim>
                                <p:cBhvr>
                                  <p:cTn id="32" dur="700" fill="hold"/>
                                  <p:tgtEl><p:spTgt spid="9"/></p:tgtEl>
                                </p:cBhvr>
                              </p:anim>
                            </p:childTnLst>
                          </p:cTn>
                        </p:par>
                      </p:childTnLst>
                    </p:cTn>
                  </p:seq>
                </p:childTnLst>
              </p:cTn>
            </p:par>
          </p:tnLst>
        </p:timing>
      </p:sld>
    `

    expect(extractSlideAnimationMetadata(slideXml)).toEqual([
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
        id: '31',
        trigger: 'afterPrevious',
        durationMs: 700,
        effect: 'fade',
        targetElementId: '9',
      },
    ])
  })

  it('extracts paragraph build list entries from bldLst blocks', () => {
    const slideXml = `
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
        <p:bldLst>
          <p:bldP id="41" spid="7">
            <p:txEl><p:pRg st="1" end="1"/></p:txEl>
          </p:bldP>
        </p:bldLst>
      </p:sld>
    `

    expect(extractSlideAnimationMetadata(slideXml)).toEqual([
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

  it('applies extracted slide animations onto raw slide metadata when parser omits them', () => {
    const slide: RawPptxSlide = {
      elements: [{ id: '7', type: 'text' }],
    }

    applySlideAnimationMetadata(slide, [
      {
        id: '11',
        trigger: 'onClick',
        durationMs: 500,
        effect: 'appear',
        targetElementId: '7',
      },
    ])

    expect(slide.animations).toEqual([
      {
        id: '11',
        trigger: 'onClick',
        durationMs: 500,
        effect: 'appear',
        targetElementId: '7',
      },
    ])
  })
})
