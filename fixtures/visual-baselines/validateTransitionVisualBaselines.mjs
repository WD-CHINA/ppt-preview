import fs from 'node:fs/promises'
import path from 'node:path'

import { defaultTransitionVisualCases } from './captureTransitionVisualBaselines.mjs'

const outputDir = path.resolve('fixtures/visual-baselines')
const manifestPath = path.join(outputDir, 'transition-visual-baselines.json')

export async function validateTransitionVisualBaselines() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
  const failures = []

  if (!Array.isArray(manifest.captures)) {
    failures.push('manifest.captures 不是数组')
  }

  const captures = Array.isArray(manifest.captures) ? manifest.captures : []
  const actualCaseIds = captures.map((entry) => entry.caseId)
  const expectedCaseIds = [...defaultTransitionVisualCases]

  const missingCaseIds = expectedCaseIds.filter((caseId) => !actualCaseIds.includes(caseId))
  const unexpectedCaseIds = actualCaseIds.filter((caseId) => !expectedCaseIds.includes(caseId))

  if (missingCaseIds.length > 0) {
    failures.push(`manifest 缺少 case: ${missingCaseIds.join(', ')}`)
  }

  if (unexpectedCaseIds.length > 0) {
    failures.push(`manifest 出现未知 case: ${unexpectedCaseIds.join(', ')}`)
  }

  for (const caseId of expectedCaseIds) {
    const capture = captures.find((entry) => entry.caseId === caseId)

    if (!capture) {
      continue
    }

    const expectedFileName = `${caseId}-browser.png`
    const expectedUrl = `http://localhost:5173/?transitionCase=${caseId}`

    if (capture.fileName !== expectedFileName) {
      failures.push(`${caseId} 的 fileName 异常: ${capture.fileName}`)
    }

    if (capture.url !== expectedUrl) {
      failures.push(`${caseId} 的 url 异常: ${capture.url}`)
    }

    const filePath = path.join(outputDir, capture.fileName)
    let stats

    try {
      stats = await fs.stat(filePath)
    } catch {
      failures.push(`${caseId} 的截图文件不存在: ${filePath}`)
      continue
    }

    if (!stats.isFile()) {
      failures.push(`${caseId} 的截图路径不是文件: ${filePath}`)
      continue
    }

    if (stats.size <= 0) {
      failures.push(`${caseId} 的截图文件大小为 0: ${filePath}`)
    }

    if (typeof capture.bytes !== 'number' || capture.bytes <= 0) {
      failures.push(`${caseId} 的 manifest bytes 非法: ${capture.bytes}`)
    }

    if (typeof capture.bytes === 'number' && capture.bytes !== stats.size) {
      failures.push(`${caseId} 的 manifest bytes (${capture.bytes}) 与文件大小 (${stats.size}) 不一致`)
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.map((failure) => `- ${failure}`).join('\n'))
  }

  return {
    caseCount: expectedCaseIds.length,
  }
}

try {
  const result = await validateTransitionVisualBaselines()
  console.log(`Transition visual baselines validated: ${result.caseCount} cases`)
} catch (error) {
  console.error('Transition visual baselines validation failed:')
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
