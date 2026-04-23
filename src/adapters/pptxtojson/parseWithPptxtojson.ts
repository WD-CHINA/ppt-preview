import type { PptxToJsonModule, PptxToJsonParseOptions, RawPptxDocument } from './types'

const defaultOptions: PptxToJsonParseOptions = {
  imageMode: 'blob',
  videoMode: 'blob',
  audioMode: 'blob',
}

export async function parseWithPptxtojson(
  input: ArrayBuffer,
  options: PptxToJsonParseOptions = defaultOptions,
): Promise<RawPptxDocument> {
  const module = (await import('pptxtojson')) as Partial<PptxToJsonModule>

  if (typeof module.parse !== 'function') {
    throw new Error('pptxtojson.parse 不可用')
  }

  return module.parse(input, {
    ...defaultOptions,
    ...options,
  })
}
