import { readFile } from 'node:fs/promises'
import { beforeAll, describe, expect, it } from 'vitest'
import { parseWithPptxtojson } from '../../adapters/pptxtojson/parseWithPptxtojson'
import { normalizePresentation } from '../../adapters/pptxtojson/normalizePresentation'
import { createPresentationRuntime } from '../../runtime/createPresentationRuntime'
import { evaluatePresentationFrame } from '../../runtime/evaluatePresentationFrame'
import { sanitizePresentationHtml } from './textHtmlSanitizer'
import type { NormalizedPresentation } from '../../types/presentation'

const FIXTURE_PATH = new URL('../../../public/0501.pptx', import.meta.url)

let model: NormalizedPresentation

beforeAll(async () => {
  const input = await readFile(FIXTURE_PATH)
  const arrayBuffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)
  model = normalizePresentation(await parseWithPptxtojson(arrayBuffer))
})

describe('0501 fixture regression', () => {
  it('keeps repeated margin-top-heavy outline pages readable across the deck', () => {
    const representativeCases = [
      { slideIndex: 2, name: 'Rectangle 2', indent: 'text-indent: 0pt' },
      { slideIndex: 3, name: 'Rectangle 2', indent: 'text-indent: -27pt' },
      { slideIndex: 11, name: 'Rectangle 3', indent: 'text-indent: -37pt' },
    ]

    for (const { slideIndex, name, indent } of representativeCases) {
      const slide = model.slides[slideIndex]
      const element = slide?.elements.find((candidate) => candidate.type === 'text' && candidate.name === name)

      expect(element?.html).toContain('margin-top: 20em')

      const sanitized = sanitizePresentationHtml(element?.html)

      expect(sanitized).not.toContain('margin-top')
      expect(sanitized).not.toContain('margin-bottom')
      expect(sanitized).toContain(indent)
      expect(sanitized.trim().length).toBeGreaterThan(0)
    }
  })

  it('keeps slide 5 chapter outline visible after sanitizing abnormal paragraph margins', () => {
    const slide = model.slides[4]
    const outline = slide?.elements.find((element) => element.type === 'text' && element.name === '内容占位符 2')

    expect(outline?.html).toContain('margin-top: 20em')

    const sanitized = sanitizePresentationHtml(outline?.html)

    expect(sanitized).toContain('第一节')
    expect(sanitized).toContain('第一单元：发展心理学的研究对象')
    expect(sanitized).toContain('第六单元：儿童早期心理发展的关键期')
    expect(sanitized).toContain('margin-left: 27pt')
    expect(sanitized).toContain('text-indent: -27pt')
    expect(sanitized).not.toContain('margin-top')
    expect(sanitized).not.toContain('margin-bottom')
  })

  it('lifts suspicious dark body text on slide 7 while preserving accent heading colors', () => {
    const slide = model.slides[6]
    const body = slide?.elements.find((element) => element.type === 'text' && element.name === '内容占位符 2')

    expect(body?.html).toContain('color: #FFFF00')
    expect(body?.html).toContain('color: #00FFCC')
    expect(body?.html).toContain('color: #000000')

    const sanitized = sanitizePresentationHtml(body?.html)

    expect(sanitized).toContain('color: #FFFF00')
    expect(sanitized).toContain('color: #00FFCC')
    expect(sanitized).toContain('color: #FFFFFF')
    expect(sanitized).not.toContain('color: #000000;">心理种系发展：动物心理发展')
  })

  it('keeps slide 2 click builds aligned with real element ids and reveals copy progressively', () => {
    const slide = model.slides[1]
    const leftPanel = slide?.elements.find((element) => element.name === 'Rectangle 3')
    const rightPanel = slide?.elements.find((element) => element.name === 'Rectangle 4')

    expect(leftPanel?.id).toBe('7171')
    expect(rightPanel?.id).toBe('7172')
    expect(slide?.animations.map((animation) => animation.targetElementIds)).toEqual([
      ['7171'],
      ['7171'],
      ['7171'],
      ['7171'],
      ['7171'],
      ['7172'],
    ])

    const runtime = createPresentationRuntime(model)
    runtime.state.activeSlideIndex = 1
    runtime.state.currentTriggerIndex = 0
    runtime.state.waitingTrigger = true

    const before = evaluatePresentationFrame(model, runtime.state)
    const beforeLeft = before.current?.elements.find((element) => element.id === '7171')
    const beforeRight = before.current?.elements.find((element) => element.id === '7172')

    expect(beforeLeft?.visible).toBe(false)
    expect(beforeRight?.visible).toBe(false)

    runtime.advance()
    const firstReveal = evaluatePresentationFrame(model, runtime.state)
    const firstRevealLeft = firstReveal.current?.elements.find((element) => element.id === '7171')

    expect(firstRevealLeft?.visible).toBe(true)
    expect(firstRevealLeft?.renderedHtml).toContain('发展心理学')
    expect(firstRevealLeft?.renderedHtml).toContain('概述')
    expect(firstRevealLeft?.renderedHtml).not.toContain('婴儿期')
    expect(sanitizePresentationHtml(firstRevealLeft?.renderedHtml)).not.toContain('margin-top')

    runtime.advance()
    const secondReveal = evaluatePresentationFrame(model, runtime.state)
    const secondRevealLeft = secondReveal.current?.elements.find((element) => element.id === '7171')

    expect(secondRevealLeft?.renderedHtml).toContain('婴儿期')
    expect(secondRevealLeft?.renderedHtml).not.toContain('幼儿期')
    expect(sanitizePresentationHtml(secondRevealLeft?.renderedHtml)).not.toContain('margin-top')

    runtime.advance()
    runtime.advance()
    runtime.advance()
    runtime.advance()

    const finalReveal = evaluatePresentationFrame(model, runtime.state)
    const finalRevealRight = finalReveal.current?.elements.find((element) => element.id === '7172')

    expect(finalRevealRight?.visible).toBe(true)
    expect(finalRevealRight?.html).toContain('青春期')
    expect(finalRevealRight?.html).toContain('老年期')
  })
})
