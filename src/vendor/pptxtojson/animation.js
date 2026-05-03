import { getTextByPathList } from './utils'

const TIMING_NODE_TRIGGERS = new Map([
  ['clickEffect', 'onClick'],
  ['withEffect', 'withPrevious'],
  ['afterEffect', 'afterPrevious'],
])

export function findTransitionNode(content, rootElement) {
  if (!content || !rootElement) return null

  const path1 = [rootElement, 'p:transition']
  let transitionNode = getTextByPathList(content, path1)
  if (transitionNode) return transitionNode

  const path2 = [rootElement, 'mc:AlternateContent', 'mc:Choice', 'p:transition']
  transitionNode = getTextByPathList(content, path2)
  if (transitionNode) return transitionNode

  const path3 = [rootElement, 'mc:AlternateContent', 'mc:Fallback', 'p:transition']
  transitionNode = getTextByPathList(content, path3)

  return transitionNode
}

export function findTimingNode(content, rootElement) {
  if (!content || !rootElement) return null

  const path1 = [rootElement, 'p:timing']
  let timingNode = getTextByPathList(content, path1)
  if (timingNode) return timingNode

  const path2 = [rootElement, 'mc:AlternateContent', 'mc:Choice', 'p:timing']
  timingNode = getTextByPathList(content, path2)
  if (timingNode) return timingNode

  const path3 = [rootElement, 'mc:AlternateContent', 'mc:Fallback', 'p:timing']
  timingNode = getTextByPathList(content, path3)

  return timingNode
}

export function findBuildListNode(content, rootElement) {
  if (!content || !rootElement) return null

  const path1 = [rootElement, 'p:bldLst']
  let buildListNode = getTextByPathList(content, path1)
  if (buildListNode) return buildListNode

  const path2 = [rootElement, 'mc:AlternateContent', 'mc:Choice', 'p:bldLst']
  buildListNode = getTextByPathList(content, path2)
  if (buildListNode) return buildListNode

  const path3 = [rootElement, 'mc:AlternateContent', 'mc:Fallback', 'p:bldLst']
  buildListNode = getTextByPathList(content, path3)

  return buildListNode
}

export function parseTransition(transitionNode) {
  if (!transitionNode) return null

  const transition = {
    type: 'none',
    duration: 1000,
    durationMs: 1000,
    direction: null,
    orientation: null,
  }

  const attrs = transitionNode.attrs || {}
  const customDuration = readDurationFromAttrs(attrs)
  if (customDuration != null) {
    transition.duration = customDuration
    transition.durationMs = customDuration
  }
  else if (attrs.spd) {
    const duration = mapSpeedToDuration(attrs.spd)
    transition.duration = duration
    transition.durationMs = duration
  }

  const advanceAfter = parseInteger(attrs.advTm)
  if (advanceAfter != null) {
    transition.advTm = advanceAfter
    transition.advanceAfterMs = advanceAfter
    transition.autoNextAfter = advanceAfter
  }

  const effectKey = findFirstEffectKey(transitionNode)
  if (!effectKey) {
    return transition
  }

  const effectNode = transitionNode[effectKey]
  const effectAttrs = effectNode && effectNode.attrs ? effectNode.attrs : {}

  transition.type = normalizeTransitionType(effectKey.substring(effectKey.indexOf(':') + 1))
  if (typeof effectAttrs.dir === 'string') transition.direction = effectAttrs.dir
  if (typeof effectAttrs.orient === 'string') transition.orientation = effectAttrs.orient

  const effectDuration = parseInteger(effectAttrs.dur)
  if (customDuration == null && effectDuration != null) {
    transition.duration = effectDuration
    transition.durationMs = effectDuration
  }

  return transition
}

export function parseAnimations(timingNode, buildListNode) {
  const timingAnimations = timingNode ? parseTimingAnimations(timingNode) : []
  const buildAnimations = buildListNode ? parseBuildListAnimations(buildListNode) : []
  return dedupeAnimations(resolveCharacterRangeParagraphBuilds([...timingAnimations, ...buildAnimations]))
}

