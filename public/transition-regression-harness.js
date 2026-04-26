export async function loadPptxFixture(fileName) {
  const response = await fetch(`http://localhost:5173/${encodeURIComponent(fileName)}`)
  const blob = await response.blob()
  const file = new File([blob], fileName, {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  })

  const input = document.querySelector('input[type=file]')
  if (!input) {
    throw new Error('No file input found')
  }

  const dataTransfer = new DataTransfer()
  dataTransfer.items.add(file)
  input.files = dataTransfer.files
  input.dispatchEvent(new Event('change', { bubbles: true }))
  await sleep(250)
}

export async function collectTransitionRegressionCase(caseConfig) {
  await loadPptxFixture(caseConfig.fileName)

  const component = getShellComponent()
  const runtime = component.props.runtime
  runtime.pause()

  if (caseConfig.prepareMode === 'goToSlide') {
    runtime.goToSlide(caseConfig.sourceSlideIndex)
    await nextFrame()
  } else {
    const state = runtime.state
    state.activeSlideIndex = caseConfig.sourceSlideIndex
    state.timelinePositionMs = 0
    state.slideElapsedMs = 0
    state.currentTriggerIndex = 0
    state.waitingTrigger = false
    state.transitionFromSlideIndex = null
    state.transitionToSlideIndex = null
    state.transitionProgress = 1
    state.sessionStatus = 'paused'
    await nextFrame()
  }

  runtime.nextSlide()
  runtime.tick(caseConfig.tickMs ?? 400)
  await nextFrame()
  await nextFrame()

  const frame = component.props.frame
  return {
    caseId: caseConfig.caseId,
    fileName: caseConfig.fileName,
    sourceSlideIndex: caseConfig.sourceSlideIndex,
    frame: {
      currentSlideIndex: frame.currentSlideIndex,
      isTransitioning: frame.isTransitioning,
      transitionType: frame.transitionType,
      transitionDirection: frame.transitionDirection,
      transitionProgress: round(frame.transitionProgress),
      previousSlideId: frame.previous?.slideId,
      currentSlideId: frame.current?.slideId,
    },
    viewports: [...document.querySelectorAll('.viewport')].map((node) => ({
      clipPath: getComputedStyle(node).clipPath,
      transform: getComputedStyle(node).transform,
      opacity: getComputedStyle(node).opacity,
      texts: [...node.querySelectorAll('p')].slice(0, 2).map((p) => p.textContent),
    })),
  }
}

export async function runTransitionRegressionSuite(cases) {
  const results = []
  for (const caseConfig of cases) {
    results.push(await collectTransitionRegressionCase(caseConfig))
  }
  return results
}

function getShellComponent() {
  const app = document.querySelector('#app')?.__vue_app__
  const component = app?._instance?.subTree?.component
  if (!component) {
    throw new Error('PresentationShell component not found')
  }
  return component
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function round(value) {
  return typeof value === 'number' ? Number(value.toFixed(3)) : value
}
