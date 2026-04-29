import { getTextByPathList } from './utils'

function getParagraphLevel(node) {
  let lvlIdx = 1
  const lvlNode = getTextByPathList(node, ['a:pPr', 'attrs', 'lvl'])
  if (lvlNode !== undefined) lvlIdx = parseInt(lvlNode) + 1
  return lvlIdx
}

function getAlignFromTextNode(node, lvlStr) {
  if (!node) return ''

  let algn = getTextByPathList(node, ['p:txBody', 'a:lstStyle', lvlStr, 'attrs', 'algn'])
  if (!algn) algn = getTextByPathList(node, ['p:txBody', 'a:p', 'a:pPr', 'attrs', 'algn'])

  return algn || ''
}

export function getHorizontalAlign(node, pNode, type, slideLayoutSpNode, slideMasterSpNode, warpObj) {
  let algn = getTextByPathList(node, ['a:pPr', 'attrs', 'algn'])

  if (!algn) algn = getTextByPathList(pNode, ['p:txBody', 'a:p', 'a:pPr', 'attrs', 'algn'])

  if (!algn) {
    const lvlIdx = getParagraphLevel(node)
    const lvlStr = 'a:lvl' + lvlIdx + 'pPr'

    algn = getAlignFromTextNode(slideLayoutSpNode, lvlStr)
    if (!algn) algn = getAlignFromTextNode(slideMasterSpNode, lvlStr)

    if (!algn && (type === 'title' || type === 'ctrTitle' || type === 'subTitle')) {
      algn = getTextByPathList(warpObj, ['slideMasterTextStyles', 'p:titleStyle', lvlStr, 'attrs', 'algn'])
      if (!algn && type === 'subTitle') {
        algn = getTextByPathList(warpObj, ['slideMasterTextStyles', 'p:bodyStyle', lvlStr, 'attrs', 'algn'])
      }
    } 
    else if (!algn && type === 'body') {
      algn = getTextByPathList(warpObj, ['slideMasterTextStyles', 'p:bodyStyle', lvlStr, 'attrs', 'algn'])
    } 
    else if (!algn) {
      algn = getTextByPathList(warpObj, ['slideMasterTextStyles', 'p:otherStyle', lvlStr, 'attrs', 'algn'])
    }
  }

  let align = 'left'
  if (algn) {
    switch (algn) {
      case 'l':
        align = 'left'
        break
      case 'r':
        align = 'right'
        break
      case 'ctr':
        align = 'center'
        break
      case 'just':
        align = 'justify'
        break
      case 'dist':
        align = 'justify'
        break
      default:
        align = 'inherit'
    }
  }
  return align
}

export function getVerticalAlign(node, slideLayoutSpNode, slideMasterSpNode) {
  let anchor = getTextByPathList(node, ['p:txBody', 'a:bodyPr', 'attrs', 'anchor'])
  if (!anchor) {
    anchor = getTextByPathList(slideLayoutSpNode, ['p:txBody', 'a:bodyPr', 'attrs', 'anchor'])
    if (!anchor) {
      anchor = getTextByPathList(slideMasterSpNode, ['p:txBody', 'a:bodyPr', 'attrs', 'anchor'])
      if (!anchor) anchor = 't'
    }
  }
  return (anchor === 'ctr') ? 'mid' : ((anchor === 'b') ? 'down' : 'up')
}

export function getTextAutoFit(node, slideLayoutSpNode, slideMasterSpNode) {
  function checkBodyPr(bodyPr, source) {
    if (!bodyPr) return null

    if (bodyPr['a:noAutofit']) {
      return {
        result: {
          type: 'none',
          enabled: false,
          source,
        }
      }
    }
    else if (bodyPr['a:spAutoFit']) {
      return {
        result: {
          type: 'shape',
          enabled: true,
          source,
        }
      }
    }
    else if (bodyPr['a:normAutofit']) {
      const normAutofitNode = bodyPr['a:normAutofit']
      const fontScale = getTextByPathList(normAutofitNode, ['attrs', 'fontScale'])
      const lnSpcReduction = getTextByPathList(normAutofitNode, ['attrs', 'lnSpcReduction'])
      const result = {
        type: 'text',
        enabled: true,
        source,
      }

      if (fontScale) {
        result.fontScale = parseInt(fontScale) / 1000
      }
      if (lnSpcReduction) {
        result.lineSpacingReduction = parseInt(lnSpcReduction) / 1000
      }

      return { result }
    }
    return null
  }

  const nodeCheck = checkBodyPr(getTextByPathList(node, ['p:txBody', 'a:bodyPr']), 'shape')
  if (nodeCheck) return nodeCheck.result

  const layoutCheck = checkBodyPr(getTextByPathList(slideLayoutSpNode, ['p:txBody', 'a:bodyPr']), 'layout')
  if (layoutCheck) return layoutCheck.result

  const masterCheck = checkBodyPr(getTextByPathList(slideMasterSpNode, ['p:txBody', 'a:bodyPr']), 'master')
  if (masterCheck) return masterCheck.result

  return null
}

