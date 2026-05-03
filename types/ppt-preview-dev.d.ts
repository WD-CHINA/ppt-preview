import type { TransitionDebugCase } from '../src/fixtures/transitionCaseCatalog'

export {}

declare global {
  interface Window {
    __pptPreviewLoadFixture?: (fileName: string) => Promise<void>
    __pptPreviewPrepareTransitionCase?: (caseId: string) => Promise<void>
    __pptPreviewGoToSlide?: (slideNumber: number) => Promise<void>
    __pptPreviewTransitionCases?: TransitionDebugCase[]
  }
}
