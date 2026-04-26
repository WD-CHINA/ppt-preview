import { describe, expect, it } from 'vitest'
import { getMediaFallbackMode, getMediaPosterSource } from './mediaFallback'

describe('mediaFallback helper', () => {
  it('uses media when source exists and has not failed', () => {
    expect(getMediaFallbackMode({ type: 'video', media: { src: 'clip.mp4' } } as never, true, false)).toBe('media')
  })

  it('falls back to poster for video/audio when media fails and poster exists', () => {
    expect(getMediaFallbackMode({ type: 'video', media: { poster: 'poster.jpg' } } as never, true, true)).toBe('poster')
    expect(getMediaFallbackMode({ type: 'audio', media: { poster: 'audio-cover.jpg' } } as never, true, true)).toBe('poster')
    expect(getMediaPosterSource({ media: { poster: 'poster.jpg' } } as never)).toBe('poster.jpg')
  })

  it('falls back to placeholder when there is no poster or no source', () => {
    expect(getMediaFallbackMode({ type: 'image', media: { src: 'broken.png' } } as never, true, true)).toBe('placeholder')
    expect(getMediaFallbackMode({ type: 'video', media: {} } as never, false, true)).toBe('placeholder')
    expect(getMediaPosterSource({ media: {} } as never)).toBeUndefined()
  })
})
