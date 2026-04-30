export interface TransitionViewportInput {
  transitionType?: string
  transitionDirection?: string
  transitionOrientation?: string
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
      case 'cover':
        return {
          transition,
          opacity: 1,
          transform: 'none',
        }
      case 'uncover':
        return {
          transition,
          opacity: 1,
          transform: getPushTransform({ ...input, axisRole: 'previous', progress }),
        }
      case 'split':
        return {
          transition,
          opacity: 1,
          transform: 'none',
          clipPath: getSplitClipPath({ ...input, axisRole: 'previous', progress }),
        }
      case 'zoom':
        return {
          transition,
          opacity: 1 - progress,
          transform: `scale(${getZoomScale({ role: 'previous', progress })})`,
        }
      case 'wipe':
        return {
          transition,
          opacity: 1,
          transform: 'none',
        }
      case 'random':
        return {
          transition,
          opacity: 1 - progress,
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
      case 'cover':
        return {
          transition,
          opacity: 1,
          transform: getPushTransform({ ...input, axisRole: 'current', progress }),
        }
      case 'uncover':
        return {
          transition,
          opacity: 1,
          transform: 'none',
        }
      case 'split':
        return {
          transition,
          opacity: 1,
          transform: 'none',
          clipPath: getSplitClipPath({ ...input, axisRole: 'current', progress }),
        }
      case 'zoom':
        return {
          transition,
          opacity: progress,
          transform: `scale(${getZoomScale({ role: 'current', progress })})`,
        }
      case 'wipe':
        return {
          transition,
          opacity: 1,
          transform: 'none',
          clipPath: getWipeClipPath(input.transitionDirection, progress),
        }
      case 'random':
        return {
          transition,
          opacity: progress,
          transform: 'none',
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

function getSplitClipPath(
  input: TransitionViewportInput & { axisRole: 'current' | 'previous'; progress: number },
) {
  const orientation = input.transitionOrientation ?? 'vert'
  const direction = input.transitionDirection ?? 'out'
  const centerFraction = direction === 'in' ? 1 - input.progress : input.progress
  const region = direction === 'in'
    ? (input.axisRole === 'current' ? 'outer' : 'center')
    : (input.axisRole === 'current' ? 'center' : 'outer')

  return createSplitClipPath(orientation, centerFraction, region)
}

function createSplitClipPath(
  orientation: string,
  centerFraction: number,
  region: 'center' | 'outer',
) {
  const visibleFraction = roundTransitionScalar(Math.max(0, Math.min(centerFraction, 1)))

  if (region === 'center') {
    if (visibleFraction <= 0) {
      return orientation === 'horz'
        ? 'inset(0 50% 0 50%)'
        : 'inset(50% 0 50% 0)'
    }

    if (visibleFraction >= 1) {
      return 'none'
    }

    const edgePercent = roundTransitionScalar((1 - visibleFraction) * 50)
    return orientation === 'horz'
      ? `inset(0 ${edgePercent}% 0 ${edgePercent}%)`
      : `inset(${edgePercent}% 0 ${edgePercent}% 0)`
  }

  if (visibleFraction <= 0) {
    return 'none'
  }

  if (visibleFraction >= 1) {
    return orientation === 'horz'
      ? 'inset(0 50% 0 50%)'
      : 'inset(50% 0 50% 0)'
  }

  const startPercent = roundTransitionScalar((1 - visibleFraction) * 50)
  const endPercent = roundTransitionScalar(100 - startPercent)

  if (orientation === 'horz') {
    return [
      'polygon(evenodd,',
      '0 0, 100% 0, 100% 100%, 0 100%, 0 0,',
      `${startPercent}% 0, ${startPercent}% 100%, ${endPercent}% 100%, ${endPercent}% 0, ${startPercent}% 0)`,
    ].join(' ')
  }

  return [
    'polygon(evenodd,',
    '0 0, 100% 0, 100% 100%, 0 100%, 0 0,',
    `0 ${startPercent}%, 100% ${startPercent}%, 100% ${endPercent}%, 0 ${endPercent}%, 0 ${startPercent}%)`,
  ].join(' ')
}

function roundTransitionScalar(value: number) {
  return Math.round(value * 1000) / 1000
}

function getZoomScale(input: { role: 'current' | 'previous'; progress: number }) {
  const easedProgress = easeOutCubic(input.progress)

  if (input.role === 'current') {
    return roundTransitionScalar(0.68 + easedProgress * 0.32)
  }

  return roundTransitionScalar(1 + easedProgress * 0.16)
}

function easeOutCubic(progress: number) {
  return 1 - (1 - progress) * (1 - progress) * (1 - progress)
}
