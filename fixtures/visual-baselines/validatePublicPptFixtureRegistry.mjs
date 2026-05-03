import fs from 'node:fs/promises'
import path from 'node:path'

import { buildPublicPptFixtureRegistry } from './buildPublicPptFixtureRegistry.mjs'

const registryPath = path.resolve('fixtures/visual-baselines/public-ppt-fixture-registry.json')

export async function validatePublicPptFixtureRegistry() {
  const generated = JSON.parse(await buildRegistryText())
  const existing = JSON.parse(await fs.readFile(registryPath, 'utf8'))

  if (!isEquivalentRegistry(existing, generated)) {
    throw new Error('public-ppt-fixture-registry.json 已过期，请重新生成。')
  }

  const manifest = existing
  const failures = []

  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    failures.push('registry.files 为空或不是数组')
  }

  for (const file of manifest.files ?? []) {
    if (typeof file.slideCount !== 'number' || file.slideCount <= 0) {
      failures.push(`${file.fileName} 的 slideCount 非法: ${file.slideCount}`)
    }

    if (typeof file.fixtureUrl !== 'string' || !file.fixtureUrl.includes('?fixture=')) {
      failures.push(`${file.fileName} 的 fixtureUrl 非法: ${file.fixtureUrl}`)
    }

    if (!Array.isArray(file.tags)) {
      failures.push(`${file.fileName} 的 tags 不是数组`)
    }

    if (!file.coverage || typeof file.coverage.browserVisual !== 'string') {
      failures.push(`${file.fileName} 缺少 coverage.browserVisual`)
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.join('\n'))
  }

  return {
    entryCount: manifest.files.length,
  }
}

function isEquivalentRegistry(existing, generated) {
  return JSON.stringify(stripVolatileFields(existing)) === JSON.stringify(stripVolatileFields(generated))
}

function stripVolatileFields(manifest) {
  return {
    ...manifest,
    generatedAt: '<ignored>',
  }
}

async function buildRegistryText() {
  const result = await buildPublicPptFixtureRegistry({ write: false })
  return result.text
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const result = await validatePublicPptFixtureRegistry()
    console.log(`Public PPT fixture registry validated: ${result.entryCount} files`)
  } catch (error) {
    console.error('Public PPT fixture registry validation failed:')
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
