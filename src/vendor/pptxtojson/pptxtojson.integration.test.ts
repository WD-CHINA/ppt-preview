import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { parse } from './pptxtojson'

async function createMinimalPptx(slideXml: string) {
  const zip = new JSZip()

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
    <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
      <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
      <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
      <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
      <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
      <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
    </Types>`)

  zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8"?>
    <p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <p:sldSz cx="9144000" cy="6858000"/>
      <p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst>
      <p:defaultTextStyle/>
    </p:presentation>`)

  zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
    </Relationships>`)

  zip.file('ppt/slides/slide1.xml', slideXml)
  zip.file('ppt/slides/_rels/slide1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rIdLayout" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
      <Relationship Id="rIdImage" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/photo.png"/>
    </Relationships>`)

  zip.file('ppt/slideLayouts/slideLayout1.xml', `<?xml version="1.0" encoding="UTF-8"?>
    <p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
      <p:cSld><p:spTree/></p:cSld>
    </p:sldLayout>`)

  zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rIdMaster" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
    </Relationships>`)

  zip.file('ppt/slideMasters/slideMaster1.xml', `<?xml version="1.0" encoding="UTF-8"?>
    <p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
      <p:cSld><p:spTree/></p:cSld>
      <p:txStyles/>
    </p:sldMaster>`)

  zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
    </Relationships>`)

  zip.file('ppt/theme/theme1.xml', `<?xml version="1.0" encoding="UTF-8"?>
    <a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
      <a:themeElements>
        <a:clrScheme name="Office">
          <a:accent1><a:srgbClr val="FF0000"/></a:accent1>
          <a:accent2><a:srgbClr val="00FF00"/></a:accent2>
          <a:accent3><a:srgbClr val="0000FF"/></a:accent3>
          <a:accent4><a:srgbClr val="FFFF00"/></a:accent4>
          <a:accent5><a:srgbClr val="00FFFF"/></a:accent5>
          <a:accent6><a:srgbClr val="FF00FF"/></a:accent6>
        </a:clrScheme>
      </a:themeElements>
    </a:theme>`)

  zip.file('ppt/tableStyles.xml', `<?xml version="1.0" encoding="UTF-8"?><a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="tableStyleId"/>`)
  zip.file('ppt/media/photo.png', '<svg xmlns="http://www.w3.org/2000/svg"></svg>')

  return zip.generateAsync({ type: 'arraybuffer' })
}

