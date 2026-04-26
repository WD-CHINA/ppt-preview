import type { EvaluatedElementFrame } from '../../types/presentation'

export type MediaFallbackMode = 'media' | 'poster' | 'placeholder'

export function getMediaFallbackMode(element: Pick<EvaluatedElementFrame, 'type' | 'media'>, hasMediaSource: boolean, hasLoadError: boolean): MediaFallbackMode {
  if (!hasMediaSource) {
    return 'placeholder'
  }

  if (!hasLoadError) {
    return 'media'
  }

  if ((element.type === 'video' || element.type === 'audio') && element.media?.poster) {
    return 'poster'
  }

  return 'placeholder'
}

export function getMediaPosterSource(element: Pick<EvaluatedElementFrame, 'media'>) {
  return typeof element.media?.poster === 'string' && element.media.poster.length > 0 ? element.media.poster : undefined
}
