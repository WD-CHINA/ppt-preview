import { describe, expect, it } from 'vitest'
import type { NormalizedElement, NormalizedPresentation, NormalizedSlide, PresentationRuntimeState } from '../types/presentation'
import { evaluatePresentationFrame } from './evaluatePresentationFrame'

function mediaElement(id: string): NormalizedElement {
  return {
    id,
    type: 'video',
    name: id,
    order: 1,
    bounds: { x: 0, y: 0, width: 100, height: 100, rotate: 0 },
    style: {},
    media: { src: `${id}.mp4`, preload: 'metadata' },
    raw: null,
  }
}

function slide(id: string, elements: NormalizedElement[]): NormalizedSlide {
  return {
    id,
    name: id,
    background: {},
    autoplay: { advanceOnClick: true },
    animations: [],
    elements,
  }
}

const model: NormalizedPresentation = {
  width: 1280,
  height: 720,
  theme: { colors: {} },
  usedFonts: [],
  slides: [slide('slide-1', [mediaElement('video-1')])],
}

const lineMotionModel: NormalizedPresentation = {
  width: 1280,
  height: 720,
  theme: { colors: {} },
  usedFonts: [],
  slides: [
    {
      id: 'slide-line',
      name: 'slide-line',
      background: {},
      autoplay: { advanceOnClick: true },
      elements: [
        {
          id: 'line-1',
          type: 'shape',
          name: 'line-1',
          order: 1,
          bounds: { x: 100, y: 120, width: 160, height: 8, rotate: 0 },
          style: {},
          shape: { path: 'M 0 4 L 160 4', type: 'line' },
          raw: null,
        },
      ],
      animations: [
        {
          id: 'move-line-1',
          trigger: 'afterPrevious',
          durationMs: 1000,
          targetElementIds: ['line-1'],
          effect: 'fade',
          motionPath: {
            xFrom: 0,
            yFrom: 0,
            xTo: 40,
            yTo: -20,
            rotateFrom: 0,
            rotateTo: 10,
          },
        },
      ],
    },
  ],
}

const state: PresentationRuntimeState = {
  sessionStatus: 'playing',
  activeSlideIndex: 0,
  timelinePositionMs: 1200,
  slideElapsedMs: 1200,
  currentTriggerIndex: 0,
  waitingTrigger: false,
  transitionProgress: 0,
  transitionFromSlideIndex: null,
  transitionToSlideIndex: null,
  isFullscreen: false,
  isMuted: true,
  presenterMode: false,
  loopEnabled: false,
  playbackRate: 1,
}

describe('evaluatePresentationFrame media output', () => {
  it('includes current slide media frames for renderer and media sync consumers', () => {
    const frame = evaluatePresentationFrame(model, state)

    expect(frame.current?.elements[0]?.mediaPlayback).toEqual({ action: 'play', muted: true, playbackRate: 1, seekMs: 1200 })
  })

  it('projects motion-path geometry into evaluated line bounds', () => {
    const frame = evaluatePresentationFrame(lineMotionModel, { ...state, timelinePositionMs: 500, slideElapsedMs: 500 })
    const line = frame.current?.elements[0]

    expect(line?.bounds).toEqual({ x: 120, y: 110, width: 160, height: 8, rotate: 5 })
    expect(line?.animationGeometry).toEqual({
      progress: 0.5,
      translateX: 20,
      translateY: -10,
      rotate: 5,
    })
  })

  it('projects paragraph-build visibility into rendered html for text elements', () => {
    const paragraphModel: NormalizedPresentation = {
      width: 1280,
      height: 720,
      theme: { colors: {} },
      usedFonts: [],
      slides: [
        {
          ...slide('slide-paragraphs', [
            {
              id: 'text-1',
              type: 'text',
              name: 'text-1',
              order: 1,
              bounds: { x: 0, y: 0, width: 200, height: 100, rotate: 0 },
              style: {},
              html: '<p>Alpha</p><p>Beta</p><p>Gamma</p>',
              raw: null,
            },
          ]),
          animations: [
            {
              id: 'build-1',
              trigger: 'onClick',
              durationMs: 350,
              targetElementIds: ['text-1'],
              targetParagraphIndex: 0,
              effect: 'fade',
            },
            {
              id: 'build-2',
              trigger: 'onClick',
              durationMs: 350,
              targetElementIds: ['text-1'],
              targetParagraphIndex: 1,
              effect: 'fade',
            },
          ],
        },
      ],
    }

    const firstReveal = evaluatePresentationFrame(paragraphModel, { ...state, currentTriggerIndex: 1 })
    const secondReveal = evaluatePresentationFrame(paragraphModel, { ...state, currentTriggerIndex: 2 })

    expect(firstReveal.current?.elements[0]?.renderedHtml).toBe('<p>Alpha</p>')
    expect(secondReveal.current?.elements[0]?.renderedHtml).toBe('<p>Alpha</p><p>Beta</p>')
  })

  it('uses the destination slide transition metadata while transitioning into the next slide', () => {
    const transitionModel: NormalizedPresentation = {
      width: 1280,
      height: 720,
      theme: { colors: {} },
      usedFonts: [],
      slides: [
        {
          ...slide('slide-1', []),
          transition: { type: 'fade', direction: 'u', durationMs: 800 },
        },
        {
          ...slide('slide-2', []),
          transition: { type: 'push', direction: 'r', durationMs: 800 },
        },
      ],
    }

    const frame = evaluatePresentationFrame(transitionModel, {
      ...state,
      activeSlideIndex: 1,
      sessionStatus: 'transitioning',
      transitionProgress: 0.25,
      transitionFromSlideIndex: 0,
      transitionToSlideIndex: 1,
    })

    expect(frame.currentSlideIndex).toBe(1)
    expect(frame.transitionType).toBe('push')
    expect(frame.transitionDirection).toBe('r')
  })
})
