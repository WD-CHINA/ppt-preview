import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { transitionFixtureCases } from './transitionFixtureCases'

interface TransitionBaselineCase {
  caseId: string
  fileName: string
  sourceSlideIndex: number
  prepareMode?: 'goToSlide' | 'mutateState'
  tickMs: number
  frame: {
    currentSlideIndex: number
    isTransitioning: boolean
    transitionType?: string
    transitionDirection?: string
    transitionProgress?: number
  }
  viewports: Array<{
    role: 'previous' | 'current'
    clipPath?: string
    opacity?: string
    transform?: string
  }>
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const BASELINE_PATH = path.resolve(__dirname, '../../../fixtures/transition-regression-baseline.json')

describe('transition regression baseline', () => {
  it('contains the dedicated cover/uncover/zoom/split fixture cases with stable expected values', async () => {
    const baseline = JSON.parse(await readFile(BASELINE_PATH, 'utf8')) as { cases: TransitionBaselineCase[] }
    const baselineById = new Map(baseline.cases.map((entry) => [entry.caseId, entry]))

    for (const fixtureCase of transitionFixtureCases) {
      const baselineCase = baselineById.get(fixtureCase.caseId)

      expect(baselineCase, `${fixtureCase.caseId} missing from transition baseline`).toBeDefined()
      expect(baselineCase?.fileName).toBe('transition-cover-uncover-zoom-split-fixture.pptx')
      expect(baselineCase?.sourceSlideIndex).toBe(fixtureCase.sourceSlideIndex)
      expect(baselineCase?.prepareMode).toBe('mutateState')
      expect(baselineCase?.tickMs).toBe(fixtureCase.tickMs)
      expect({
        currentSlideIndex: baselineCase?.frame.currentSlideIndex,
        isTransitioning: baselineCase?.frame.isTransitioning,
        transitionType: baselineCase?.frame.transitionType,
        transitionDirection: baselineCase?.frame.transitionDirection,
      }).toEqual(fixtureCase.expectedFrame)
      expect(
        baselineCase?.viewports.map((viewport) => ({
          role: viewport.role,
          style: {
            opacity: normalizeStyleScalar(viewport.opacity),
            transform: viewport.transform,
            transition: 'none',
          },
        })),
      ).toEqual(fixtureCase.expectedViewports)
    }
  })
})

function normalizeStyleScalar(value: string | undefined) {
  if (value == null) {
    return value
  }

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : value
}
