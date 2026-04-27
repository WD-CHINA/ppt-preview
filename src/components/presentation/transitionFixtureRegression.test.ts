import { readFile } from 'node:fs/promises'
import { beforeAll, describe, expect, it } from 'vitest'
import { parseWithPptxtojson } from '../../adapters/pptxtojson/parseWithPptxtojson'
import { normalizePresentation } from '../../adapters/pptxtojson/normalizePresentation'
import { createPresentationRuntime } from '../../runtime/createPresentationRuntime'
import { evaluatePresentationFrame } from '../../runtime/evaluatePresentationFrame'
import { getStageViewportDescriptors } from './stageViewportModel'
import { TRANSITION_FIXTURE_PATH, transitionFixtureCases } from './transitionFixtureCases'
import { getTransitionViewportStyle } from './transitionViewportModel'
import type { NormalizedPresentation } from '../../types/presentation'

let model: NormalizedPresentation

beforeAll(async () => {
  const input = await readFile(TRANSITION_FIXTURE_PATH)
  const arrayBuffer = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength)
  model = normalizePresentation(await parseWithPptxtojson(arrayBuffer))
})

describe('transition fixture regression', () => {
  it('parses the dedicated cover/uncover/zoom/split fixture with destination-slide transition semantics', () => {
    expect(model.slides.map((slide) => slide.transition?.type)).toEqual(['fade', 'cover', 'uncover', 'zoom', 'split'])
    expect(model.slides.map((slide) => slide.transition?.direction)).toEqual([undefined, 'r', 'l', undefined, 'out'])
  })

  for (const fixtureCase of transitionFixtureCases) {
    it(`stabilizes ${fixtureCase.caseId}`, () => {
      const runtime = createPresentationRuntime(model)
      runtime.pause()
      runtime.state.activeSlideIndex = fixtureCase.sourceSlideIndex
      runtime.state.timelinePositionMs = 0
      runtime.state.slideElapsedMs = 0
      runtime.state.currentTriggerIndex = 0
      runtime.state.waitingTrigger = false
      runtime.state.transitionFromSlideIndex = null
      runtime.state.transitionToSlideIndex = null
      runtime.state.transitionProgress = 1
      runtime.state.sessionStatus = 'paused'

      runtime.nextSlide()
      runtime.tick(fixtureCase.tickMs)

      const frame = evaluatePresentationFrame(runtime.model, runtime.state)
      const descriptors = getStageViewportDescriptors(frame)
      const viewports = descriptors.map((descriptor) => ({
        role: descriptor.transitionRole ?? 'current',
        style: getTransitionViewportStyle({
          transitionType: descriptor.transitionType,
          transitionDirection: descriptor.transitionDirection,
          role: descriptor.transitionRole,
          progress: descriptor.transitionProgress,
          width: frame.width,
          height: frame.height,
        }),
      }))

      expect({
        currentSlideIndex: frame.currentSlideIndex,
        isTransitioning: frame.isTransitioning,
        transitionType: frame.transitionType,
        transitionDirection: frame.transitionDirection,
      }).toEqual(fixtureCase.expectedFrame)
      expect(viewports).toEqual(fixtureCase.expectedViewports)
    })
  }
})
