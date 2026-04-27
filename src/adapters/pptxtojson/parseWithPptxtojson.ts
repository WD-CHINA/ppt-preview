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
  const module = await loadPptxToJsonModule()

  if (typeof module.parse !== 'function') {
    throw new Error('pptxtojson.parse 不可用')
  }

  const raw = await module.parse(input, {
    ...defaultOptions,
    ...options,
  })

  return enrichTextBodyInsets(raw, input)
}

async function loadPptxToJsonModule(): Promise<Partial<PptxToJsonModule>> {
  const primaryModule = (await import('pptxtojson')) as unknown as Partial<PptxToJsonModule> & {
    default?: Partial<PptxToJsonModule>
  }

  if (typeof primaryModule.parse === 'function') {
    return primaryModule
  }

  if (typeof primaryModule.default?.parse === 'function') {
    return primaryModule.default
  }

  const esmModule = (await import('pptxtojson/dist/index.js')) as unknown as Partial<PptxToJsonModule> & {
    default?: Partial<PptxToJsonModule>
  }

  if (typeof esmModule.parse === 'function') {
    return esmModule
  }

  if (typeof esmModule.default?.parse === 'function') {
    return esmModule.default
  }

  return primaryModule
}
