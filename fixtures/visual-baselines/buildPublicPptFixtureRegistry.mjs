import fs from 'node:fs/promises'
import path from 'node:path'
import JSZip from 'jszip'

import { ignoredPublicPptFiles, publicPptFixtureMetadata } from './publicPptFixtureMetadata.mjs'

const publicDir = path.resolve('public')
const outputDir = path.resolve('fixtures/visual-baselines')
const outputPath = path.join(outputDir, 'public-ppt-fixture-registry.json')

export async function buildPublicPptFixtureRegistry(options = {}) {
  const { write = true } = options
  const files = (await fs.readdir(publicDir))
    .filter((fileName) => /\.pptx?$/i.test(fileName))
    .sort((left, right) => left.localeCompare(right))

  const ignoredByName = new Map(ignoredPublicPptFiles.map((entry) => [entry.fileName, entry]))
  const metadataByName = new Map(publicPptFixtureMetadata.map((entry) => [entry.fileName, entry]))
  const registryEntries = []
  const failures = []

  for (const fileName of files) {
    const ignored = ignoredByName.get(fileName)

    if (ignored) {
      continue
    }

    const metadata = metadataByName.get(fileName)

    if (!metadata) {
      failures.push(`缺少 metadata: ${fileName}`)
      continue
    }

    const slideCount = await getSlideCount(path.join(publicDir, fileName))

    registryEntries.push({
      fileName,
      filePath: `public/${fileName}`,
      fixtureUrl: `http://localhost:5173/?fixture=${encodeURIComponent(fileName)}`,
      slideCount,
      state: metadata.state,
      purpose: metadata.purpose,
      tags: metadata.tags,
      focusPages: metadata.focusPages,
      coverage: metadata.coverage,
    })
  }

  const unexpectedMetadata = publicPptFixtureMetadata
    .map((entry) => entry.fileName)
    .filter((fileName) => !files.includes(fileName))

  if (unexpectedMetadata.length > 0) {
    failures.push(`metadata 指向了不存在的 public PPT 文件: ${unexpectedMetadata.join(', ')}`)
  }

  if (failures.length > 0) {
    throw new Error(failures.join('\n'))
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceDir: publicDir,
    entryCount: registryEntries.length,
    ignoredFiles: ignoredPublicPptFiles,
    files: registryEntries,
  }

  const text = `${JSON.stringify(manifest, null, 2)}\n`

  if (write) {
    await fs.mkdir(outputDir, { recursive: true })
    await fs.writeFile(outputPath, text)
  }

  return {
    outputPath,
    entryCount: registryEntries.length,
    text,
  }
}

async function getSlideCount(filePath) {
  const buffer = await fs.readFile(filePath)
  const zip = await JSZip.loadAsync(buffer)
  return Object.keys(zip.files).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name)).length
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await buildPublicPptFixtureRegistry()
  console.log(`Public PPT fixture registry generated: ${result.entryCount} files`)
  console.log(result.outputPath)
}