function pushParagraphStyleNode(styleNodes, styleNode) {
  if (styleNode) styleNodes.push(styleNode)
}

function appendTextBodyParagraphStyleNodes(styleNodes, textBodyNode, lvl) {
  if (!textBodyNode) return

  const lvlPath = `a:lvl${lvl}pPr`
  pushParagraphStyleNode(styleNodes, getTextByPathList(textBodyNode, ['a:lstStyle', lvlPath]))
}

function appendShapeParagraphStyleNodes(styleNodes, shapeNode, lvl) {
  if (!shapeNode) return

  const lvlPath = `a:lvl${lvl}pPr`
  pushParagraphStyleNode(styleNodes, getTextByPathList(shapeNode, ['p:txBody', 'a:lstStyle', lvlPath]))
  pushParagraphStyleNode(styleNodes, getTextByPathList(shapeNode, ['p:txBody', 'a:p', 'a:pPr']))
}

function appendMasterTextParagraphStyleNodes(styleNodes, type, lvl, slideMasterTextStyles) {
  if (!slideMasterTextStyles) return

  const lvlPath = `a:lvl${lvl}pPr`

  if (type === 'title' || type === 'ctrTitle' || type === 'subTitle') {
    pushParagraphStyleNode(styleNodes, getTextByPathList(slideMasterTextStyles, ['p:titleStyle', lvlPath]))
    if (type === 'subTitle') {
      pushParagraphStyleNode(styleNodes, getTextByPathList(slideMasterTextStyles, ['p:bodyStyle', lvlPath]))
    }
  }
  else if (type === 'body') {
    pushParagraphStyleNode(styleNodes, getTextByPathList(slideMasterTextStyles, ['p:bodyStyle', lvlPath]))
  }
  else {
    pushParagraphStyleNode(styleNodes, getTextByPathList(slideMasterTextStyles, ['p:otherStyle', lvlPath]))
  }
}

function appendDefaultTextParagraphStyleNodes(styleNodes, defaultTextStyle, lvl) {
  if (!defaultTextStyle) return

  const lvlPath = `a:lvl${lvl}pPr`
  pushParagraphStyleNode(styleNodes, getTextByPathList(defaultTextStyle, [lvlPath]))
  pushParagraphStyleNode(styleNodes, getTextByPathList(defaultTextStyle, ['a:defPPr']))
}

export function getParagraphStyleNodes(pNode, textBodyNode, slideLayoutSpNode, slideMasterSpNode, type, slideMasterTextStyles, warpObj) {
  if (!pNode) return null

  const pPrNode = pNode['a:pPr']
  const lvl = getParagraphLevel(pNode)
  const styleNodes = []

  pushParagraphStyleNode(styleNodes, pPrNode)
  appendTextBodyParagraphStyleNodes(styleNodes, textBodyNode, lvl)
  appendShapeParagraphStyleNodes(styleNodes, slideLayoutSpNode, lvl)
  appendShapeParagraphStyleNodes(styleNodes, slideMasterSpNode, lvl)
  appendMasterTextParagraphStyleNodes(styleNodes, type, lvl, slideMasterTextStyles)
  appendDefaultTextParagraphStyleNodes(styleNodes, getTextByPathList(warpObj, ['defaultTextStyle']), lvl)

  return styleNodes
}

function getLineSpacingValue(spacingNode) {
  const spcPct = getTextByPathList(spacingNode, ['a:spcPct', 'attrs', 'val'])
  const spcPts = getTextByPathList(spacingNode, ['a:spcPts', 'attrs', 'val'])

  if (spcPct) return parseInt(spcPct) / 1000 / 100
  if (spcPts) return parseInt(spcPts) / 100 + 'pt'

  return undefined
}

function getParagraphSpacingValue(spacingNode) {
  const spcPct = getTextByPathList(spacingNode, ['a:spcPct', 'attrs', 'val'])
  const spcPts = getTextByPathList(spacingNode, ['a:spcPts', 'attrs', 'val'])

  if (spcPct) return parseInt(spcPct) / 1000 + 'em'
  if (spcPts) return parseInt(spcPts) / 100 + 'pt'

  return undefined
}

function emuToPoints(value) {
  if (value === undefined || value === null || value === '') return undefined

  const numericValue = parseInt(value)
  if (!Number.isFinite(numericValue)) return undefined

  return numericValue / 12700
}

