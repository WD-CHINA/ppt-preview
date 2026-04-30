import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PresentationFrame } from '../../types/presentation'

export interface TransitionFixtureCase {
  caseId: string
  sourceSlideIndex: number
  tickMs: number
  expectedFrame: Pick<
    PresentationFrame,
    'currentSlideIndex' | 'isTransitioning' | 'transitionType' | 'transitionDirection' | 'transitionOrientation'
  >
  expectedViewports: Array<{
    role: 'previous' | 'current'
    style: Record<string, string | number>
  }>
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const TRANSITION_FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../public/transition-cover-uncover-zoom-split-fixture.pptx',
)

export const transitionFixtureCases: TransitionFixtureCase[] = [
  {
    caseId: 'cover-right-real',
    sourceSlideIndex: 0,
    tickMs: 400,
    expectedFrame: {
      currentSlideIndex: 1,
      isTransitioning: true,
      transitionType: 'cover',
      transitionDirection: 'r',
      transitionOrientation: undefined,
    },
    expectedViewports: [
      {
        role: 'previous',
        style: {
          opacity: 1,
          transform: 'none',
          transition: 'none',
        },
      },
      {
        role: 'current',
        style: {
          opacity: 1,
          transform: 'translateX(640px)',
          transition: 'none',
        },
      },
    ],
  },
  {
    caseId: 'uncover-left-real',
    sourceSlideIndex: 1,
    tickMs: 250,
    expectedFrame: {
      currentSlideIndex: 2,
      isTransitioning: true,
      transitionType: 'uncover',
      transitionDirection: 'l',
      transitionOrientation: undefined,
    },
    expectedViewports: [
      {
        role: 'previous',
        style: {
          opacity: 1,
          transform: 'translateX(640px)',
          transition: 'none',
        },
      },
      {
        role: 'current',
        style: {
          opacity: 1,
          transform: 'none',
          transition: 'none',
        },
      },
    ],
  },
  {
    caseId: 'zoom-default-real',
    sourceSlideIndex: 2,
    tickMs: 600,
    expectedFrame: {
      currentSlideIndex: 3,
      isTransitioning: true,
      transitionType: 'zoom',
      transitionDirection: undefined,
      transitionOrientation: undefined,
    },
    expectedViewports: [
      {
        role: 'previous',
        style: {
          opacity: 0.5,
          transform: 'scale(1.14)',
          transition: 'none',
        },
      },
      {
        role: 'current',
        style: {
          opacity: 0.5,
          transform: 'scale(0.96)',
          transition: 'none',
        },
      },
    ],
  },
  {
    caseId: 'split-vert-out-real',
    sourceSlideIndex: 3,
    tickMs: 400,
    expectedFrame: {
      currentSlideIndex: 4,
      isTransitioning: true,
      transitionType: 'split',
      transitionDirection: 'out',
      transitionOrientation: 'vert',
    },
    expectedViewports: [
      {
        role: 'previous',
        style: {
          opacity: 1,
          clipPath: 'polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, 0 25%, 100% 25%, 100% 75%, 0 75%, 0 25%)',
          transform: 'none',
          transition: 'none',
        },
      },
      {
        role: 'current',
        style: {
          opacity: 1,
          clipPath: 'inset(25% 0 25% 0)',
          transform: 'none',
          transition: 'none',
        },
      },
    ],
  },
]