function parseTimingAnimations(timingNode) {
  const animations = []
  walkTimingTree(timingNode, (node) => {
    const attrs = node && node.attrs ? node.attrs : null
    if (!attrs || !attrs.nodeType) return

    const trigger = TIMING_NODE_TRIGGERS.get(attrs.nodeType)
    if (!trigger) return

    const targetElementId = extractTargetElementId(node)
    if (targetElementId == null) return

    const animation = {
      id: attrs.id,
      trigger,
      durationMs: extractBehaviorDuration(node),
      effect: inferAnimationEffect(node),
      targetElementId,
    }

    const paragraphIndex = extractParagraphIndex(node)
    if (paragraphIndex != null) {
      animation.targetParagraphIndex = paragraphIndex
    }
    else {
      const characterRange = extractCharacterRange(node)
      if (characterRange) {
        animation.targetCharacterRange = characterRange
      }
    }

    const motionPath = extractMotionPath(node)
    if (motionPath) {
      animation.motionPath = motionPath
    }

    animations.push(animation)
  })

  return animations
}

function parseBuildListAnimations(buildListNode) {
  const buildNodes = buildListNode['p:bldP']
  if (!buildNodes) return []

  const buildList = Array.isArray(buildNodes) ? buildNodes : [buildNodes]
  const animations = []

  for (let index = 0; index < buildList.length; index += 1) {
    const buildNode = buildList[index]
    const attrs = buildNode && buildNode.attrs ? buildNode.attrs : {}
    const targetElementId = attrs.spid ?? extractTargetElementId(buildNode)
    if (targetElementId == null) continue

    const animation = {
      id: attrs.id ?? `build-${index + 1}`,
      trigger: 'onClick',
      durationMs: extractBehaviorDuration(buildNode),
      effect: inferAnimationEffect(buildNode),
      targetElementId,
    }

    const paragraphIndex = extractParagraphIndex(buildNode)
    if (paragraphIndex != null) {
      animation.targetParagraphIndex = paragraphIndex
    }
    else {
      const characterRange = extractCharacterRange(buildNode)
      if (characterRange) {
        animation.targetCharacterRange = characterRange
      }
    }

    animations.push(animation)
  }

  return animations
}

function walkTimingTree(node, visit) {
  if (!node || typeof node !== 'object') return

  visit(node)

  for (const key of Object.keys(node)) {
    if (key === 'attrs') continue
    const value = node[key]
    if (!value || typeof value !== 'object') continue
    if (Array.isArray(value)) {
      for (const item of value) walkTimingTree(item, visit)
    }
    else {
      walkTimingTree(value, visit)
    }
  }
}

function extractTargetElementId(node) {
  return readFirstPath(node, [
    ['p:childTnLst', 'p:set', 'p:cBhvr', 'p:tgtEl', 'p:spTgt', 'attrs', 'spid'],
    ['p:childTnLst', 'p:animEffect', 'p:cBhvr', 'p:tgtEl', 'p:spTgt', 'attrs', 'spid'],
    ['p:childTnLst', 'p:animMotion', 'p:cBhvr', 'p:tgtEl', 'p:spTgt', 'attrs', 'spid'],
    ['p:childTnLst', 'p:anim', 'p:cBhvr', 'p:tgtEl', 'p:spTgt', 'attrs', 'spid'],
    ['p:childTnLst', 'p:set', 'p:tgtEl', 'p:spTgt', 'attrs', 'spid'],
    ['p:childTnLst', 'p:animEffect', 'p:tgtEl', 'p:spTgt', 'attrs', 'spid'],
    ['p:childTnLst', 'p:animMotion', 'p:tgtEl', 'p:spTgt', 'attrs', 'spid'],
    ['p:childTnLst', 'p:anim', 'p:tgtEl', 'p:spTgt', 'attrs', 'spid'],
    ['p:cBhvr', 'p:tgtEl', 'p:spTgt', 'attrs', 'spid'],
    ['p:tgtEl', 'p:spTgt', 'attrs', 'spid'],
    ['attrs', 'spid'],
  ])
}

function extractBehaviorDuration(node) {
  const value = readFirstPath(node, [
    ['p:childTnLst', 'p:set', 'p:cBhvr', 'p:cTn', 'attrs', 'dur'],
    ['p:childTnLst', 'p:animEffect', 'p:cBhvr', 'p:cTn', 'attrs', 'dur'],
    ['p:childTnLst', 'p:animMotion', 'p:cBhvr', 'p:cTn', 'attrs', 'dur'],
    ['p:childTnLst', 'p:anim', 'p:cBhvr', 'p:cTn', 'attrs', 'dur'],
    ['p:cBhvr', 'p:cTn', 'attrs', 'dur'],
    ['p:cTn', 'attrs', 'dur'],
  ])
  const duration = parseInteger(value)
  return duration != null ? duration : 350
}

