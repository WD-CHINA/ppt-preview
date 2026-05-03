import fs from 'node:fs/promises'
import path from 'node:path'

import { defaultPublicPptPageVisualCases } from './publicPptPageVisualCases.mjs'

const outputDir = path.resolve('fixtures/visual-baselines')
const manifestPath = path.join(outputDir, 'public-ppt-page-visual-baselines.json')

export async function buildPublicPptPageVisualBaselinesManifest(options = {}) {
  const { baseUrl = 'http://localhost:5173', waitMs = 1200, write = true } = options
  const captures = []

  for (const visualCase of defaultPublicPptPageVisualCases) {
    const fileName = `${visualCase.caseId}-browser.png`
    const outputPath = path.join(outputDir, fileName)
    const stats = await fs.stat(outputPath)

    captures.push({
      caseId: visualCase.caseId,
      fileName,
      outputPath,
      fixtureFileName: visualCase.fileName,
      slide: visualCase.slide,
      url: `${baseUrl}/?fixture=${encodeURIComponent(visualCase.fileName)}&slide=${visualCase.slide}`,
      tags: visualCase.tags,
      note: visualCase.note,
      bytes: stats.size,
    })
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    waitMs,
    captures,
  }

  const text = `${JSON.stringify(manifest, null, 2)}\n`

  if (write) {
    await fs.writeFile(manifestPath, text)
  }

  return {
    manifestPath,
    caseCount: captures.length,
    text,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await buildPublicPptPageVisualBaselinesManifest()
  console.log(`Public PPT page visual baseline manifest generated: ${result.caseCount} cases`)
  console.log(result.manifestPath)
}
