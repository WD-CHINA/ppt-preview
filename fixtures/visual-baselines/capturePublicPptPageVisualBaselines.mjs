import fs from 'node:fs/promises'
import path from 'node:path'

import { defaultPublicPptPageVisualCases } from './publicPptPageVisualCases.mjs'

export async function capturePublicPptPageVisualBaselines(options) {
  const {
    tab,
    baseUrl = 'http://localhost:5173',
    cases = defaultPublicPptPageVisualCases,
    outputDir = path.resolve('fixtures/visual-baselines'),
    waitMs = 1200,
  } = options

  if (!tab) {
    throw new Error('capturePublicPptPageVisualBaselines 需要传入浏览器 tab')
  }

  await fs.mkdir(outputDir, { recursive: true })

  const captures = []

  for (const visualCase of cases) {
    const targetUrl = `${baseUrl}/?fixture=${encodeURIComponent(visualCase.fileName)}&slide=${visualCase.slide}`
    await tab.goto(targetUrl)
    await tab.playwright.waitForLoadState({ state: 'load', timeoutMs: 15000 })
    await tab.playwright.waitForTimeout(waitMs)

    const screenshot = await tab.playwright.screenshot({ fullPage: false })
    const screenshotBase64 = await screenshot.toBase64()
    const screenshotBytes = Buffer.from(screenshotBase64, 'base64')
    const fileName = `${visualCase.caseId}-browser.png`
    const outputPath = path.join(outputDir, fileName)

    await fs.writeFile(outputPath, screenshotBytes)

    captures.push({
      caseId: visualCase.caseId,
      fileName,
      outputPath,
      fixtureFileName: visualCase.fileName,
      slide: visualCase.slide,
      url: targetUrl,
      tags: visualCase.tags,
      note: visualCase.note,
      bytes: screenshotBytes.length,
    })
  }

  const manifestPath = path.join(outputDir, 'public-ppt-page-visual-baselines.json')
  await fs.writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl,
        waitMs,
        captures,
      },
      null,
      2,
    )}\n`,
  )

  return {
    outputDir,
    manifestPath,
    captures,
  }
}
