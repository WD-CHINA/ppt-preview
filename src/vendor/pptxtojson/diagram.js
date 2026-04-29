import { readXmlFile } from './readXmlFile'
import { getTextNodeValue } from './text'
import { getTextByPathList } from './utils'

export async function loadDiagramFile(warpObj, filename, transformDrawing = false) {
  if (!filename) return null

  const cacheKey = `${transformDrawing ? 'drawing:' : 'xml:'}${filename}`
  if (warpObj.diagramFileCache[cacheKey]) return warpObj.diagramFileCache[cacheKey]

  let content = await readXmlFile(warpObj['zip'], filename)
  if (content && transformDrawing) {
    const contentStr = JSON.stringify(content).replace(/dsp:/g, 'p:')
    content = JSON.parse(contentStr)
  }

  warpObj.diagramFileCache[cacheKey] = content
  return content
}

export function getDiagramDrawingRelId(dataContent) {
  let extNodes = getTextByPathList(dataContent, ['dgm:dataModel', 'dgm:extLst', 'a:ext'])
  if (!extNodes) return ''

  if (!Array.isArray(extNodes)) extNodes = [extNodes]
  for (const extNode of extNodes) {
    const relId = getTextByPathList(extNode, ['dsp:dataModelExt', 'attrs', 'relId'])
    if (relId) return relId
  }

  return ''
}

export async function getDiagramNodeContext(node, warpObj) {
  const relIds = getTextByPathList(node, ['a:graphic', 'a:graphicData', 'dgm:relIds', 'attrs']) || {}
  const diagramContent = {
    data: null,
    layout: null,
    quickStyle: null,
    colors: null,
    drawing: null,
  }
  let digramFileContent = {}
  const diagramResObj = {}

  const diagramDataTarget = getTextByPathList(warpObj['slideResObj'], [relIds['r:dm'], 'target'])
  const diagramLayoutTarget = getTextByPathList(warpObj['slideResObj'], [relIds['r:lo'], 'target'])
  const diagramQuickStyleTarget = getTextByPathList(warpObj['slideResObj'], [relIds['r:qs'], 'target'])
  const diagramColorsTarget = getTextByPathList(warpObj['slideResObj'], [relIds['r:cs'], 'target'])

  if (diagramDataTarget) diagramContent.data = await loadDiagramFile(warpObj, diagramDataTarget)
  if (diagramLayoutTarget) diagramContent.layout = await loadDiagramFile(warpObj, diagramLayoutTarget)
  if (diagramQuickStyleTarget) diagramContent.quickStyle = await loadDiagramFile(warpObj, diagramQuickStyleTarget)
  if (diagramColorsTarget) diagramContent.colors = await loadDiagramFile(warpObj, diagramColorsTarget)

  const drawingRelId = diagramContent.data ? getDiagramDrawingRelId(diagramContent.data) : ''
  const drawingTarget = getTextByPathList(warpObj['slideResObj'], [drawingRelId, 'target'])

  if (drawingTarget) {
    digramFileContent = await loadDiagramFile(warpObj, drawingTarget, true) || {}
    diagramContent.drawing = digramFileContent

    const drawingName = drawingTarget.split('/').pop()
    const diagramResFileName = drawingTarget.replace(drawingName, '_rels/' + drawingName) + '.rels'
    const digramResContent = await readXmlFile(warpObj['zip'], diagramResFileName)
    if (digramResContent) {
      let relationshipArray = digramResContent['Relationships']['Relationship']
      if (relationshipArray && relationshipArray.constructor !== Array) relationshipArray = [relationshipArray]
      if (relationshipArray) {
        for (const relationshipArrayItem of relationshipArray) {
          let relTarget = relationshipArrayItem['attrs']['Target']
          if (relTarget.indexOf('../') !== -1) relTarget = relTarget.replace('../', 'ppt/')
          else relTarget = drawingTarget.replace(drawingName, '') + relTarget

          diagramResObj[relationshipArrayItem['attrs']['Id']] = {
            type: relationshipArrayItem['attrs']['Type'].replace('http://schemas.openxmlformats.org/officeDocument/2006/relationships/', ''),
            target: relTarget,
          }
        }
      }
    }
  }

  return {
    ...warpObj,
    digramFileContent,
    diagramResObj,
    diagramContent,
  }
}

