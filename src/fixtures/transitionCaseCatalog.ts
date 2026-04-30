export interface TransitionDebugCase {
  caseId: string
  fileName: string
  sourceSlideIndex: number
  prepareMode: 'goToSlide' | 'mutateState'
  tickMs: number
}

export const transitionDebugCases: TransitionDebugCase[] = [
  { caseId: 'push-default-real', fileName: '演示文稿1.pptx', sourceSlideIndex: 0, prepareMode: 'mutateState', tickMs: 400 },
  { caseId: 'push-up-real', fileName: '47e66b31f89d4b33b14c5010b92296c5.pptx', sourceSlideIndex: 1, prepareMode: 'goToSlide', tickMs: 600 },
  { caseId: 'wipe-right-real', fileName: 'wipe-directions-fixture.pptx', sourceSlideIndex: 0, prepareMode: 'goToSlide', tickMs: 400 },
  { caseId: 'wipe-left-real', fileName: 'wipe-directions-fixture.pptx', sourceSlideIndex: 1, prepareMode: 'mutateState', tickMs: 400 },
  { caseId: 'wipe-up-real', fileName: 'wipe-directions-fixture.pptx', sourceSlideIndex: 2, prepareMode: 'mutateState', tickMs: 400 },
  { caseId: 'wipe-down-real', fileName: 'wipe-directions-fixture.pptx', sourceSlideIndex: 3, prepareMode: 'mutateState', tickMs: 400 },
  { caseId: 'cover-right-real', fileName: 'transition-cover-uncover-zoom-split-fixture.pptx', sourceSlideIndex: 0, prepareMode: 'mutateState', tickMs: 400 },
  { caseId: 'uncover-left-real', fileName: 'transition-cover-uncover-zoom-split-fixture.pptx', sourceSlideIndex: 1, prepareMode: 'mutateState', tickMs: 250 },
  { caseId: 'zoom-default-real', fileName: 'transition-cover-uncover-zoom-split-fixture.pptx', sourceSlideIndex: 2, prepareMode: 'mutateState', tickMs: 600 },
  { caseId: 'split-vert-out-real', fileName: 'transition-cover-uncover-zoom-split-fixture.pptx', sourceSlideIndex: 3, prepareMode: 'mutateState', tickMs: 400 },
]

export function findTransitionDebugCase(caseId: string) {
  return transitionDebugCases.find((entry) => entry.caseId === caseId)
}
