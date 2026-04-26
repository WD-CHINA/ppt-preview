import JSZip from 'jszip'
import type { RawPptxDocument } from './types'
import { extractSlideAnimationMetadata, applySlideAnimationMetadata } from './enhancers/slide-animations'
import { extractSlideLineMarkers, applyLineMarkers } from './enhancers/line-markers'
import { correctEmbeddedMediaMimeTypes } from './enhancers/media-mime'
import { extractSlideTransitionMetadata, applySlideTransitionMetadata } from './enhancers/slide-transitions'
import { extractSlideTextBodyInsets, applyTextBodyInsets } from './enhancers/text-body'

export async function enrichTextBodyInsets(
  raw: RawPptxDocument,
  input: ArrayBuffer,
): Promise<RawPptxDocument> {
  if (!Array.isArray(raw.slides) || typeof DOMParser === 'undefined') {
    return raw
  }

  const zip = await JSZip.loadAsync(input)
  await correctEmbeddedMediaMimeTypes(raw, zip)

  await Promise.all(
    raw.slides.map(async (slide, slideIndex) => {
      const slideXml = await zip.file(`ppt/slides/slide${slideIndex + 1}.xml`)?.async('string')

      if (!slideXml) {
        return
      }

      const textBodyInsets = extractSlideTextBodyInsets(slideXml)
      const lineMarkers = extractSlideLineMarkers(slideXml)
      const slideTransition = extractSlideTransitionMetadata(slideXml)
      const slideAnimations = extractSlideAnimationMetadata(slideXml)
      const slideElements = [
        ...(Array.isArray(slide.layoutElements) ? slide.layoutElements : []),
        ...(Array.isArray(slide.elements) ? slide.elements : []),
      ]

      applyTextBodyInsets(slideElements, textBodyInsets)
      applyLineMarkers(slideElements, lineMarkers)
      applySlideTransitionMetadata(slide, slideTransition)
      applySlideAnimationMetadata(slide, slideAnimations)
    }),
  )

  return raw
}
