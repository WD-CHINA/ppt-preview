import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { parseWithPptxtojson } from '../../adapters/pptxtojson/parseWithPptxtojson'
import { normalizePresentation } from '../../adapters/pptxtojson/normalizePresentation'
import { findTransitionDebugCase, transitionDebugCases, type TransitionDebugCase } from '../../fixtures/transitionCaseCatalog'
import { evaluatePresentationFrame } from '../../runtime/evaluatePresentationFrame'
import { createPresentationRuntime } from '../../runtime/createPresentationRuntime'
import type { NormalizedPresentation } from '../../types/presentation'

const fallbackPresentation: NormalizedPresentation = {
  width: 1280,
  height: 720,
  theme: { colors: {} },
  usedFonts: [],
  slides: [
    {
      id: 'welcome',
      name: 'Welcome',
      note: '上传 PPTX 后会替换为真实内容',
      background: { color: '#0f172a' },
      transition: { type: 'fade', durationMs: 400 },
      autoplay: { advanceOnClick: true, advanceAfterMs: 12000 },
      animations: [
        {
          id: 'welcome-title-enter',
          trigger: 'withPrevious',
          durationMs: 600,
          targetElementIds: ['title'],
          effect: 'fade',
        },
        {
          id: 'welcome-desc-enter',
          trigger: 'afterPrevious',
          durationMs: 500,
          targetElementIds: ['desc'],
          effect: 'fade',
        },
        {
          id: 'welcome-shape-enter',
          trigger: 'onClick',
          durationMs: 350,
          targetElementIds: ['shape'],
          effect: 'fade',
        },
      ],
      elements: [
        {
          id: 'title',
          type: 'text',
          name: 'title',
          order: 1,
          bounds: { x: 96, y: 100, width: 1080, height: 120, rotate: 0 },
          text: '商业级 PPT Runtime 骨架已就绪',
          style: {
            color: '#f8fafc',
            fontSize: '44px',
            fontWeight: '700',
            lineHeight: '1.2',
          },
          raw: null,
        },
        {
          id: 'desc',
          type: 'text',
          name: 'desc',
          order: 2,
          bounds: { x: 96, y: 248, width: 920, height: 180, rotate: 0 },
          text: '当前实现已包含：解析适配层、标准化模型、Runtime、Evaluator、播放器 UI。你现在可以直接上传 .pptx 进行预览。',
          style: {
            color: '#cbd5e1',
            fontSize: '22px',
            lineHeight: '1.6',
          },
          raw: null,
        },
        {
          id: 'shape',
          type: 'shape',
          name: 'shape',
          order: 3,
          bounds: { x: 96, y: 480, width: 320, height: 120, rotate: 0 },
          style: {
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
            borderRadius: '20px',
          },
          raw: null,
        },
      ],
    },
  ],
}

