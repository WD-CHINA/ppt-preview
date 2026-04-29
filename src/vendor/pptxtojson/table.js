import { getShapeFill, getSolidFill } from './fill'
import { getTextByPathList } from './utils'
import { getBorder } from './border'
import {
  getFontType,
  getFontSize,
  getFontItalic,
  getFontDecoration,
  getFontDecorationLine,
  getFontSpace,
  getFontHighlight,
  getFontCaps,
  getFontLanguage,
} from './fontStyle'

function getTableTextColor(tcTxStyle, warpObj) {
  if (!tcTxStyle) return undefined

  return getSolidFill(tcTxStyle['a:solidFill'] || tcTxStyle, undefined, undefined, warpObj)
}

function readTableCellInset(tcNode) {
  const tcPr = getTextByPathList(tcNode, ['a:tcPr'])
  if (!tcPr) return undefined

  const marL = getTextByPathList(tcPr, ['attrs', 'marL'])
  const marR = getTextByPathList(tcPr, ['attrs', 'marR'])
  const marT = getTextByPathList(tcPr, ['attrs', 'marT'])
  const marB = getTextByPathList(tcPr, ['attrs', 'marB'])

  return {
    marL: marL ? parseInt(marL) / 12700 : undefined,
    marR: marR ? parseInt(marR) / 12700 : undefined,
    marT: marT ? parseInt(marT) / 12700 : undefined,
    marB: marB ? parseInt(marB) / 12700 : undefined,
  }
}

function readTableCellFont(tcNode, warpObj) {
  const textBodyNode = tcNode['a:txBody']
  const pNode = getTextByPathList(textBodyNode, ['a:p'])
  const paragraphNode = Array.isArray(pNode) ? pNode[0] : pNode
  const runNode = getTextByPathList(paragraphNode, ['a:r'])
  const firstRun = Array.isArray(runNode) ? runNode[0] : runNode

  if (!paragraphNode) return {}

  const fontFamily = getFontType(firstRun || paragraphNode, paragraphNode, textBodyNode, undefined, undefined, undefined, undefined, 1, warpObj)
  const fontSize = getFontSize(firstRun || paragraphNode, paragraphNode, textBodyNode, undefined, undefined, undefined, undefined, 1)
  const fontItalic = getFontItalic(firstRun || paragraphNode, paragraphNode, textBodyNode, undefined, undefined, undefined, undefined, 1)
  const fontUnderline = getFontDecoration(firstRun || paragraphNode, paragraphNode, textBodyNode, undefined, undefined, undefined, undefined, 1)
  const fontStrike = getFontDecorationLine(firstRun || paragraphNode, paragraphNode, textBodyNode, undefined, undefined, undefined, undefined, 1)
  const letterSpacing = getFontSpace(firstRun || paragraphNode, paragraphNode, textBodyNode, undefined, undefined, undefined, undefined, 1)
  const highlightColor = getFontHighlight(firstRun || paragraphNode, paragraphNode, textBodyNode, undefined, undefined, undefined, undefined, 1, warpObj)
  const textTransform = getFontCaps(firstRun || paragraphNode, paragraphNode, textBodyNode, undefined, undefined, undefined, undefined, 1)
  const lang = getFontLanguage(firstRun || paragraphNode, paragraphNode, textBodyNode, undefined, undefined, undefined, undefined, 1)

  return {
    fontFamily: fontFamily || undefined,
    fontSize: fontSize ? parseFloat(fontSize) : undefined,
    fontItalic: fontItalic === 'italic' ? true : undefined,
    fontUnderline: fontUnderline === 'underline' ? true : undefined,
    fontStrike: fontStrike === 'line-through' ? true : undefined,
    letterSpacing: letterSpacing ? parseFloat(letterSpacing) : undefined,
    highlightColor: highlightColor || undefined,
    textTransform: textTransform || undefined,
    lang: lang || undefined,
  }
}

function normalizeSourceChain(cellSources) {
  if (!Array.isArray(cellSources)) {
    return []
  }

  const seen = new Set()
  const sources = []

  for (const source of cellSources) {
    if (typeof source !== 'string' || source.length === 0 || seen.has(source)) {
      continue
    }
    seen.add(source)
    sources.push(source)
  }

  return sources
}