export function getParagraphIndent(pNode, textBodyNode, slideLayoutSpNode, slideMasterSpNode, type, slideMasterTextStyles, warpObj) {
  const styleNodes = getParagraphStyleNodes(pNode, textBodyNode, slideLayoutSpNode, slideMasterSpNode, type, slideMasterTextStyles, warpObj)
  if (!styleNodes) return null

  const indent = {}

  for (const styleNode of styleNodes) {
    if (indent.marginLeft === undefined) {
      const marginLeft = emuToPoints(getTextByPathList(styleNode, ['attrs', 'marL']))
      if (marginLeft !== undefined) indent.marginLeft = marginLeft
    }

    if (indent.indent === undefined) {
      const firstLineIndent = emuToPoints(getTextByPathList(styleNode, ['attrs', 'indent']))
      if (firstLineIndent !== undefined) indent.indent = firstLineIndent
    }
  }

  if (indent.marginLeft !== undefined && indent.indent !== undefined) {
    if (indent.indent < 0) indent.hanging = Math.abs(indent.indent)
    else if (indent.marginLeft > indent.indent) indent.hanging = indent.marginLeft - indent.indent
  }

  return Object.keys(indent).length > 0 ? indent : null
}

export function getParagraphSpacing(pNode, textBodyNode, slideLayoutSpNode, slideMasterSpNode, type, slideMasterTextStyles, warpObj) {
  const styleNodes = getParagraphStyleNodes(pNode, textBodyNode, slideLayoutSpNode, slideMasterSpNode, type, slideMasterTextStyles, warpObj)
  if (!styleNodes) return null

  const spacing = {}

  for (const styleNode of styleNodes) {
    if (spacing.lineSpacing === undefined) {
      const lineSpacing = getLineSpacingValue(styleNode['a:lnSpc'])
      if (lineSpacing !== undefined) spacing.lineSpacing = lineSpacing
    }

    if (spacing.spaceBefore === undefined) {
      const spaceBefore = getParagraphSpacingValue(styleNode['a:spcBef'])
      if (spaceBefore !== undefined) spacing.spaceBefore = spaceBefore
    }

    if (spacing.spaceAfter === undefined) {
      const spaceAfter = getParagraphSpacingValue(styleNode['a:spcAft'])
      if (spaceAfter !== undefined) spacing.spaceAfter = spaceAfter
    }
  }

  return Object.keys(spacing).length > 0 ? spacing : null
}

export function getParagraphTabStops(pNode, textBodyNode, slideLayoutSpNode, slideMasterSpNode, type, slideMasterTextStyles, warpObj) {
  const styleNodes = getParagraphStyleNodes(pNode, textBodyNode, slideLayoutSpNode, slideMasterSpNode, type, slideMasterTextStyles, warpObj)
  if (!styleNodes) return null

  for (const styleNode of styleNodes) {
    const tabs = styleNode['a:tabLst'] ? styleNode['a:tabLst']['a:tab'] : undefined
    if (!tabs) continue

    const tabNodes = tabs.constructor === Array ? tabs : [tabs]
    const normalizedTabs = tabNodes
      .map((tabNode) => {
        const position = emuToPoints(getTextByPathList(tabNode, ['attrs', 'pos']))
        if (position === undefined) return null

        return {
          position,
          align: getTextByPathList(tabNode, ['attrs', 'algn']) || undefined,
        }
      })
      .filter(Boolean)

    if (normalizedTabs.length > 0) return normalizedTabs
  }

  return null
}

export function getParagraphDefaults(pNode, textBodyNode, slideLayoutSpNode, slideMasterSpNode, type, slideMasterTextStyles, warpObj) {
  const styleNodes = getParagraphStyleNodes(pNode, textBodyNode, slideLayoutSpNode, slideMasterSpNode, type, slideMasterTextStyles, warpObj)
  if (!styleNodes) return null

  const defaults = {}

  for (const styleNode of styleNodes) {
    if (defaults.rtl === undefined) {
      const rtl = getTextByPathList(styleNode, ['attrs', 'rtl'])
      if (rtl !== undefined && rtl !== '') defaults.rtl = rtl === '1'
    }

    if (defaults.fontAlign === undefined) {
      const fontAlign = getTextByPathList(styleNode, ['attrs', 'fontAlgn'])
      if (fontAlign) defaults.fontAlign = fontAlign
    }

    if (defaults.defaultTabSize === undefined) {
      const defaultTabSize = emuToPoints(getTextByPathList(styleNode, ['attrs', 'defTabSz']))
      if (defaultTabSize !== undefined) defaults.defaultTabSize = defaultTabSize
    }
  }

  return Object.keys(defaults).length > 0 ? defaults : null
}
