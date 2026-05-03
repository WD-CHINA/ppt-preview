import { validatePublicPptPageVisualBaselines } from './validatePublicPptPageVisualBaselines.mjs'
import { validatePublicPptFixtureRegistry } from './validatePublicPptFixtureRegistry.mjs'
import { validateTransitionVisualBaselines } from './validateTransitionVisualBaselines.mjs'

async function main() {
  const transitionResult = await validateTransitionVisualBaselines()
  const publicPptPageResult = await validatePublicPptPageVisualBaselines()
  const registryResult = await validatePublicPptFixtureRegistry()

  console.log(
    `Visual baseline assets validated: transitions=${transitionResult.caseCount}, pageCases=${publicPptPageResult.caseCount}, publicPptFiles=${registryResult.entryCount}`,
  )
}

try {
  await main()
} catch (error) {
  console.error('Visual baseline asset validation failed:')
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
