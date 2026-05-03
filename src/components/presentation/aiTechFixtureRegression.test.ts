import { readFile } from 'node:fs/promises'
import { beforeAll, describe, expect, it } from 'vitest'
import { parseWithPptxtojson } from '../../adapters/pptxtojson/parseWithPptxtojson'
import { normalizePresentation } from '../../adapters/pptxtojson/normalizePresentation'
import { sanitizePresentationHtml } from './textHtmlSanitizer'
import { getShapeSvgLayoutModel } from './shapeSvgLayout'
import type { NormalizedPresentation } from '../../types/presentation'

const FIXTURE_PATH = new URL('../../../public/AI.Tech.Agency.Infographics.by.Slidesgo.pptx', import.meta.url)

let model: NormalizedPresentation

beforeAll(async () => {
  const input = await readFile(FIXTURE_PATH)
  const arrayBuffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)
  model = normalizePresentation(await parseWithPptxtojson(arrayBuffer))
})

describe('AI Tech fixture regression', () => {
  it('keeps slide 1 title copy wrappable instead of preserving nbsp between every word', () => {
    const title = model.slides[0]?.elements.find((element) => element.name === 'Google Shape;57;p15')

    expect(title?.html).toContain('AI&nbsp;TECH&nbsp;AGENCY')

    const sanitized = sanitizePresentationHtml(title?.html)

    expect(sanitized).toContain('AI TECH AGENCY')
    expect(sanitized).toContain('INFOGRAPHICS')
    expect(sanitized).not.toContain('AI&nbsp;TECH&nbsp;AGENCY')
  })

  it('keeps slide 2 body paragraphs wrappable while preserving bullet indentation', () => {
    const body = model.slides[1]?.elements.find((element) => element.name === 'Google Shape;65;p16')

    expect(body?.html).toContain('This&nbsp;template&nbsp;contains')

    const sanitized = sanitizePresentationHtml(body?.html)

    expect(sanitized).toContain('This template contains')
    expect(sanitized).toContain('margin-left: 36pt')
    expect(sanitized).toContain('text-indent: -25pt')
    expect(sanitized).not.toContain('This&nbsp;template&nbsp;contains')
  })

  it('keeps slide 3 title and label copy wrappable', () => {
    const title = model.slides[2]?.elements.find((element) => element.name === 'Google Shape;70;p17')
    const label = model.slides[2]?.elements.find((element) => element.name === 'Google Shape;83;p17')

    const sanitizedTitle = sanitizePresentationHtml(title?.html)
    const sanitizedLabel = sanitizePresentationHtml(label?.html)

    expect(sanitizedTitle).toContain('AI TECH AGENCY INFOGRAPHICS')
    expect(sanitizedTitle).not.toContain('AI&nbsp;TECH&nbsp;AGENCY&nbsp;INFOGRAPHICS')
    expect(sanitizedLabel).toContain('>S<')
  })

  it('keeps slide 4 connector lines visible even when pptxtojson reports zero width or height', () => {
    const slide = model.slides[3]
    const horizontalConnector = slide?.elements.find((element) => element.name === 'Google Shape;97;p18')
    const verticalConnector = slide?.elements.find((element) => element.name === 'Google Shape;100;p18')

    expect(horizontalConnector?.shape?.type).toBe('straightConnector1')
    expect(verticalConnector?.shape?.type).toBe('straightConnector1')

    const horizontalLayout = getShapeSvgLayoutModel({
      shapeType: horizontalConnector?.shape?.type,
      boundsWidth: horizontalConnector?.bounds.width ?? 0,
      boundsHeight: horizontalConnector?.bounds.height ?? 0,
      viewBoxWidth: horizontalConnector?.shape?.viewBoxWidth,
      viewBoxHeight: horizontalConnector?.shape?.viewBoxHeight,
      strokeWidth: 2,
    })

    const verticalLayout = getShapeSvgLayoutModel({
      shapeType: verticalConnector?.shape?.type,
      boundsWidth: verticalConnector?.bounds.width ?? 0,
      boundsHeight: verticalConnector?.bounds.height ?? 0,
      viewBoxWidth: verticalConnector?.shape?.viewBoxWidth,
      viewBoxHeight: verticalConnector?.shape?.viewBoxHeight,
      strokeWidth: 2,
    })

    expect(horizontalLayout.renderHeight).toBe(2)
    expect(horizontalLayout.offsetY).toBe(-1)
    expect(verticalLayout.renderWidth).toBe(2)
    expect(verticalLayout.offsetX).toBe(-1)
  })

  it('keeps slide 5 table body copy wrappable inside cells instead of preserving nbsp-separated prose', () => {
    const slide = model.slides[4]
    const pricingTable = slide?.elements.find((element) => element.type === 'table' && element.name === 'table-4')
    const firstBodyCell = pricingTable?.table?.cells[1]?.[0]

    expect(firstBodyCell?.text).toContain('Mercury&nbsp;is&nbsp;small')

    const sanitized = sanitizePresentationHtml(firstBodyCell?.text)

    expect(sanitized).toContain('Mercury is small')
    expect(sanitized).toContain('margin-left: 36pt')
    expect(sanitized).toContain('text-indent: -25pt')
    expect(sanitized).not.toContain('Mercury&nbsp;is&nbsp;small')
  })
})