function inferAnimationEffect(node) {
  if (getTextByPathList(node, ['p:childTnLst', 'p:set']) || node['p:set']) return 'appear'

  const filter = readFirstPath(node, [
    ['p:childTnLst', 'p:animEffect', 'attrs', 'filter'],
    ['p:animEffect', 'attrs', 'filter'],
  ])
  if (typeof filter === 'string' && filter.length > 0) return filter

  return 'fade'
}

function extractParagraphIndex(node) {
  const value = readFirstPath(node, [
    ['p:childTnLst', 'p:set', 'p:cBhvr', 'p:tgtEl', 'p:spTgt', 'p:txEl', 'p:pRg', 'attrs', 'st'],
    ['p:childTnLst', 'p:animEffect', 'p:cBhvr', 'p:tgtEl', 'p:spTgt', 'p:txEl', 'p:pRg', 'attrs', 'st'],
    ['p:childTnLst', 'p:animMotion', 'p:cBhvr', 'p:tgtEl', 'p:spTgt', 'p:txEl', 'p:pRg', 'attrs', 'st'],
    ['p:childTnLst', 'p:anim', 'p:cBhvr', 'p:tgtEl', 'p:spTgt', 'p:txEl', 'p:pRg', 'attrs', 'st'],
    ['p:cBhvr', 'p:tgtEl', 'p:spTgt', 'p:txEl', 'p:pRg', 'attrs', 'st'],
    ['p:tgtEl', 'p:spTgt', 'p:txEl', 'p:pRg', 'attrs', 'st'],
    ['p:txEl', 'p:pRg', 'attrs', 'st'],
  ])
  return parseInteger(value)
}

function extractCharacterRange(node) {
  const start = parseInteger(readFirstPath(node, [
    ['p:childTnLst', 'p:set', 'p:cBhvr', 'p:tgtEl', 'p:spTgt', 'p:txEl', 'p:charRg', 'attrs', 'st'],
    ['p:childTnLst', 'p:animEffect', 'p:cBhvr', 'p:tgtEl', 'p:spTgt', 'p:txEl', 'p:charRg', 'attrs', 'st'],
    ['p:childTnLst', 'p:animMotion', 'p:cBhvr', 'p:tgtEl', 'p:spTgt', 'p:txEl', 'p:charRg', 'attrs', 'st'],
    ['p:childTnLst', 'p:anim', 'p:cBhvr', 'p:tgtEl', 'p:spTgt', 'p:txEl', 'p:charRg', 'attrs', 'st'],
    ['p:cBhvr', 'p:tgtEl', 'p:spTgt', 'p:txEl', 'p:charRg', 'attrs', 'st'],
    ['p:tgtEl', 'p:spTgt', 'p:txEl', 'p:charRg', 'attrs', 'st'],
    ['p:txEl', 'p:charRg', 'attrs', 'st'],
  ]))
  const end = parseInteger(readFirstPath(node, [
    ['p:childTnLst', 'p:set', 'p:cBhvr', 'p:tgtEl', 'p:spTgt', 'p:txEl', 'p:charRg', 'attrs', 'end'],
    ['p:childTnLst', 'p:animEffect', 'p:cBhvr', 'p:tgtEl', 'p:spTgt', 'p:txEl', 'p:charRg', 'attrs', 'end'],
    ['p:childTnLst', 'p:animMotion', 'p:cBhvr', 'p:tgtEl', 'p:spTgt', 'p:txEl', 'p:charRg', 'attrs', 'end'],
    ['p:childTnLst', 'p:anim', 'p:cBhvr', 'p:tgtEl', 'p:spTgt', 'p:txEl', 'p:charRg', 'attrs', 'end'],
    ['p:cBhvr', 'p:tgtEl', 'p:spTgt', 'p:txEl', 'p:charRg', 'attrs', 'end'],
    ['p:tgtEl', 'p:spTgt', 'p:txEl', 'p:charRg', 'attrs', 'end'],
    ['p:txEl', 'p:charRg', 'attrs', 'end'],
  ]))

  if (start == null || end == null) {
    return undefined
  }

  return { start, end }
}

