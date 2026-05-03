import fs from 'node:fs/promises'
import path from 'node:path'

import { buildPublicPptPageVisualBaselinesManifest } from './buildPublicPptPageVisualBaselinesManifest.mjs'
import { defaultPublicPptPageVisualCases } from './publicPptPageVisualCases.mjs'

const outputDir = path.resolve('fixtures/visual-baselines')
const manifestPath = path.join(outputDir, 'public-ppt-page-visual-baselines.json')

export async function validatePublicPptPageVisualBaselines() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
  const expectedManifest = JSON.parse((await buildPublicPptPageVisualBaselinesManifest({ write: false })).text)
  const failures = []

  if (!isEquivalentManifest(manifest, expectedManifest)) {
    failures.push('public-ppt-page-visual-baselines.json 已过期，请重新生成。')
  }

  if (!Array.isArray(manifest.captures)) {
    failures.push('manifest.captures 不是数组')
  }

  const captures = Array.isArray(manifest.captures) ? manifest.captures : []
  const expectedCases = [...defaultPublicPptPageVisualCases]
  const actualCaseIds = captures.map((entry) => entry.caseId)
  const expectedCaseIds = expectedCases.map((entry) => entry.caseId)

  const missingCaseIds = expectedCaseIds.filter((caseId) => !actualCaseIds.includes(caseId))
  const unexpectedCaseIds = actualCaseIds.filter((caseId) => !expectedCaseIds.includes(caseId))

  if (missingCaseIds.length > 0) {
    failures.push(`manifest 缺少 case: ${missingCaseIds.join(', ')}`)
  }

  if (unexpectedCaseIds.length > 0) {
    failures.push(`manifest 出现未知 case: ${unexpectedCaseIds.join(', ')}`)
  }

  for (const expectedCase of expectedCases) {
    const capture = captures.find((entry) => entry.caseId === expectedCase.caseId)

    if (!capture) {
      continue
    }

    const expectedFileName = `${expectedCase.caseId}-browser.png`
    const expectedUrl = `http://localhost:5173/?fixture=${encodeURIComponent(expectedCase.fileName)}&slide=${expectedCase.slide}`

    if (capture.fileName !== expectedFileName) {
      failures.push(`${expectedCase.caseId} 的 fileName 异常: ${capture.fileName}`)
    }

    if (capture.url !== expectedUrl) {
      failures.push(`${expectedCase.caseId} 的 url 异常: ${capture.url}`)
    }

    if (capture.fixtureFileName !== expectedCase.fileName) {
      failures.push(`${expectedCase.caseId} 的 fixtureFileName 异常: ${capture.fixtureFileName}`)
    }

    if (capture.slide !== expectedCase.slide) {
      failures.push(`${expectedCase.caseId} 的 slide 异常: ${capture.slide}`)
    }

    const filePath = path.join(outputDir, capture.fileName)
    let stats

    try {
      stats = await fs.stat(filePath)
    } catch {
      failures.push(`${expectedCase.caseId} 的截图文件不存在: ${filePath}`)
      continue
    }

    if (!stats.isFile()) {
      failures.push(`${expectedCase.caseId} 的截图路径不是文件: ${filePath}`)
      continue
    }

    if (stats.size <= 0) {
      failures.push(`${expectedCase.caseId} 的截图文件大小为 0: ${filePath}`)
    }

    if (typeof capture.bytes !== 'number' || capture.bytes <= 0) {
      failures.push(`${expectedCase.caseId} 的 manifest bytes 非法: ${capture.bytes}`)
    }

    if (typeof capture.bytes === 'number' && capture.bytes !== stats.size) {
      failures.push(`${expectedCase.caseId} 的 manifest bytes (${capture.bytes}) 与文件大小 (${stats.size}) 不一致`)
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.map((failure) => `- ${failure}`).join('\n'))
  }

  return {
    caseCount: expectedCases.length,
  }
}

function isEquivalentManifest(existing, generated) {
  return JSON.stringify(stripVolatileFields(existing)) === JSON.stringify(stripVolatileFields(generated))
}

function stripVolatileFields(manifest) {
  return {
    ...manifest,
    generatedAt: '<ignored>',
  }
}

try {
  const result = await validatePublicPptPageVisualBaselines()
  console.log(`Public PPT page visual baselines validated: ${result.caseCount} cases`)
} catch (error) {
  console.error('Public PPT page visual baselines validation failed:')
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