function getStyleNodeFromSource(thisTblStyle, source, path) {
  if (!thisTblStyle || !source) {
    return undefined
  }

  const normalizedPath = Array.isArray(path) ? path : [path]
  return getTextByPathList(thisTblStyle, [source, ...normalizedPath])
}

function getTableStyleSources(thisTblStyle, cellSources, includeWhole = true) {
  const sources = normalizeSourceChain(cellSources)

  if (includeWhole && thisTblStyle && thisTblStyle['a:wholeTbl']) {
    sources.unshift('a:wholeTbl')
  }

  return sources
}

function resolveStyleValue(sources, getter) {
  let resolved

  for (const source of sources) {
    const value = getter(source)
    if (value !== undefined && value !== null && value !== '') {
      resolved = value
    }
  }

  return resolved
}

function resolveTableFillFromSources(thisTblStyle, styleSources, warpObj) {
  return resolveStyleValue(styleSources, (source) => {
    const fillNode = getStyleNodeFromSource(thisTblStyle, source, ['a:tcStyle', 'a:fill', 'a:solidFill'])
    return fillNode ? getSolidFill(fillNode, undefined, undefined, warpObj) : undefined
  })
}

function resolveTableTextStyleFromSources(thisTblStyle, styleSources, warpObj) {
  const result = {}

  for (const source of styleSources) {
    const textStyle = getStyleNodeFromSource(thisTblStyle, source, ['a:tcTxStyle'])
    if (!textStyle) {
      continue
    }

    const fontColor = getTableTextColor(textStyle, warpObj)
    if (fontColor) result.fontColor = fontColor
    if (getTextByPathList(textStyle, ['attrs', 'b']) === 'on') result.fontBold = true
    if (getTextByPathList(textStyle, ['attrs', 'i']) === 'on') result.fontItalic = true
  }

  return result
}

function resolveTableBorderLine(tcNode, thisTblStyle, styleSources, localKey, styleKey) {
  const localLine = getTextByPathList(tcNode, ['a:tcPr', localKey])
  if (localLine) {
    return localLine
  }

  return resolveStyleValue(styleSources, (source) => getTextByPathList(thisTblStyle, [source, 'a:tcStyle', 'a:tcBdr', styleKey, 'a:ln']))
}

export function getTableBorders(node, warpObj) {
  const borders = {}
  if (node['a:bottom']) {
    const obj = {
      'p:spPr': {
        'a:ln': node['a:bottom']['a:ln']
      }
    }
    const border = getBorder(obj, undefined, warpObj)
    borders.bottom = border
  }
  if (node['a:top']) {
    const obj = {
      'p:spPr': {
        'a:ln': node['a:top']['a:ln']
      }
    }
    const border = getBorder(obj, undefined, warpObj)
    borders.top = border
  }
  if (node['a:right']) {
    const obj = {
      'p:spPr': {
        'a:ln': node['a:right']['a:ln']
      }
    }
    const border = getBorder(obj, undefined, warpObj)
    borders.right = border
  }
  if (node['a:left']) {
    const obj = {
      'p:spPr': {
        'a:ln': node['a:left']['a:ln']
      }
    }
    const border = getBorder(obj, undefined, warpObj)
    borders.left = border
  }
  return borders
}