function resolveCharacterRangeParagraphBuilds(animations) {
  const nextParagraphIndexByTarget = new Map()

  return animations.map((animation, index) => {
    if (
      animation.trigger !== 'onClick'
      || animation.targetParagraphIndex != null
      || !animation.targetCharacterRange
      || animation.targetElementId == null
    ) {
      return animation
    }

    const targetElementId = String(animation.targetElementId)
    const hasEarlierWholeReveal = animations.some((candidate, candidateIndex) => (
      candidateIndex < index
      && candidate.trigger === 'onClick'
      && String(candidate.targetElementId ?? '') === targetElementId
      && candidate.targetParagraphIndex == null
      && candidate.targetCharacterRange == null
    ))
    const startOffset = hasEarlierWholeReveal ? 1 : 0
    const nextParagraphIndex = nextParagraphIndexByTarget.get(targetElementId) ?? startOffset

    nextParagraphIndexByTarget.set(targetElementId, nextParagraphIndex + 1)

    return {
      ...animation,
      targetParagraphIndex: nextParagraphIndex,
    }
  })
}

function extractMotionPath(node) {
  const motionNode = node['p:animMotion'] || getTextByPathList(node, ['p:childTnLst', 'p:animMotion'])
  if (!motionNode || !motionNode.attrs) return undefined

  const motionPath = {}
  assignIfNumber(motionPath, 'xFrom', motionNode.attrs.fromX)
  assignIfNumber(motionPath, 'yFrom', motionNode.attrs.fromY)
  assignIfNumber(motionPath, 'xTo', motionNode.attrs.toX)
  assignIfNumber(motionPath, 'yTo', motionNode.attrs.toY)
  assignIfNumber(motionPath, 'xBy', motionNode.attrs.byX)
  assignIfNumber(motionPath, 'yBy', motionNode.attrs.byY)
  assignIfNumber(motionPath, 'rotateFrom', motionNode.attrs.rAng)
  assignIfNumber(motionPath, 'rotateTo', motionNode.attrs.rCtr)

  return Object.keys(motionPath).length ? motionPath : undefined
}

function assignIfNumber(target, key, value) {
  const parsed = parseFloatNumber(value)
  if (parsed != null) target[key] = parsed
}

function dedupeAnimations(animations) {
  const seen = new Set()
  const result = []

  for (const animation of animations) {
    const key = JSON.stringify({
      id: animation.id ?? '',
      trigger: animation.trigger ?? '',
      durationMs: animation.durationMs ?? '',
      effect: animation.effect ?? '',
      targetElementId: animation.targetElementId ?? '',
      targetParagraphIndex: animation.targetParagraphIndex ?? '',
      targetCharacterRange: animation.targetCharacterRange ?? null,
      motionPath: animation.motionPath ?? null,
    })

    if (seen.has(key)) continue
    seen.add(key)
    result.push(animation)
  }

  return result
}

function findFirstEffectKey(transitionNode) {
  const effectRegex = /^(p|p\d{2}):/
  for (const key in transitionNode) {
    if (key !== 'attrs' && effectRegex.test(key)) {
      return key
    }
  }
  return null
}

function readDurationFromAttrs(attrs) {
  for (const key of Object.keys(attrs)) {
    if (!/^p\d{2}:dur$/.test(key)) continue
    const parsed = parseInteger(attrs[key])
    if (parsed != null) return parsed
  }
  return null
}

function mapSpeedToDuration(speed) {
  switch (speed) {
    case 'slow':
      return 1200
    case 'fast':
      return 500
    case 'med':
    default:
      return 800
  }
}

function normalizeTransitionType(type) {
  if (type === 'pull') return 'uncover'
  return type
}

function readFirstPath(node, paths) {
  for (const path of paths) {
    const value = getTextByPathList(node, path)
    if (value !== undefined && value !== null) return value
  }
  return undefined
}

function parseInteger(value) {
  if (value == null || value === '' || value === 'indefinite') return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function parseFloatNumber(value) {
  if (value == null || value === '') return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}