function toArray(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function extractSmartArtNodeText(pt) {
  const textBody = getTextByPathList(pt, ['dgm:t'])
  if (!textBody) return ''

  let nodeText = ''
  const paragraphs = toArray(getTextByPathList(textBody, ['a:p']))
  for (const paragraph of paragraphs) {
    const runs = toArray(getTextByPathList(paragraph, ['a:r']))
    for (const run of runs) {
      const text = getTextNodeValue(getTextByPathList(run, ['a:t']))
      if (text && typeof text === 'string') nodeText += text
    }
    if (nodeText.length > 0) nodeText += '\n'
  }

  return nodeText.trim()
}

function normalizeSmartArtPoint(pt) {
  const modelId = getTextByPathList(pt, ['attrs', 'modelId']) || undefined
  const type = getTextByPathList(pt, ['attrs', 'type']) || undefined
  const presentation = getTextByPathList(pt, ['attrs', 'presAssocID'])
    || getTextByPathList(pt, ['dgm:prSet', 'attrs', 'presAssocID'])
    || getTextByPathList(pt, ['attrs', 'prSet', 'presAssocID'])
    || undefined
  const text = extractSmartArtNodeText(pt) || undefined

  return {
    id: modelId,
    type,
    text,
    presentationId: presentation,
  }
}

function normalizeSmartArtConnection(cxn) {
  return {
    id: getTextByPathList(cxn, ['attrs', 'modelId']) || undefined,
    type: getTextByPathList(cxn, ['attrs', 'type']) || undefined,
    sourceId: getTextByPathList(cxn, ['attrs', 'srcId']) || undefined,
    targetId: getTextByPathList(cxn, ['attrs', 'destId']) || undefined,
    sourceOrder: getTextByPathList(cxn, ['attrs', 'srcOrd']) || undefined,
    targetOrder: getTextByPathList(cxn, ['attrs', 'destOrd']) || undefined,
  }
}

function buildSmartArtTree(nodes, relations) {
  const nodeMap = new Map()
  const childIds = new Set()

  for (const node of nodes) {
    nodeMap.set(node.id, { ...node, children: [] })
  }

  for (const relation of relations) {
    if (!relation.sourceId || !relation.targetId) continue
    const parent = nodeMap.get(relation.sourceId)
    const child = nodeMap.get(relation.targetId)
    if (!parent || !child) continue
    parent.children.push(child)
    childIds.add(child.id)
  }

  return nodes
    .map(node => nodeMap.get(node.id))
    .filter(node => node && !childIds.has(node.id))
}

function extractShapeText(shape) {
  const paragraphs = toArray(getTextByPathList(shape, ['p:txBody', 'a:p']))
  const lines = []

  for (const paragraph of paragraphs) {
    let line = ''
    const runs = toArray(getTextByPathList(paragraph, ['a:r']))
    for (const run of runs) {
      const text = getTextNodeValue(getTextByPathList(run, ['a:t']))
      if (text && typeof text === 'string') line += text
    }
    if (line) lines.push(line)
  }

  return lines.join('\n') || undefined
}

function normalizeDrawingTarget(shape) {
  const extShapeProps = getTextByPathList(shape, ['p:nvSpPr', 'p:nvPr', 'p:extLst', 'a:ext', 'dsp:spPr'])
    || getTextByPathList(shape, ['p:nvSpPr', 'p:nvPr', 'p:extLst', 'a:ext', 'p:spPr'])

  return {
    shapeId: getTextByPathList(shape, ['p:nvSpPr', 'p:cNvPr', 'attrs', 'id']) || undefined,
    name: getTextByPathList(shape, ['p:nvSpPr', 'p:cNvPr', 'attrs', 'name']) || undefined,
    modelId: getTextByPathList(extShapeProps, ['attrs', 'modelId'])
      || getTextByPathList(shape, ['p:nvSpPr', 'p:nvPr', 'p:ph', 'attrs', 'idx'])
      || undefined,
    presentationId: getTextByPathList(extShapeProps, ['attrs', 'presAssocID']) || undefined,
    text: extractShapeText(shape),
  }
}

function mapSmartArtNodesToTargets(nodes, drawingTargets) {
  const targetsByModelId = new Map()
  const targetsByPresentationId = new Map()
  const targetsByText = new Map()

  for (const target of drawingTargets) {
    if (target.modelId) targetsByModelId.set(target.modelId, target)
    if (target.presentationId) targetsByPresentationId.set(target.presentationId, target)
    if (target.text) targetsByText.set(target.text, target)
  }

  return nodes.map(node => {
    const visualTarget = (node.id && targetsByModelId.get(node.id))
      || (node.presentationId && targetsByPresentationId.get(node.presentationId))
      || (node.text && targetsByText.get(node.text))
      || undefined

    return {
      ...node,
      visualTarget,
      visualTargetId: visualTarget?.shapeId,
    }
  })
}

export function getSmartArtTextData(dataContent) {
  return getSmartArtModel(dataContent).nodes
    .map(node => node.text)
    .filter(Boolean)
}

export function getSmartArtModel(dataContent, layoutContent, drawingContent) {
  const ptLst = toArray(getTextByPathList(dataContent, ['dgm:dataModel', 'dgm:ptLst', 'dgm:pt']))
  const cxnLst = toArray(getTextByPathList(dataContent, ['dgm:dataModel', 'dgm:cxnLst', 'dgm:cxn']))
  const nodes = ptLst.map(normalizeSmartArtPoint).filter(node => node.id)
  const relations = cxnLst.map(normalizeSmartArtConnection).filter(relation => relation.sourceId || relation.targetId)
  const layoutKind = getTextByPathList(layoutContent, ['dgm:layoutDef', 'attrs', 'uniqueId'])
    || getTextByPathList(layoutContent, ['dgm:layoutDef', 'attrs', 'type'])
    || getTextByPathList(layoutContent, ['dgm:layoutDef', 'attrs', 'title'])
    || undefined

  const drawingShapes = toArray(getTextByPathList(drawingContent, ['p:drawing', 'p:spTree', 'p:sp']))
  const drawingTargets = drawingShapes
    .map(normalizeDrawingTarget)
    .filter(target => target.shapeId || target.name || target.modelId || target.presentationId || target.text)
  const mappedNodes = mapSmartArtNodesToTargets(nodes, drawingTargets)

  return {
    layoutKind,
    nodes: mappedNodes,
    relations,
    tree: buildSmartArtTree(mappedNodes, relations),
    drawingTargets,
  }
}