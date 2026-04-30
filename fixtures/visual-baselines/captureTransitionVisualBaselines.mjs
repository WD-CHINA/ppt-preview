import fs from 'node:fs/promises'
import path from 'node:path'

export const defaultTransitionVisualCases = [
  'push-default-real',
  'push-up-real',
  'wipe-right-real',
  'wipe-left-real',
  'wipe-up-real',
  'wipe-down-real',
  'cover-right-real',
  'uncover-left-real',
  'zoom-default-real',
  'split-vert-out-real',
]

export async function captureTransitionVisualBaselines(options) {
  const {
    tab,
    baseUrl = 'http://localhost:5173',
    caseIds = defaultTransitionVisualCases,
    outputDir = path.resolve('fixtures/visual-baselines'),
    waitMs = 800,
  } = options

  if (!tab) {
    throw new Error('captureTransitionVisualBaselines 需要传入浏览器 tab')
  }

  await fs.mkdir(outputDir, { recursive: true })

  const captures = []

  for (const caseId of caseIds) {
    const targetUrl = `${baseUrl}/?transitionCase=${encodeURIComponent(caseId)}`
    await tab.goto(targetUrl)
    await tab.playwright.waitForLoadState({ state: 'load', timeoutMs: 15000 })
    await tab.playwright.waitForTimeout(waitMs)

    const screenshot = await tab.playwright.screenshot({ fullPage: false })
    const screenshotBase64 = await screenshot.toBase64()
    const screenshotBytes = Buffer.from(screenshotBase64, 'base64')
    const fileName = `${caseId}-browser.png`
    const outputPath = path.join(outputDir, fileName)

    await fs.writeFile(outputPath, screenshotBytes)

    captures.push({
      caseId,
      fileName,
      outputPath,
      url: targetUrl,
      bytes: screenshotBytes.length,
    })
  }

  const manifestPath = path.join(outputDir, 'transition-visual-baselines.json')
  await fs.writeFile(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl,
        waitMs,
        captures,
      },
      null,
      2,
    ),
  )

  return {
    outputDir,
    manifestPath,
    captures,
  }
}