describe('vendor pptxtojson integration', () => {
  it('emits explicit transition, animation, placeholder, inset, line marker, bullet, and mime metadata', async () => {
    const input = await createMinimalPptx(`<?xml version="1.0" encoding="UTF-8"?>
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main">
        <p:cSld>
          <p:spTree>
            <p:sp>
              <p:nvSpPr>
                <p:cNvPr id="2" name="Title 1"/>
                <p:cNvSpPr txBox="1"/>
                <p:nvPr><p:ph type="title" idx="1"/></p:nvPr>
              </p:nvSpPr>
              <p:spPr>
                <a:xfrm><a:off x="0" y="0"/><a:ext cx="1000000" cy="1000000"/></a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                <a:ln><a:headEnd type="triangle" w="med" len="med"/><a:tailEnd type="arrow" w="lg" len="sm"/></a:ln>
              </p:spPr>
              <p:txBody>
                <a:bodyPr vert="eaVert" lIns="91440" rIns="182880" tIns="45720" bIns="91440">
                  <a:normAutofit fontScale="85000" lnSpcReduction="20000"/>
                </a:bodyPr>
                <a:lstStyle/>
                <a:p>
                  <a:pPr lvl="1" marL="457200" indent="-228600">
                    <a:tabLst><a:tab pos="914400" algn="l"/></a:tabLst>
                    <a:buFont typeface="Wingdings"/>
                    <a:buChar char="ü"/>
                  </a:pPr>
                  <a:buFont typeface="Wingdings"/>
                  <a:buChar char="ü"/>
                  <a:r>
                    <a:rPr lang="en-US" altLang="ja-JP" sz="2400" i="1" u="sng" strike="sngStrike" spc="200" kern="1200" cap="small">
                      <a:highlight><a:srgbClr val="FFF59D"/></a:highlight>
                      <a:latin typeface="Aptos"/>
                    </a:rPr>
                    <a:t>hello</a:t>
                  </a:r>
                </a:p>
              </p:txBody>
            </p:sp>
            <p:pic>
              <p:nvPicPr>
                <p:cNvPr id="3" name="Picture 1"/>
                <p:cNvPicPr/>
                <p:nvPr/>
              </p:nvPicPr>
              <p:blipFill>
                <a:blip r:embed="rIdImage"/>
                <a:stretch><a:fillRect/></a:stretch>
              </p:blipFill>
              <p:spPr>
                <a:xfrm><a:off x="0" y="0"/><a:ext cx="1000000" cy="1000000"/></a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
              </p:spPr>
            </p:pic>
          </p:spTree>
        </p:cSld>
        <p:transition spd="med" advTm="6500" p14:dur="1500"><p:pull dir="l" orient="horz"/></p:transition>
        <p:timing>
          <p:tnLst>
            <p:par>
              <p:cTn id="1" nodeType="tmRoot">
                <p:childTnLst>
                  <p:seq>
                    <p:cTn id="2" nodeType="mainSeq">
                      <p:childTnLst>
                        <p:par>
                          <p:cTn id="11" nodeType="clickEffect">
                            <p:childTnLst>
                              <p:set>
                                <p:cBhvr>
                                  <p:cTn id="12" dur="500"/>
                                  <p:tgtEl><p:spTgt spid="2"><p:txEl><p:pRg st="0" end="0"/></p:txEl></p:spTgt></p:tgtEl>
                                </p:cBhvr>
                              </p:set>
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
        <p:bldLst>
          <p:bldP id="41" spid="2"><p:txEl><p:pRg st="1" end="1"/></p:txEl></p:bldP>
        </p:bldLst>
      </p:sld>`)

    const raw = await parse(input, { imageMode: 'both', videoMode: 'none', audioMode: 'none' }) as any
    const slide = raw.slides[0]
    const title = slide.elements.find((element: any) => element.name === 'Title 1')
    const image = slide.elements.find((element: any) => element.type === 'image')

    expect(slide.transition).toMatchObject({
      type: 'uncover',
      direction: 'l',
      orientation: 'horz',
      durationMs: 1500,
      advanceAfterMs: 6500,
    })
    expect(slide.autoplay).toEqual({ advanceOnClick: true, advanceAfterMs: 6500 })
    expect(slide.animations).toEqual([
      {
        id: '11',
        trigger: 'onClick',
        durationMs: 500,
        effect: 'appear',
        targetElementId: '2',
        targetParagraphIndex: 0,
      },
      {
        id: '41',
        trigger: 'onClick',
        durationMs: 350,
        effect: 'fade',
        targetElementId: '2',
        targetParagraphIndex: 1,
      },
    ])
    expect(title).toMatchObject({
      id: '2',
      placeholderType: 'title',
      placeholderIndex: 1,
      lineHeadEnd: { type: 'triangle', width: 'med', length: 'med' },
      lineTailEnd: { type: 'arrow', width: 'lg', length: 'sm' },
      textBodyInset: { left: 7.2, right: 14.4, top: 3.6, bottom: 7.2 },
      bulletMarkers: [{ char: 'ü', fontFace: 'Wingdings', level: 1, marginLeft: 36, indent: -18, hanging: 18, listType: 'ul' }],
      isVertical: true,
      verticalMode: 'eaVert',
      autoFit: {
        type: 'text',
        enabled: true,
        source: 'shape',
        fontScale: 85,
        lineSpacingReduction: 20,
      },
    })
    expect(title.content).toContain('margin-left: 36pt;')
    expect(title.content).toContain('text-indent: -18pt;')
    expect(title.content).toContain('font-family: Aptos;')
    expect(title.content).toContain('font-style: italic;')
    expect(title.content).toContain('text-decoration: underline;')
    expect(title.content).toContain('text-decoration-line: line-through;')
    expect(title.content).toContain('letter-spacing: 2pt;')
    expect(title.content).toContain('font-kerning: normal; --pptx-kern: 12pt;')
    expect(title.content).toContain('background-color: #FFF59D;')
    expect(title.content).toContain('font-variant-caps: small-caps;')
    expect(title.content).toContain('--pptx-lang: en-US;')
    expect(title.content).toContain('--pptx-script: ja-JP;')
    expect(title.content).toContain('--pptx-tab-stops: 72pt l;')
    expect(image).toMatchObject({ id: '3' })
    expect(typeof image.base64).toBe('string')
    expect(image.base64.startsWith('data:image/svg+xml;base64,')).toBe(true)
  })

  it('falls back to layout-level paragraph indent for list semantics', async () => {
    const zip = new JSZip()

    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
      <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
        <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
        <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
        <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
        <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
        <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
      </Types>`)
    zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <p:sldSz cx="9144000" cy="6858000"/>
        <p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst>
        <p:defaultTextStyle/>
      </p:presentation>`)
    zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
      </Relationships>`)
    zip.file('ppt/slides/slide1.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <p:cSld>
          <p:spTree>
            <p:sp>
              <p:nvSpPr>
                <p:cNvPr id="5" name="Body 1"/>
                <p:cNvSpPr txBox="1"/>
                <p:nvPr><p:ph type="body" idx="1"/></p:nvPr>
              </p:nvSpPr>
              <p:spPr>
                <a:xfrm><a:off x="0" y="0"/><a:ext cx="2000000" cy="1000000"/></a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
              </p:spPr>
              <p:txBody>
                <a:bodyPr/>
                <a:lstStyle/>
                <a:p>
                  <a:pPr lvl="0"><a:buChar char="•"/></a:pPr>
                  <a:r><a:t>fallback indent</a:t></a:r>
                </a:p>
              </p:txBody>
            </p:sp>
          </p:spTree>
        </p:cSld>
      </p:sld>`)
    zip.file('ppt/slides/_rels/slide1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rIdLayout" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
      </Relationships>`)
    zip.file('ppt/slideLayouts/slideLayout1.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <p:cSld>
          <p:spTree>
            <p:sp>
              <p:nvSpPr>
                <p:cNvPr id="10" name="Layout Body"/>
                <p:cNvSpPr txBox="1"/>
                <p:nvPr><p:ph type="body" idx="1"/></p:nvPr>
              </p:nvSpPr>
              <p:txBody>
                <a:bodyPr/>
                <a:lstStyle>
                  <a:lvl1pPr marL="342900" indent="-171450"/>
                </a:lstStyle>
              </p:txBody>
            </p:sp>
          </p:spTree>
        </p:cSld>
      </p:sldLayout>`)
    zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rIdMaster" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
      </Relationships>`)
    zip.file('ppt/slideMasters/slideMaster1.xml', `<?xml version="1.0" encoding="UTF-8"?><p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld><p:txStyles/></p:sldMaster>`)
    zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`)
    zip.file('ppt/theme/theme1.xml', `<?xml version="1.0" encoding="UTF-8"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:clrScheme name="Office"><a:accent1><a:srgbClr val="FF0000"/></a:accent1><a:accent2><a:srgbClr val="00FF00"/></a:accent2><a:accent3><a:srgbClr val="0000FF"/></a:accent3><a:accent4><a:srgbClr val="FFFF00"/></a:accent4><a:accent5><a:srgbClr val="00FFFF"/></a:accent5><a:accent6><a:srgbClr val="FF00FF"/></a:accent6></a:clrScheme></a:themeElements></a:theme>`)
    zip.file('ppt/tableStyles.xml', `<?xml version="1.0" encoding="UTF-8"?><a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="tableStyleId"/>`)

    const input = await zip.generateAsync({ type: 'arraybuffer' })
    const raw = await parse(input, { imageMode: 'none', videoMode: 'none', audioMode: 'none' }) as any
    const body = raw.slides[0]?.elements.find((element: any) => element.name === 'Body 1')

    expect(body?.content).toContain('margin-left: 27pt;')
    expect(body?.content).toContain('text-indent: -13.5pt;')
  })

  it('falls back to default paragraph defaults when local paragraph styles are absent', async () => {
    const zip = new JSZip()

    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
      <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
        <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
        <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
        <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
        <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
        <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
      </Types>`)
    zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <p:sldSz cx="9144000" cy="6858000"/>
        <p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst>
        <p:defaultTextStyle>
          <a:defPPr rtl="1" fontAlgn="base" defTabSz="457200"/>
        </p:defaultTextStyle>
      </p:presentation>`)
    zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
      </Relationships>`)
    zip.file('ppt/slides/slide1.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <p:cSld>
          <p:spTree>
            <p:sp>
              <p:nvSpPr>
                <p:cNvPr id="8" name="Default Paragraph Body"/>
                <p:cNvSpPr txBox="1"/>
                <p:nvPr/>
              </p:nvSpPr>
              <p:spPr>
                <a:xfrm><a:off x="0" y="0"/><a:ext cx="2000000" cy="1000000"/></a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
              </p:spPr>
              <p:txBody>
                <a:bodyPr/>
                <a:lstStyle/>
                <a:p>
                  <a:r><a:t>defaults</a:t></a:r>
                </a:p>
              </p:txBody>
            </p:sp>
          </p:spTree>
        </p:cSld>
      </p:sld>`)
    zip.file('ppt/slides/_rels/slide1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rIdLayout" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
      </Relationships>`)
    zip.file('ppt/slideLayouts/slideLayout1.xml', `<?xml version="1.0" encoding="UTF-8"?><p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld></p:sldLayout>`)
    zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdMaster" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`)
    zip.file('ppt/slideMasters/slideMaster1.xml', `<?xml version="1.0" encoding="UTF-8"?><p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld><p:txStyles/></p:sldMaster>`)
    zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`)
    zip.file('ppt/theme/theme1.xml', `<?xml version="1.0" encoding="UTF-8"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:clrScheme name="Office"><a:accent1><a:srgbClr val="FF0000"/></a:accent1><a:accent2><a:srgbClr val="00FF00"/></a:accent2><a:accent3><a:srgbClr val="0000FF"/></a:accent3><a:accent4><a:srgbClr val="FFFF00"/></a:accent4><a:accent5><a:srgbClr val="00FFFF"/></a:accent5><a:accent6><a:srgbClr val="FF00FF"/></a:accent6></a:clrScheme></a:themeElements></a:theme>`)
    zip.file('ppt/tableStyles.xml', `<?xml version="1.0" encoding="UTF-8"?><a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="tableStyleId"/>`)

    const input = await zip.generateAsync({ type: 'arraybuffer' })
    const raw = await parse(input, { imageMode: 'none', videoMode: 'none', audioMode: 'none' }) as any
    const body = raw.slides[0]?.elements.find((element: any) => element.name === 'Default Paragraph Body')

    expect(body?.content).toContain('direction: rtl;')
    expect(body?.content).toContain('--pptx-font-align: base;')
    expect(body?.content).toContain('--pptx-default-tab-size: 36pt;')
  })

  it('emits table cell padding and richer typography metadata', async () => {
    const input = await createMinimalPptx(`<?xml version="1.0" encoding="UTF-8"?>
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <p:cSld>
          <p:spTree>
            <p:graphicFrame>
              <p:nvGraphicFramePr>
                <p:cNvPr id="4" name="Table 1"/>
                <p:cNvGraphicFramePr/>
                <p:nvPr/>
              </p:nvGraphicFramePr>
              <p:xfrm>
                <a:off x="0" y="0"/>
                <a:ext cx="1828800" cy="914400"/>
              </p:xfrm>
              <a:graphic>
                <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
                  <a:tbl>
                    <a:tblPr firstRow="1" bandRow="1">
                      <a:tableStyleId>{00000000-0000-0000-0000-000000000000}</a:tableStyleId>
                    </a:tblPr>
                    <a:tblGrid>
                      <a:gridCol w="914400"/>
                      <a:gridCol w="914400"/>
                    </a:tblGrid>
                    <a:tr h="457200">
                      <a:tc>
                        <a:txBody>
                          <a:bodyPr/>
                          <a:lstStyle/>
                          <a:p>
                            <a:r>
                              <a:rPr lang="en-US" sz="1800" i="1" u="sng" strike="sngStrike" spc="150" cap="all">
                                <a:highlight><a:srgbClr val="FFF59D"/></a:highlight>
                                <a:latin typeface="Aptos"/>
                              </a:rPr>
                              <a:t>Header</a:t>
                            </a:r>
                          </a:p>
                        </a:txBody>
                        <a:tcPr marL="63500" marR="76200" marT="38100" marB="50800" anchor="ctr"/>
                      </a:tc>
                      <a:tc>
                        <a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>Value</a:t></a:r></a:p></a:txBody>
                        <a:tcPr/>
                      </a:tc>
                    </a:tr>
                  </a:tbl>
                </a:graphicData>
              </a:graphic>
            </p:graphicFrame>
          </p:spTree>
        </p:cSld>
      </p:sld>`)

    const raw = await parse(input, { imageMode: 'none', videoMode: 'none', audioMode: 'none' }) as any
    const slide = raw.slides[0]
    const table = slide.elements.find((element: any) => element.type === 'table')
    const cell = table?.data?.[0]?.[0]

    expect(table).toBeTruthy()
    expect(table?.colWidths).toEqual([72, 72])
    expect(cell).toMatchObject({
      vAlign: 'mid',
      marginLeft: 5,
      marginRight: 6,
      marginTop: 3,
      marginBottom: 4,
      fontFamily: 'Aptos',
      fontSize: 18,
      fontItalic: true,
      fontUnderline: true,
      fontStrike: true,
      letterSpacing: 1.5,
      highlightColor: '#FFF59D',
      textTransform: 'uppercase',
      lang: 'en-US',
    })
  })

  it('layers whole-table, row, column, and corner table styles in precedence order', async () => {
    const zip = new JSZip()

    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
      <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
        <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
        <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
        <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
        <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
        <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
      </Types>`)
    zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
        <p:sldSz cx="9144000" cy="6858000"/>
        <p:sldIdLst><p:sldId id="256" r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/></p:sldIdLst>
        <p:defaultTextStyle/>
      </p:presentation>`)
    zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
      </Relationships>`)
    zip.file('ppt/slides/slide1.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <p:cSld>
          <p:spTree>
            <p:graphicFrame>
              <p:nvGraphicFramePr>
                <p:cNvPr id="4" name="Table precedence"/>
                <p:cNvGraphicFramePr/>
                <p:nvPr/>
              </p:nvGraphicFramePr>
              <p:xfrm>
                <a:off x="0" y="0"/>
                <a:ext cx="1828800" cy="914400"/>
              </p:xfrm>
              <a:graphic>
                <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">
                  <a:tbl>
                    <a:tblPr firstRow="1" firstCol="1">
                      <a:tableStyleId>{11111111-1111-1111-1111-111111111111}</a:tableStyleId>
                    </a:tblPr>
                    <a:tblGrid>
                      <a:gridCol w="914400"/>
                      <a:gridCol w="914400"/>
                    </a:tblGrid>
                    <a:tr h="457200">
                      <a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>NW</a:t></a:r></a:p></a:txBody><a:tcPr/></a:tc>
                      <a:tc><a:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>NE</a:t></a:r></a:p></a:txBody><a:tcPr/></a:tc>
                    </a:tr>
                  </a:tbl>
                </a:graphicData>
              </a:graphic>
            </p:graphicFrame>
          </p:spTree>
        </p:cSld>
      </p:sld>`)
    zip.file('ppt/slides/_rels/slide1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rIdLayout" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
      </Relationships>`)
    zip.file('ppt/slideLayouts/slideLayout1.xml', `<?xml version="1.0" encoding="UTF-8"?><p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld></p:sldLayout>`)
    zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdMaster" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`)
    zip.file('ppt/slideMasters/slideMaster1.xml', `<?xml version="1.0" encoding="UTF-8"?><p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld><p:txStyles/></p:sldMaster>`)
    zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`)
    zip.file('ppt/theme/theme1.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <a:themeElements>
          <a:clrScheme name="Office">
            <a:dk1><a:srgbClr val="111111"/></a:dk1>
            <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
            <a:accent1><a:srgbClr val="FF0000"/></a:accent1>
            <a:accent2><a:srgbClr val="00FF00"/></a:accent2>
            <a:accent3><a:srgbClr val="0000FF"/></a:accent3>
            <a:accent4><a:srgbClr val="FFFF00"/></a:accent4>
            <a:accent5><a:srgbClr val="00FFFF"/></a:accent5>
            <a:accent6><a:srgbClr val="FF00FF"/></a:accent6>
          </a:clrScheme>
        </a:themeElements>
      </a:theme>`)
    zip.file('ppt/tableStyles.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{11111111-1111-1111-1111-111111111111}">
        <a:tblStyle styleId="{11111111-1111-1111-1111-111111111111}" styleName="Precedence">
          <a:wholeTbl>
            <a:tcStyle><a:fill><a:solidFill><a:srgbClr val="111111"/></a:solidFill></a:fill></a:tcStyle>
            <a:tcTxStyle><a:solidFill><a:srgbClr val="222222"/></a:solidFill></a:tcTxStyle>
          </a:wholeTbl>
          <a:firstRow>
            <a:tcStyle><a:fill><a:solidFill><a:srgbClr val="333333"/></a:solidFill></a:fill></a:tcStyle>
            <a:tcTxStyle b="on"><a:solidFill><a:srgbClr val="444444"/></a:solidFill></a:tcTxStyle>
          </a:firstRow>
          <a:firstCol>
            <a:tcStyle><a:fill><a:solidFill><a:srgbClr val="555555"/></a:solidFill></a:fill></a:tcStyle>
            <a:tcTxStyle i="on"><a:solidFill><a:srgbClr val="666666"/></a:solidFill></a:tcTxStyle>
          </a:firstCol>
          <a:nwCell>
            <a:tcStyle>
              <a:fill><a:solidFill><a:srgbClr val="777777"/></a:solidFill></a:fill>
              <a:tcBdr><a:bottom><a:ln w="12700"><a:solidFill><a:srgbClr val="888888"/></a:solidFill></a:ln></a:bottom></a:tcBdr>
            </a:tcStyle>
            <a:tcTxStyle><a:solidFill><a:srgbClr val="999999"/></a:solidFill></a:tcTxStyle>
          </a:nwCell>
        </a:tblStyle>
      </a:tblStyleLst>`)

    const input = await zip.generateAsync({ type: 'arraybuffer' })
    const raw = await parse(input, { imageMode: 'none', videoMode: 'none', audioMode: 'none' }) as any
    const table = raw.slides[0]?.elements.find((element: any) => element.type === 'table')
    const northWestCell = table?.data?.[0]?.[0]
    const northEastCell = table?.data?.[0]?.[1]

    expect(northWestCell).toMatchObject({
      fillColor: '#777777',
      fontColor: '#999999',
      fontBold: true,
      fontItalic: true,
      borders: {
        bottom: expect.objectContaining({ borderColor: '#888888' }),
      },
    })
    expect(northEastCell).toMatchObject({
      fillColor: '#333333',
      fontColor: '#444444',
      fontBold: true,
    })
    expect(northEastCell?.fontItalic).toBeUndefined()
  })

  it('emits chart title, legend, data labels, and axis metadata', async () => {
    const zip = new JSZip()

    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
      <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
        <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
        <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
        <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
        <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
        <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
        <Override PartName="/ppt/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>
      </Types>`)
    zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <p:sldSz cx="9144000" cy="6858000"/>
        <p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst>
        <p:defaultTextStyle/>
      </p:presentation>`)
    zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
      </Relationships>`)
    zip.file('ppt/slides/slide1.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart">
        <p:cSld>
          <p:spTree>
            <p:graphicFrame>
              <p:nvGraphicFramePr>
                <p:cNvPr id="9" name="Chart 1"/>
                <p:cNvGraphicFramePr/>
                <p:nvPr/>
              </p:nvGraphicFramePr>
              <p:xfrm>
                <a:off x="0" y="0"/>
                <a:ext cx="1828800" cy="914400"/>
              </p:xfrm>
              <a:graphic>
                <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
                  <c:chart r:id="rIdChart1"/>
                </a:graphicData>
              </a:graphic>
            </p:graphicFrame>
          </p:spTree>
        </p:cSld>
      </p:sld>`)
    zip.file('ppt/slides/_rels/slide1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rIdLayout" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
        <Relationship Id="rIdChart1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/>
      </Relationships>`)
    zip.file('ppt/slideLayouts/slideLayout1.xml', `<?xml version="1.0" encoding="UTF-8"?><p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld></p:sldLayout>`)
    zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdMaster" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`)
    zip.file('ppt/slideMasters/slideMaster1.xml', `<?xml version="1.0" encoding="UTF-8"?><p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld><p:txStyles/></p:sldMaster>`)
    zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`)
    zip.file('ppt/theme/theme1.xml', `<?xml version="1.0" encoding="UTF-8"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:clrScheme name="Office"><a:accent1><a:srgbClr val="FF0000"/></a:accent1><a:accent2><a:srgbClr val="00FF00"/></a:accent2><a:accent3><a:srgbClr val="0000FF"/></a:accent3><a:accent4><a:srgbClr val="FFFF00"/></a:accent4><a:accent5><a:srgbClr val="00FFFF"/></a:accent5><a:accent6><a:srgbClr val="FF00FF"/></a:accent6></a:clrScheme></a:themeElements></a:theme>`)
    zip.file('ppt/tableStyles.xml', `<?xml version="1.0" encoding="UTF-8"?><a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="tableStyleId"/>`)
    zip.file('ppt/charts/chart1.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <c:chart>
          <c:title>
            <c:tx>
              <c:rich>
                <a:bodyPr/>
                <a:lstStyle/>
                <a:p><a:r><a:t>Revenue</a:t></a:r></a:p>
              </c:rich>
            </c:tx>
          </c:title>
          <c:plotArea>
            <c:barChart>
              <c:barDir val="col"/>
              <c:grouping val="clustered"/>
              <c:varyColors val="1"/>
              <c:gapWidth val="219"/>
              <c:overlap val="-27"/>
              <c:ser>
                <c:idx val="0"/>
                <c:order val="1"/>
                <c:tx><c:strRef><c:strCache><c:pt idx="0"><c:v>Series 1</c:v></c:pt></c:strCache></c:strRef></c:tx>
                <c:cat><c:strRef><c:strCache><c:pt idx="0"><c:v>Q1</c:v></c:pt><c:pt idx="1"><c:v>Q2</c:v></c:pt></c:strCache></c:strRef></c:cat>
                <c:val><c:numRef><c:numCache><c:pt idx="0"><c:v>10</c:v></c:pt><c:pt idx="1"><c:v>20</c:v></c:pt></c:numCache></c:numRef></c:val>
                <c:spPr><a:solidFill><a:srgbClr val="3366CC"/></a:solidFill></c:spPr>
              </c:ser>
              <c:ser>
                <c:idx val="1"/>
                <c:order val="0"/>
                <c:tx><c:strRef><c:strCache><c:pt idx="0"><c:v>Series 2</c:v></c:pt></c:strCache></c:strRef></c:tx>
                <c:cat><c:strRef><c:strCache><c:pt idx="0"><c:v>Q1</c:v></c:pt><c:pt idx="1"><c:v>Q2</c:v></c:pt></c:strCache></c:strRef></c:cat>
                <c:val><c:numRef><c:numCache><c:pt idx="0"><c:v>30</c:v></c:pt><c:pt idx="1"><c:v>40</c:v></c:pt></c:numCache></c:numRef></c:val>
                <c:spPr><a:solidFill><a:srgbClr val="DC3912"/></a:solidFill></c:spPr>
              </c:ser>
              <c:dLbls>
                <c:dLblPos val="outEnd"/>
                <c:showVal val="1"/>
                <c:showCatName val="1"/>
              </c:dLbls>
            </c:barChart>
            <c:catAx>
              <c:axId val="10"/>
              <c:scaling><c:orientation val="maxMin"/></c:scaling>
              <c:axPos val="b"/>
              <c:crosses val="autoZero"/>
              <c:title>
                <c:tx>
                  <c:rich>
                    <a:bodyPr/>
                    <a:lstStyle/>
                    <a:p><a:r><a:t>Quarter</a:t></a:r></a:p>
                  </c:rich>
                </c:tx>
              </c:title>
              <c:majorGridlines/>
            </c:catAx>
            <c:valAx>
              <c:axId val="20"/>
              <c:scaling><c:orientation val="minMax"/></c:scaling>
              <c:axPos val="l"/>
              <c:title>
                <c:tx>
                  <c:rich>
                    <a:bodyPr/>
                    <a:lstStyle/>
                    <a:p><a:r><a:t>Amount</a:t></a:r></a:p>
                  </c:rich>
                </c:tx>
              </c:title>
              <c:minorGridlines/>
            </c:valAx>
          </c:plotArea>
          <c:legend>
            <c:legendPos val="r"/>
            <c:overlay val="0"/>
          </c:legend>
        </c:chart>
      </c:chartSpace>`)

    const input = await zip.generateAsync({ type: 'arraybuffer' })
    const raw = await parse(input, { imageMode: 'none', videoMode: 'none', audioMode: 'none' }) as any
    const chart = raw.slides[0]?.elements.find((element: any) => element.type === 'chart')

    expect(chart).toMatchObject({
      chartType: 'barChart',
      barDir: 'col',
      grouping: 'clustered',
      stacked: false,
      percentStacked: false,
      title: 'Revenue',
      legend: {
        position: 'r',
        overlay: false,
      },
      series: [
        {
          key: 'Series 1',
          name: 'Series 1',
          index: '0',
          order: '1',
        },
        {
          key: 'Series 2',
          name: 'Series 2',
          index: '1',
          order: '0',
        },
      ],
      seriesOrder: [
        {
          key: 'Series 1',
          order: '1',
        },
        {
          key: 'Series 2',
          order: '0',
        },
      ],
      schema: {
        mode: 'categorical-multi',
        categories: ['Q1', 'Q2'],
        series: [
          {
            key: 'Series 1',
            name: 'Series 1',
            index: '0',
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
            index: '1',
            order: '0',
            values: [30, 40],
            points: [
              { category: 'Q1', x: '0', y: 30 },
              { category: 'Q2', x: '1', y: 40 },
            ],
          },
        ],
      },
      semantics: {
        varyColors: true,
        gapWidth: '219',
        overlap: '-27',
      },
      dataLabels: {
        position: 'outEnd',
        showValue: true,
        showCategoryName: true,
      },
      categoryAxis: {
        id: '10',
        title: 'Quarter',
        orientation: 'maxMin',
        reverseOrder: true,
        position: 'b',
        crosses: 'autoZero',
        majorGridlines: true,
      },
      valueAxis: {
        id: '20',
        title: 'Amount',
        orientation: 'minMax',
        position: 'l',
        minorGridlines: true,
      },
    })
    expect(chart?.colors).toEqual(['#3366CC', '#DC3912'])
    expect(chart?.data).toEqual([
      {
        key: 'Series 1',
        values: [
          { x: '0', y: 10 },
          { x: '1', y: 20 },
        ],
        xlabels: {
          '0': 'Q1',
          '1': 'Q2',
        },
      },
      {
        key: 'Series 2',
        values: [
          { x: '0', y: 30 },
          { x: '1', y: 40 },
        ],
        xlabels: {
          '0': 'Q1',
          '1': 'Q2',
        },
      },
    ])
  })

  it('emits SmartArt layout kind, nodes, relations, and tree metadata', async () => {
    const zip = new JSZip()

    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
      <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
        <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
        <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
        <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
        <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
        <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
        <Override PartName="/ppt/diagrams/data1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.diagramData+xml"/>
        <Override PartName="/ppt/diagrams/layout1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.diagramLayout+xml"/>
        <Override PartName="/ppt/diagrams/colors1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.diagramColors+xml"/>
        <Override PartName="/ppt/diagrams/quickStyle1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.diagramStyle+xml"/>
        <Override PartName="/ppt/diagrams/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.diagramDrawing+xml"/>
      </Types>`)

    zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <p:sldSz cx="9144000" cy="6858000"/>
        <p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst>
        <p:defaultTextStyle/>
      </p:presentation>`)
    zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
      </Relationships>`)
    zip.file('ppt/slides/slide1.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram">
        <p:cSld>
          <p:spTree>
            <p:graphicFrame>
              <p:nvGraphicFramePr>
                <p:cNvPr id="7" name="SmartArt 1"/>
                <p:cNvGraphicFramePr/>
                <p:nvPr/>
              </p:nvGraphicFramePr>
              <p:xfrm>
                <a:off x="0" y="0"/>
                <a:ext cx="3657600" cy="2743200"/>
              </p:xfrm>
              <a:graphic>
                <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/diagram">
                  <dgm:relIds r:dm="rIdDm" r:lo="rIdLo" r:qs="rIdQs" r:cs="rIdCs"/>
                </a:graphicData>
              </a:graphic>
            </p:graphicFrame>
          </p:spTree>
        </p:cSld>
      </p:sld>`)
    zip.file('ppt/slides/_rels/slide1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?>
      <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
        <Relationship Id="rIdLayout" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
        <Relationship Id="rIdDm" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramData" Target="../diagrams/data1.xml"/>
        <Relationship Id="rIdLo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramLayout" Target="../diagrams/layout1.xml"/>
        <Relationship Id="rIdQs" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramQuickStyle" Target="../diagrams/quickStyle1.xml"/>
        <Relationship Id="rIdCs" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/diagramColors" Target="../diagrams/colors1.xml"/>
        <Relationship Id="rIdDrawing" Type="http://schemas.microsoft.com/office/2007/relationships/diagramDrawing" Target="../diagrams/drawing1.xml"/>
      </Relationships>`)
    zip.file('ppt/slideLayouts/slideLayout1.xml', `<?xml version="1.0" encoding="UTF-8"?><p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld></p:sldLayout>`)
    zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdMaster" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`)
    zip.file('ppt/slideMasters/slideMaster1.xml', `<?xml version="1.0" encoding="UTF-8"?><p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld><p:txStyles/></p:sldMaster>`)
    zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`)
    zip.file('ppt/theme/theme1.xml', `<?xml version="1.0" encoding="UTF-8"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:clrScheme name="Office"><a:accent1><a:srgbClr val="FF0000"/></a:accent1><a:accent2><a:srgbClr val="00FF00"/></a:accent2><a:accent3><a:srgbClr val="0000FF"/></a:accent3><a:accent4><a:srgbClr val="FFFF00"/></a:accent4><a:accent5><a:srgbClr val="00FFFF"/></a:accent5><a:accent6><a:srgbClr val="FF00FF"/></a:accent6></a:clrScheme></a:themeElements></a:theme>`)
    zip.file('ppt/tableStyles.xml', `<?xml version="1.0" encoding="UTF-8"?><a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="tableStyleId"/>`)
    zip.file('ppt/diagrams/layout1.xml', `<?xml version="1.0" encoding="UTF-8"?><dgm:layoutDef xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram" uniqueId="urn:microsoft.com/office/officeart/2005/8/layout/hierarchy1" title="Hierarchy"/>`)
    zip.file('ppt/diagrams/quickStyle1.xml', `<?xml version="1.0" encoding="UTF-8"?><dgm:styleDef xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram"/>`)
    zip.file('ppt/diagrams/colors1.xml', `<?xml version="1.0" encoding="UTF-8"?><dgm:colorsDef xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram"/>`)
    zip.file('ppt/diagrams/data1.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <dgm:dataModel xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:dsp="http://schemas.microsoft.com/office/drawing/2008/diagram">
        <dgm:ptLst>
          <dgm:pt modelId="0" type="node"><dgm:prSet presAssocID="root-assoc"/><dgm:t><a:p><a:r><a:t>Root</a:t></a:r></a:p></dgm:t></dgm:pt>
          <dgm:pt modelId="1" type="node"><dgm:t><a:p><a:r><a:t>Child A</a:t></a:r></a:p></dgm:t></dgm:pt>
          <dgm:pt modelId="2" type="node"><dgm:t><a:p><a:r><a:t>Child B</a:t></a:r></a:p></dgm:t></dgm:pt>
        </dgm:ptLst>
        <dgm:cxnLst>
          <dgm:cxn modelId="c1" type="parOf" srcId="0" destId="1" srcOrd="0" destOrd="0"/>
          <dgm:cxn modelId="c2" type="parOf" srcId="0" destId="2" srcOrd="0" destOrd="1"/>
        </dgm:cxnLst>
        <dgm:extLst>
          <a:ext uri="{4A6487B3-C4C0-4C67-BD6F-9E1B8C542F47}">
            <dsp:dataModelExt relId="rIdDrawing"/>
          </a:ext>
        </dgm:extLst>
      </dgm:dataModel>`)
    zip.file('ppt/diagrams/drawing1.xml', `<?xml version="1.0" encoding="UTF-8"?>
      <dsp:drawing xmlns:dsp="http://schemas.microsoft.com/office/drawing/2008/diagram" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
        <dsp:spTree>
          <dsp:sp>
              <p:nvSpPr>
                <p:cNvPr id="10" name="Root Shape"/>
                <p:cNvSpPr/>
                <p:nvPr>
                  <p:extLst>
                    <a:ext uri="{smartart-node}">
                      <dsp:spPr modelId="0" presAssocID="root-assoc"/>
                    </a:ext>
                  </p:extLst>
                </p:nvPr>
              </p:nvSpPr>
              <p:spPr>
              <a:xfrm><a:off x="0" y="0"/><a:ext cx="1000000" cy="500000"/></a:xfrm>
              <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
            </p:spPr>
            <p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:t>Root</a:t></a:r></a:p></p:txBody>
          </dsp:sp>
        </dsp:spTree>
      </dsp:drawing>`)
    zip.file('ppt/diagrams/_rels/drawing1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`)

    const input = await zip.generateAsync({ type: 'arraybuffer' })
    const raw = await parse(input, { imageMode: 'none', videoMode: 'none', audioMode: 'none' }) as any
    const diagram = raw.slides[0]?.elements.find((element: any) => element.type === 'diagram')

    expect(diagram).toMatchObject({
      type: 'diagram',
      layoutKind: 'urn:microsoft.com/office/officeart/2005/8/layout/hierarchy1',
      textList: ['Root', 'Child A', 'Child B'],
      nodes: [
        {
          id: '0',
          type: 'node',
          text: 'Root',
          presentationId: 'root-assoc',
          visualTargetId: '10',
          visualTarget: {
            shapeId: '10',
            name: 'Root Shape',
            modelId: '0',
            presentationId: 'root-assoc',
            text: 'Root',
          },
        },
        { id: '1', type: 'node', text: 'Child A' },
        { id: '2', type: 'node', text: 'Child B' },
      ],
      relations: [
        { id: 'c1', type: 'parOf', sourceId: '0', targetId: '1', sourceOrder: '0', targetOrder: '0' },
        { id: 'c2', type: 'parOf', sourceId: '0', targetId: '2', sourceOrder: '0', targetOrder: '1' },
      ],
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
      drawingTargets: [
        { shapeId: '10', name: 'Root Shape' },
      ],
      smartArt: {
        layoutKind: 'urn:microsoft.com/office/officeart/2005/8/layout/hierarchy1',
      },
    })
    expect(diagram?.elements).toHaveLength(1)
  })

  it('emits scatter chart xy schema metadata', async () => {
    const zip = new JSZip()

    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
      <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
        <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
        <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
        <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
        <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
        <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
        <Override PartName="/ppt/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>
      </Types>`)
    zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldSz cx="9144000" cy="6858000"/><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst><p:defaultTextStyle/></p:presentation>`)
    zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/></Relationships>`)
    zip.file('ppt/slides/slide1.xml', `<?xml version="1.0" encoding="UTF-8"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"><p:cSld><p:spTree><p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="11" name="Scatter 1"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="0" y="0"/><a:ext cx="1828800" cy="914400"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart r:id="rIdChart1"/></a:graphicData></a:graphic></p:graphicFrame></p:spTree></p:cSld></p:sld>`)
    zip.file('ppt/slides/_rels/slide1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdLayout" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rIdChart1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/></Relationships>`)
    zip.file('ppt/slideLayouts/slideLayout1.xml', `<?xml version="1.0" encoding="UTF-8"?><p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld></p:sldLayout>`)
    zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdMaster" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`)
    zip.file('ppt/slideMasters/slideMaster1.xml', `<?xml version="1.0" encoding="UTF-8"?><p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld><p:txStyles/></p:sldMaster>`)
    zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`)
    zip.file('ppt/theme/theme1.xml', `<?xml version="1.0" encoding="UTF-8"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:clrScheme name="Office"><a:accent1><a:srgbClr val="3366CC"/></a:accent1><a:accent2><a:srgbClr val="DC3912"/></a:accent2><a:accent3><a:srgbClr val="0000FF"/></a:accent3><a:accent4><a:srgbClr val="FFFF00"/></a:accent4><a:accent5><a:srgbClr val="00FFFF"/></a:accent5><a:accent6><a:srgbClr val="FF00FF"/></a:accent6></a:clrScheme></a:themeElements></a:theme>`)
    zip.file('ppt/tableStyles.xml', `<?xml version="1.0" encoding="UTF-8"?><a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="tableStyleId"/>`)
    zip.file('ppt/charts/chart1.xml', `<?xml version="1.0" encoding="UTF-8"?><c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><c:chart><c:plotArea><c:scatterChart><c:scatterStyle val="lineMarker"/><c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:strRef><c:strCache><c:pt idx="0"><c:v>Series XY</c:v></c:pt></c:strCache></c:strRef></c:tx><c:xVal><c:numRef><c:numCache><c:pt idx="0"><c:v>1</c:v></c:pt><c:pt idx="1"><c:v>2</c:v></c:pt></c:numCache></c:numRef></c:xVal><c:yVal><c:numRef><c:numCache><c:pt idx="0"><c:v>10</c:v></c:pt><c:pt idx="1"><c:v>20</c:v></c:pt></c:numCache></c:numRef></c:yVal><c:spPr><a:solidFill><a:srgbClr val="3366CC"/></a:solidFill></c:spPr></c:ser></c:scatterChart></c:plotArea></c:chart></c:chartSpace>`)

    const input = await zip.generateAsync({ type: 'arraybuffer' })
    const raw = await parse(input, { imageMode: 'none', videoMode: 'none', audioMode: 'none' }) as any
    const chart = raw.slides[0]?.elements.find((element: any) => element.type === 'chart')

    expect(chart).toMatchObject({
      chartType: 'scatterChart',
      style: 'lineMarker',
      schema: {
        mode: 'xy',
        series: [
          {
            key: 'Series XY',
            name: 'Series XY',
            index: '0',
            order: '0',
            points: [
              { x: 1, y: 10 },
              { x: 2, y: 20 },
            ],
          },
        ],
      },
    })
  })

  it('emits pie chart categorical-single schema metadata', async () => {
    const zip = new JSZip()

    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
      <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
        <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
        <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
        <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
        <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
        <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
        <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
        <Override PartName="/ppt/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>
      </Types>`)
    zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldSz cx="9144000" cy="6858000"/><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst><p:defaultTextStyle/></p:presentation>`)
    zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/></Relationships>`)
    zip.file('ppt/slides/slide1.xml', `<?xml version="1.0" encoding="UTF-8"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart"><p:cSld><p:spTree><p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="12" name="Pie 1"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="0" y="0"/><a:ext cx="1828800" cy="914400"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart r:id="rIdChart1"/></a:graphicData></a:graphic></p:graphicFrame></p:spTree></p:cSld></p:sld>`)
    zip.file('ppt/slides/_rels/slide1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdLayout" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rIdChart1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart1.xml"/></Relationships>`)
    zip.file('ppt/slideLayouts/slideLayout1.xml', `<?xml version="1.0" encoding="UTF-8"?><p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld></p:sldLayout>`)
    zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdMaster" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`)
    zip.file('ppt/slideMasters/slideMaster1.xml', `<?xml version="1.0" encoding="UTF-8"?><p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld><p:txStyles/></p:sldMaster>`)
    zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`)
    zip.file('ppt/theme/theme1.xml', `<?xml version="1.0" encoding="UTF-8"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:clrScheme name="Office"><a:accent1><a:srgbClr val="3366CC"/></a:accent1><a:accent2><a:srgbClr val="DC3912"/></a:accent2><a:accent3><a:srgbClr val="FF9900"/></a:accent3><a:accent4><a:srgbClr val="109618"/></a:accent4><a:accent5><a:srgbClr val="990099"/></a:accent5><a:accent6><a:srgbClr val="0099C6"/></a:accent6></a:clrScheme></a:themeElements></a:theme>`)
    zip.file('ppt/tableStyles.xml', `<?xml version="1.0" encoding="UTF-8"?><a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="tableStyleId"/>`)
    zip.file('ppt/charts/chart1.xml', `<?xml version="1.0" encoding="UTF-8"?><c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><c:chart><c:plotArea><c:pieChart><c:varyColors val="1"/><c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:strRef><c:strCache><c:pt idx="0"><c:v>Share</c:v></c:pt></c:strCache></c:strRef></c:tx><c:cat><c:strRef><c:strCache><c:pt idx="0"><c:v>A</c:v></c:pt><c:pt idx="1"><c:v>B</c:v></c:pt></c:strCache></c:strRef></c:cat><c:val><c:numRef><c:numCache><c:pt idx="0"><c:v>60</c:v></c:pt><c:pt idx="1"><c:v>40</c:v></c:pt></c:numCache></c:numRef></c:val><c:dPt><c:idx val="0"/><c:spPr><a:solidFill><a:srgbClr val="3366CC"/></a:solidFill></c:spPr></c:dPt><c:dPt><c:idx val="1"/><c:spPr><a:solidFill><a:srgbClr val="DC3912"/></a:solidFill></c:spPr></c:dPt></c:ser></c:pieChart></c:plotArea></c:chart></c:chartSpace>`)

    const input = await zip.generateAsync({ type: 'arraybuffer' })
    const raw = await parse(input, { imageMode: 'none', videoMode: 'none', audioMode: 'none' }) as any
    const chart = raw.slides[0]?.elements.find((element: any) => element.type === 'chart')

    expect(chart).toMatchObject({
      chartType: 'pieChart',
      schema: {
        mode: 'categorical-single',
        categories: ['A', 'B'],
        series: [
          {
            key: 'Share',
            name: 'Share',
            index: '0',
            order: '0',
            values: [60, 40],
            points: [
              { category: 'A', x: '0', y: 60 },
              { category: 'B', x: '1', y: 40 },
            ],
          },
        ],
      },
      semantics: {
        varyColors: true,
      },
    })
    expect(chart?.colors).toEqual(['#3366CC', '#DC3912'])
  })
})