export async function getTableCellParams(tcNode, thisTblStyle, cellSources, warpObj) {
  const rowSpan = getTextByPathList(tcNode, ['attrs', 'rowSpan'])
  const colSpan = getTextByPathList(tcNode, ['attrs', 'gridSpan'])
  const vMerge = getTextByPathList(tcNode, ['attrs', 'vMerge'])
  const hMerge = getTextByPathList(tcNode, ['attrs', 'hMerge'])
  const anchor = getTextByPathList(tcNode, ['a:tcPr', 'attrs', 'anchor'])
  const styleSources = getTableStyleSources(thisTblStyle, cellSources)

  let fillColor
  let fontColor
  let fontBold
  let fontItalic

  const cellFillNode = getTextByPathList(tcNode, ['a:tcPr'])
  if (cellFillNode) {
    const cellObj = { 'p:spPr': cellFillNode }
    const fill = await getShapeFill(cellObj, warpObj, 'slide')

    if (fill && fill.type === 'color' && fill.value) {
      fillColor = fill.value
    }
  }

  if (!fillColor) {
    fillColor = resolveTableFillFromSources(thisTblStyle, styleSources, warpObj)
  }

  const textStyle = resolveTableTextStyleFromSources(thisTblStyle, styleSources, warpObj)
  if (textStyle.fontColor) fontColor = textStyle.fontColor
  if (textStyle.fontBold) fontBold = true
  if (textStyle.fontItalic) fontItalic = true

  const lin_bottm = resolveTableBorderLine(tcNode, thisTblStyle, styleSources, 'a:lnB', 'a:bottom')
  const lin_top = resolveTableBorderLine(tcNode, thisTblStyle, styleSources, 'a:lnT', 'a:top')
  const lin_left = resolveTableBorderLine(tcNode, thisTblStyle, styleSources, 'a:lnL', 'a:left')
  const lin_right = resolveTableBorderLine(tcNode, thisTblStyle, styleSources, 'a:lnR', 'a:right')

  const borders = {}
  if (lin_bottm) borders.bottom = getBorder(lin_bottm, undefined, warpObj)
  if (lin_top) borders.top = getBorder(lin_top, undefined, warpObj)
  if (lin_left) borders.left = getBorder(lin_left, undefined, warpObj)
  if (lin_right) borders.right = getBorder(lin_right, undefined, warpObj)

  const inset = readTableCellInset(tcNode)
  const font = readTableCellFont(tcNode, warpObj)

  return {
    fillColor,
    fontColor,
    fontBold,
    fontItalic: font.fontItalic ?? fontItalic,
    borders,
    vAlign: (anchor === 'ctr') ? 'mid' : ((anchor === 'b') ? 'down' : 'up'),
    rowSpan: rowSpan ? +rowSpan : undefined,
    colSpan: colSpan ? +colSpan : undefined,
    vMerge: vMerge ? +vMerge : undefined,
    hMerge: hMerge ? +hMerge : undefined,
    marginLeft: inset ? inset.marL : undefined,
    marginRight: inset ? inset.marR : undefined,
    marginTop: inset ? inset.marT : undefined,
    marginBottom: inset ? inset.marB : undefined,
    fontFamily: font.fontFamily,
    fontSize: font.fontSize,
    fontUnderline: font.fontUnderline,
    fontStrike: font.fontStrike,
    letterSpacing: font.letterSpacing,
    highlightColor: font.highlightColor,
    textTransform: font.textTransform,
    lang: font.lang,
  }
}

export function getTableRowParams(trNodes, i, tblStylAttrObj, thisTblStyle, warpObj) {
  const styleSources = []

  if (i === 0 && tblStylAttrObj['isFrstRowAttr'] === 1 && thisTblStyle && thisTblStyle['a:firstRow']) {
    styleSources.push('a:firstRow')
  }
  else if (i > 0 && tblStylAttrObj['isBandRowAttr'] === 1 && thisTblStyle) {
    if ((i % 2) === 0 && thisTblStyle['a:band2H']) {
      styleSources.push('a:band2H')
    }
    if ((i % 2) !== 0 && thisTblStyle['a:band1H']) {
      styleSources.push('a:band1H')
    }
  }

  if (i === (trNodes.length - 1) && tblStylAttrObj['isLstRowAttr'] === 1 && thisTblStyle && thisTblStyle['a:lastRow']) {
    styleSources.push('a:lastRow')
  }

  const effectiveSources = getTableStyleSources(thisTblStyle, styleSources)
  const fillColor = resolveTableFillFromSources(thisTblStyle, effectiveSources, warpObj)
  const textStyle = resolveTableTextStyleFromSources(thisTblStyle, effectiveSources, warpObj)

  return {
    fillColor,
    fontColor: textStyle.fontColor,
    fontBold: textStyle.fontBold,
    fontItalic: textStyle.fontItalic,
  }
}
