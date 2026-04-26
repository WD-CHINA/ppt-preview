export interface TransitionViewportInput {
  transitionType?: string
  role?: 'current' | 'previous'
  progress?: number
  width: number
  height: number
}

export function getTransitionViewportStyle(input: TransitionViewportInput) {
  const progress = clampProgress(input.progress)

  if (input.role === 'previous') {
    switch (input.transitionType) {
      case 'push':
        return {
          opacity: 1,
          transform: `translateX(${-input.width * progress}px)`,
        }
      case 'wipe':
        return {
          opacity: 1,
          transform: 'none',
        }
      case 'fade':
      default:
        return {
          opacity: 1 - progress,
          transform: `scale(${1 - progress * 0.02})`,
        }
    }
  }

  if (input.role === 'current') {
    switch (input.transitionType) {
      case 'push':
        return {
          opacity: 1,
          transform: `translateX(${input.width * (1 - progress)}px)`,
        }
      case 'wipe':
        return {
          opacity: 1,
          transform: 'none',
          clipPath: `inset(0 ${Math.round((1 - progress) * 100)}% 0 0)`,
        }
      case 'fade':
      default:
        return {
          opacity: progress,
          transform: `translateY(${(1 - progress) * 18}px)`,
        }
    }
  }

  return {}
}

function clampProgress(progress?: number) {
  if (typeof progress !== 'number' || Number.isNaN(progress)) {
    return 1
  }

  return Math.max(0, Math.min(progress, 1))
}
