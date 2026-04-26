export interface TransitionViewportInput {
  transitionType?: string
  transitionDirection?: string
  role?: 'current' | 'previous'
  progress?: number
  width: number
  height: number
}

export function getTransitionViewportStyle(input: TransitionViewportInput) {
  const progress = clampProgress(input.progress)
  const transition = 'none'

  if (input.role === 'previous') {
    switch (input.transitionType) {
      case 'push':
        return {
          transition,
          opacity: 1,
          transform: getPushTransform({ ...input, axisRole: 'previous', progress }),
        }
      case 'wipe':
        return {
          transition,
          opacity: 1,
          transform: 'none',
        }
      case 'fade':
      default:
        return {
          transition,
          opacity: 1 - progress,
          transform: `scale(${1 - progress * 0.02})`,
        }
    }
  }

  if (input.role === 'current') {
    switch (input.transitionType) {
      case 'push':
        return {
          transition,
          opacity: 1,
          transform: getPushTransform({ ...input, axisRole: 'current', progress }),
        }
      case 'wipe':
        return {
          transition,
          opacity: 1,
          transform: 'none',
          clipPath: getWipeClipPath(input.transitionDirection, progress),
        }
      case 'fade':
      default:
        return {
          transition,
          opacity: progress,
          transform: `translateY(${(1 - progress) * 18}px)`,
        }
    }
  }

  return { transition }
}

function clampProgress(progress?: number) {
  if (typeof progress !== 'number' || Number.isNaN(progress)) {
    return 1
  }

  return Math.max(0, Math.min(progress, 1))
}

function getPushTransform(
  input: TransitionViewportInput & { axisRole: 'current' | 'previous'; progress: number },
) {
  const direction = input.transitionDirection ?? 'r'
  const remaining = 1 - input.progress

  switch (direction) {
    case 'l':
      return `translateX(${input.axisRole === 'current' ? -input.width * remaining : input.width * input.progress}px)`
    case 'u':
      return `translateY(${input.axisRole === 'current' ? -input.height * remaining : input.height * input.progress}px)`
    case 'd':
      return `translateY(${input.axisRole === 'current' ? input.height * remaining : -input.height * input.progress}px)`
    case 'r':
    default:
      return `translateX(${input.axisRole === 'current' ? input.width * remaining : -input.width * input.progress}px)`
  }
}

function getWipeClipPath(direction: string | undefined, progress: number) {
  const hiddenPercent = Math.round((1 - progress) * 100)

  switch (direction) {
    case 'l':
      return `inset(0 0 0 ${hiddenPercent}%)`
    case 'u':
      return `inset(${hiddenPercent}% 0 0 0)`
    case 'd':
      return `inset(0 0 ${hiddenPercent}% 0)`
    case 'r':
    default:
      return `inset(0 ${hiddenPercent}% 0 0)`
  }
}
