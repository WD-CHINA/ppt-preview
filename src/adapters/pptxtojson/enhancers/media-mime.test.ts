import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import type { RawPptxDocument } from '../types'
import { correctEmbeddedMediaMimeTypes } from './media-mime'

async function blobText(blob: Blob | string | undefined) {
  return blob instanceof Blob ? blob.text() : String(blob)
}

describe('media mime enhancer', () => {
  it('replaces fake png blobs with svg blobs for both image and math refs', async () => {
    const raw: RawPptxDocument = {
      slides: [
        {
          elements: [
            { type: 'image', ref: 'ppt/media/image1.png', blob: 'old-image' },
            { type: 'math', picRef: '/ppt/media/formula1.png', picBlob: 'old-math' },
            { type: 'image', ref: 'ppt/media/photo.png', blob: 'keep-photo' },
          ],
        },
      ],
    }
    const zip = new JSZip()
    zip.file('ppt/media/image1.png', '<svg><text>image</text></svg>')
    zip.file('ppt/media/formula1.png', '<?xml version="1.0"?><svg><text>math</text></svg>')
    zip.file('ppt/media/photo.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47]))

    await correctEmbeddedMediaMimeTypes(raw, zip)

    const elements = raw.slides?.[0]?.elements
    expect(elements).toBeDefined()
    const [image, math, photo] = elements!
    expect(image!.blob).toBeInstanceOf(Blob)
    expect((image!.blob as Blob).type).toBe('image/svg+xml')
    expect(await blobText(image!.blob)).toContain('<svg>')
    expect(math!.picBlob).toBeInstanceOf(Blob)
    expect((math!.picBlob as Blob).type).toBe('image/svg+xml')
    expect(photo!.blob).toBe('keep-photo')
  })
})
