import type { PptxToJsonModule, PptxToJsonParseOptions, RawPptxDocument } from './types'
import { enrichTextBodyInsets } from './textBodyInsets'

const defaultOptions: PptxToJsonParseOptions = {
  imageMode: 'blob',
  videoMode: 'blob',
  audioMode: 'blob',
}

export async function parseWithPptxtojson(
  input: ArrayBuffer,
  options: PptxToJsonParseOptions = defaultOptions,
): Promise<RawPptxDocument> {
  const module = (await import('pptxtojson')) as unknown as Partial<PptxToJsonModule>

  if (typeof module.parse !== 'function') {
    throw new Error('pptxtojson.parse 不可用')
  }

  const raw = await module.parse(input, {
    ...defaultOptions,
    ...options,
  })

  return enrichTextBodyInsets(raw, input)
}