export function usePresentationPlayer() {
  const model = shallowRef<NormalizedPresentation>(fallbackPresentation)
  const runtime = shallowRef(createPresentationRuntime(model.value))
  const isLoading = shallowRef(false)
  const error = shallowRef('')
  const lastFileName = shallowRef('')
  let rafId = 0
  let lastTick = 0

  const frame = computed(() => evaluatePresentationFrame(runtime.value.model, runtime.value.state))
  const activeSlide = computed(() => runtime.value.model.slides[runtime.value.state.activeSlideIndex])
  const slideCount = computed(() => runtime.value.model.slides.length)
  const canAdvance = computed(
    () =>
      runtime.value.state.waitingTrigger ||
      runtime.value.state.activeSlideIndex < runtime.value.model.slides.length - 1 ||
      runtime.value.state.loopEnabled,
  )

  watch(model, (nextModel, previousModel) => {
    if (previousModel && previousModel !== nextModel) {
      runtime.value.dispose()
    }

    runtime.value = createPresentationRuntime(nextModel)
  })

  function startLoop() {
    stopLoop()

    const loop = (timestamp: number) => {
      if (lastTick === 0) {
        lastTick = timestamp
      }

      const delta = timestamp - lastTick
      lastTick = timestamp
      runtime.value.tick(delta)
      rafId = window.requestAnimationFrame(loop)
    }

    rafId = window.requestAnimationFrame(loop)
  }

  function stopLoop() {
    if (rafId) {
      window.cancelAnimationFrame(rafId)
      rafId = 0
    }
    lastTick = 0
  }

  async function loadFile(file: File) {
    isLoading.value = true
    error.value = ''
    lastFileName.value = file.name

    try {
      const buffer = await file.arrayBuffer()
      const raw = await parseWithPptxtojson(buffer)
      model.value = normalizePresentation(raw)
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'PPT 解析失败'
      error.value = message
      model.value = fallbackPresentation
    } finally {
      isLoading.value = false
    }
  }

  async function loadFixtureByName(fileName: string) {
    if (!fileName) {
      return
    }

    const response = await fetch(`/${encodeURIComponent(fileName)}`)

    if (!response.ok) {
      throw new Error(`无法加载 fixture: ${fileName}`)
    }

    const blob = await response.blob()
    const file = new File([blob], fileName, {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    })

    await loadFile(file)
    await nextTick()
  }

  async function prepareTransitionCase(caseConfig: TransitionDebugCase) {
    const activeRuntime = runtime.value
    activeRuntime.pause()

    if (caseConfig.prepareMode === 'goToSlide') {
      activeRuntime.goToSlide(caseConfig.sourceSlideIndex)
      await nextTick()
    } else {
      const state = activeRuntime.state
      state.activeSlideIndex = caseConfig.sourceSlideIndex
      state.timelinePositionMs = 0
      state.slideElapsedMs = 0
      state.currentTriggerIndex = 0
      state.waitingTrigger = false
      state.transitionFromSlideIndex = null
      state.transitionToSlideIndex = null
      state.transitionProgress = 1
      state.sessionStatus = 'paused'
      await nextTick()
    }

    activeRuntime.nextSlide()
    activeRuntime.tick(caseConfig.tickMs)
    activeRuntime.pause()
    await nextTick()
  }

  async function prepareTransitionCaseById(caseId: string) {
    const caseConfig = findTransitionDebugCase(caseId)

    if (!caseConfig) {
      throw new Error(`未知 transition case: ${caseId}`)
    }

    if (lastFileName.value !== caseConfig.fileName) {
      await loadFixtureByName(caseConfig.fileName)
    }

    await prepareTransitionCase(caseConfig)
  }

  async function loadFixtureFromLocation() {
    const params = new URLSearchParams(window.location.search)
    const transitionCaseId = params.get('transitionCase') ?? params.get('caseId')
    const transitionCase = transitionCaseId ? findTransitionDebugCase(transitionCaseId) : undefined
    const fixtureName = params.get('fixture') ?? transitionCase?.fileName

    if (!fixtureName && !transitionCase) {
      return
    }

    try {
      if (fixtureName) {
        await loadFixtureByName(fixtureName)
      }

      if (transitionCase) {
        await prepareTransitionCase(transitionCase)
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Fixture 加载失败'
      error.value = message
    }
  }

  onMounted(() => {
    startLoop()
    window.__pptPreviewLoadFixture = loadFixtureByName
    window.__pptPreviewPrepareTransitionCase = prepareTransitionCaseById
    window.__pptPreviewTransitionCases = transitionDebugCases
    void loadFixtureFromLocation()
  })

  onBeforeUnmount(() => {
    stopLoop()
    runtime.value.dispose()
    delete window.__pptPreviewLoadFixture
    delete window.__pptPreviewPrepareTransitionCase
    delete window.__pptPreviewTransitionCases
  })

  return {
    model,
    runtime,
    frame,
    activeSlide,
    slideCount,
    canAdvance,
    isLoading,
    error,
    lastFileName,
    loadFile,
  }
}
