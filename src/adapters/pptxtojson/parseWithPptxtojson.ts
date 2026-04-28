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
  const localModule = (await import('../../vendor/pptxtojson/pptxtojson.js')) as unknown as Partial<PptxToJsonModule> & {
    default?: Partial<PptxToJsonModule>
  }

  if (typeof localModule.parse === 'function') {
    return localModule
  }

  if (typeof localModule.default?.parse === 'function') {
    return localModule.default
  }

  return localModule
}
