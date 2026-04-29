import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { getImageData } from './fill'

describe('vendor media mime parser', () => {
  it('uses explicit SVG mime when embedded bytes are xml/svg despite file extension', async () => {
    const zip = new JSZip()
    zip.file('ppt/media/photo.png', '<svg xmlns="http://www.w3.org/2000/svg"></svg>')

    const imageData = await getImageData('ppt/media/photo.png', {
      zip,
      loadedImages: {},
      options: { imageMode: 'base64' },
    })

    expect(imageData.base64.startsWith('data:image/svg+xml;base64,')).toBe(true)
  })
})
