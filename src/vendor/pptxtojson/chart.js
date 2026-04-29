import { eachElement, getTextByPathList } from './utils'
import { applyTint } from './color'
import { getTextNodeValue } from './text'

function extractChartColors(serNode, warpObj) {
  if (!serNode) return []

  if (serNode.constructor !== Array) serNode = [serNode]
  const schemeClrs = []
  for (const node of serNode) {
    let schemeClr = getTextByPathList(node, ['c:spPr', 'a:solidFill', 'a:schemeClr'])
    if (!schemeClr) schemeClr = getTextByPathList(node, ['c:spPr', 'a:ln', 'a:solidFill', 'a:schemeClr'])
    if (!schemeClr) schemeClr = getTextByPathList(node, ['c:marker', 'c:spPr', 'a:ln', 'a:solidFill', 'a:schemeClr'])

    let clr = getTextByPathList(schemeClr, ['attrs', 'val'])
    if (clr) {
      clr = getTextByPathList(warpObj['themeContent'], ['a:theme', 'a:themeElements', 'a:clrScheme', `a:${clr}`, 'a:srgbClr', 'attrs', 'val'])
      const tint = getTextByPathList(schemeClr, ['a:tint', 'attrs', 'val']) / 100000
      if (clr && !isNaN(tint)) {
        clr = applyTint(clr, tint)
      }
    }
    else clr = getTextByPathList(node, ['c:spPr', 'a:solidFill', 'a:srgbClr', 'attrs', 'val'])

    if (clr) clr = '#' + clr
    schemeClrs.push(clr)
  }
  return schemeClrs
}

function toSeriesList(serNode) {
  if (!serNode) return []
  return Array.isArray(serNode) ? serNode : [serNode]
}

function extractSeriesText(serEntry) {
  return getTextByPathList(serEntry, ['c:tx', 'c:strRef', 'c:strCache', 'c:pt', 'c:v'])
    || getTextByPathList(serEntry, ['c:tx', 'c:v'])
    || undefined
}

function extractChartSeries(serNode) {
  return toSeriesList(serNode).map((serEntry, index) => ({
    key: extractSeriesText(serEntry) || index,
    name: extractSeriesText(serEntry),
    index: getTextByPathList(serEntry, ['c:idx', 'attrs', 'val']) || undefined,
    order: getTextByPathList(serEntry, ['c:order', 'attrs', 'val']) || undefined,
  }))
}

function extractChartData(serNode) {
  const dataMat = []
  if (!serNode) return dataMat

  if (serNode['c:xVal']) {
    let dataRow = []
    eachElement(serNode['c:xVal']['c:numRef']['c:numCache']['c:pt'], innerNode => {
      dataRow.push(parseFloat(innerNode['c:v']))
      return ''
    })
    dataMat.push(dataRow)
    dataRow = []
    eachElement(serNode['c:yVal']['c:numRef']['c:numCache']['c:pt'], innerNode => {
      dataRow.push(parseFloat(innerNode['c:v']))
      return ''
    })
    dataMat.push(dataRow)
  }
  else {
    eachElement(serNode, (innerNode, index) => {
      const dataRow = []
      const colName = getTextByPathList(innerNode, ['c:tx', 'c:strRef', 'c:strCache', 'c:pt', 'c:v']) || index

      const rowNames = {}
      if (getTextByPathList(innerNode, ['c:cat', 'c:strRef', 'c:strCache', 'c:pt'])) {
        eachElement(innerNode['c:cat']['c:strRef']['c:strCache']['c:pt'], innerNode => {
          rowNames[innerNode['attrs']['idx']] = innerNode['c:v']
          return ''
        })
      }
      else if (getTextByPathList(innerNode, ['c:cat', 'c:numRef', 'c:numCache', 'c:pt'])) {
        eachElement(innerNode['c:cat']['c:numRef']['c:numCache']['c:pt'], innerNode => {
          rowNames[innerNode['attrs']['idx']] = innerNode['c:v']
          return ''
        })
      }

      if (getTextByPathList(innerNode, ['c:val', 'c:numRef', 'c:numCache', 'c:pt'])) {
        eachElement(innerNode['c:val']['c:numRef']['c:numCache']['c:pt'], innerNode => {
          dataRow.push({
            x: innerNode['attrs']['idx'],
            y: parseFloat(innerNode['c:v']),
          })
          return ''
        })
      }

      dataMat.push({
        key: colName,
        values: dataRow,
        xlabels: rowNames,
      })
      return ''
    })
  }

  return dataMat
}

function extractCategoryValues(serEntry) {
  const values = []
  const stringPoints = getTextByPathList(serEntry, ['c:cat', 'c:strRef', 'c:strCache', 'c:pt'])
  const numericPoints = getTextByPathList(serEntry, ['c:cat', 'c:numRef', 'c:numCache', 'c:pt'])
  const pointList = stringPoints || numericPoints
  if (!pointList) return values

  eachElement(pointList, pointNode => {
    values.push(getTextByPathList(pointNode, ['c:v']))
    return ''
  })

  return values
}

function extractValuePoints(serEntry, valuePathList) {
  const values = []
  const pointList = getTextByPathList(serEntry, valuePathList)
  if (!pointList) return values

  eachElement(pointList, pointNode => {
    values.push(parseFloat(getTextByPathList(pointNode, ['c:v'])))
    return ''
  })

  return values
}

function extractChartSchema(chartType, serNode) {
  const seriesList = toSeriesList(serNode)
  if (seriesList.length === 0) return undefined

  if (getTextByPathList(seriesList[0], ['c:xVal', 'c:numRef', 'c:numCache', 'c:pt'])) {
    return {
      mode: 'xy',
      series: seriesList.map((serEntry, index) => ({
        key: extractSeriesText(serEntry) || index,
        name: extractSeriesText(serEntry),
        index: getTextByPathList(serEntry, ['c:idx', 'attrs', 'val']) || undefined,
        order: getTextByPathList(serEntry, ['c:order', 'attrs', 'val']) || undefined,
        points: extractValuePoints(serEntry, ['c:xVal', 'c:numRef', 'c:numCache', 'c:pt']).map((x, pointIndex) => ({
          x,
          y: extractValuePoints(serEntry, ['c:yVal', 'c:numRef', 'c:numCache', 'c:pt'])[pointIndex],
        })),
      })),
    }
  }

  const categories = extractCategoryValues(seriesList[0])
  return {
    mode: chartType === 'pieChart' || chartType === 'pie3DChart' || chartType === 'doughnutChart' ? 'categorical-single' : 'categorical-multi',
    categories,
    series: seriesList.map((serEntry, index) => ({
      key: extractSeriesText(serEntry) || index,
      name: extractSeriesText(serEntry),
      index: getTextByPathList(serEntry, ['c:idx', 'attrs', 'val']) || undefined,
      order: getTextByPathList(serEntry, ['c:order', 'attrs', 'val']) || undefined,
      values: extractValuePoints(serEntry, ['c:val', 'c:numRef', 'c:numCache', 'c:pt']),
      points: extractValuePoints(serEntry, ['c:val', 'c:numRef', 'c:numCache', 'c:pt']).map((y, pointIndex) => ({
        category: categories[pointIndex],
        x: String(pointIndex),
        y,
      })),
    })),
  }
}

function extractChartSemantics(chartNode) {
  if (!chartNode) return undefined

  const semantics = {
    varyColors: getTextByPathList(chartNode, ['c:varyColors', 'attrs', 'val']) === '1',
    gapWidth: getTextByPathList(chartNode, ['c:gapWidth', 'attrs', 'val']) || undefined,
    overlap: getTextByPathList(chartNode, ['c:overlap', 'attrs', 'val']) || undefined,
    firstSliceAngle: getTextByPathList(chartNode, ['c:firstSliceAng', 'attrs', 'val']) || undefined,
  }

  return Object.values(semantics).some(value => value !== false && value !== undefined) ? semantics : undefined
}

function extractTextFragments(node) {
  if (!node) return ''

  const paragraphList = getTextByPathList(node, ['c:tx', 'c:rich', 'a:p']) || getTextByPathList(node, ['a:p'])
  if (!paragraphList) return ''

  const paragraphs = Array.isArray(paragraphList) ? paragraphList : [paragraphList]
  const lines = []

  for (const paragraph of paragraphs) {
    let line = ''

    const runs = getTextByPathList(paragraph, ['a:r'])
    if (runs) {
      const runList = Array.isArray(runs) ? runs : [runs]
      for (const run of runList) {
        const text = getTextNodeValue(getTextByPathList(run, ['a:t']))
        if (typeof text === 'string') line += text
      }
    }

    const endParaText = getTextNodeValue(getTextByPathList(paragraph, ['a:endParaRPr', 'a:t']))
    if (typeof endParaText === 'string') line += endParaText
    if (line) lines.push(line)
  }

  return lines.join('\n')
}

function extractChartTitle(chartNode) {
  const titleNode = getTextByPathList(chartNode, ['c:title'])
  if (!titleNode) return undefined

  return extractTextFragments(titleNode) || undefined
}

function extractChartLegend(chartNode) {
  const legendNode = getTextByPathList(chartNode, ['c:legend'])
  if (!legendNode) return undefined

  const legend = {
    position: getTextByPathList(legendNode, ['c:legendPos', 'attrs', 'val']) || undefined,
    overlay: getTextByPathList(legendNode, ['c:overlay', 'attrs', 'val']) === '1',
    hasLayout: Boolean(getTextByPathList(legendNode, ['c:layout'])),
  }

  return Object.values(legend).some(value => value !== false && value !== undefined) ? legend : undefined
}

function extractChartDataLabels(chartTypeNode) {
  const dataLabelsNode = getTextByPathList(chartTypeNode, ['c:dLbls'])
  if (!dataLabelsNode) return undefined

  const dataLabels = {
    showLegendKey: getTextByPathList(dataLabelsNode, ['c:showLegendKey', 'attrs', 'val']) === '1',
    showValue: getTextByPathList(dataLabelsNode, ['c:showVal', 'attrs', 'val']) === '1',
    showCategoryName: getTextByPathList(dataLabelsNode, ['c:showCatName', 'attrs', 'val']) === '1',
    showSeriesName: getTextByPathList(dataLabelsNode, ['c:showSerName', 'attrs', 'val']) === '1',
    showPercent: getTextByPathList(dataLabelsNode, ['c:showPercent', 'attrs', 'val']) === '1',
    showBubbleSize: getTextByPathList(dataLabelsNode, ['c:showBubbleSize', 'attrs', 'val']) === '1',
    showLeaderLines: getTextByPathList(dataLabelsNode, ['c:showLeaderLines', 'attrs', 'val']) === '1',
    position: getTextByPathList(dataLabelsNode, ['c:dLblPos', 'attrs', 'val']) || undefined,
  }

  return Object.values(dataLabels).some(value => value !== false && value !== undefined) ? dataLabels : undefined
}

function extractAxisInfo(axisNode) {
  if (!axisNode) return undefined

  const title = extractTextFragments(getTextByPathList(axisNode, ['c:title'])) || undefined
  const orientation = getTextByPathList(axisNode, ['c:scaling', 'c:orientation', 'attrs', 'val']) || undefined
  const position = getTextByPathList(axisNode, ['c:axPos', 'attrs', 'val']) || undefined
  const majorGridlines = Boolean(getTextByPathList(axisNode, ['c:majorGridlines']))
  const minorGridlines = Boolean(getTextByPathList(axisNode, ['c:minorGridlines']))

  const axis = {
    id: getTextByPathList(axisNode, ['c:axId', 'attrs', 'val']) || undefined,
    title,
    orientation,
    position,
    majorGridlines,
    minorGridlines,
    delete: getTextByPathList(axisNode, ['c:delete', 'attrs', 'val']) === '1',
    reverseOrder: getTextByPathList(axisNode, ['c:scaling', 'c:orientation', 'attrs', 'val']) === 'maxMin',
    crosses: getTextByPathList(axisNode, ['c:crosses', 'attrs', 'val']) || undefined,
    crossBetween: getTextByPathList(axisNode, ['c:crossBetween', 'attrs', 'val']) || undefined,
  }

  return Object.values(axis).some(value => value !== false && value !== undefined) ? axis : undefined
}

function extractPlotAreaAxes(plotArea) {
  return {
    categoryAxis: extractAxisInfo(plotArea['c:catAx']),
    valueAxis: extractAxisInfo(plotArea['c:valAx']),
    seriesAxis: extractAxisInfo(plotArea['c:serAx']),
    dateAxis: extractAxisInfo(plotArea['c:dateAx']),
  }
}

export function getChartInfo(plotArea, warpObj, chartNode) {
  let chart = null
  for (const key in plotArea) {
    if (!plotArea[key]['c:ser']) continue

    switch (key) {
      case 'c:lineChart':
        chart = {
          type: 'lineChart',
          data: extractChartData(plotArea[key]['c:ser']),
          series: extractChartSeries(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
          grouping: getTextByPathList(plotArea[key], ['c:grouping', 'attrs', 'val']),
          marker: plotArea[key]['c:marker'] ? true : false,
        }
        break
      case 'c:line3DChart':
        chart = {
          type: 'line3DChart',
          data: extractChartData(plotArea[key]['c:ser']),
          series: extractChartSeries(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
          grouping: getTextByPathList(plotArea[key], ['c:grouping', 'attrs', 'val']),
        }
        break
      case 'c:barChart':
        chart = {
          type: 'barChart',
          data: extractChartData(plotArea[key]['c:ser']),
          series: extractChartSeries(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
          grouping: getTextByPathList(plotArea[key], ['c:grouping', 'attrs', 'val']),
          barDir: getTextByPathList(plotArea[key], ['c:barDir', 'attrs', 'val']),
        }
        break
      case 'c:bar3DChart':
        chart = {
          type: 'bar3DChart',
          data: extractChartData(plotArea[key]['c:ser']),
          series: extractChartSeries(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
          grouping: getTextByPathList(plotArea[key], ['c:grouping', 'attrs', 'val']),
          barDir: getTextByPathList(plotArea[key], ['c:barDir', 'attrs', 'val']),
        }
        break
      case 'c:pieChart':
        chart = {
          type: 'pieChart',
          data: extractChartData(plotArea[key]['c:ser']),
          series: extractChartSeries(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser']['c:dPt'], warpObj),
        }
        break
      case 'c:pie3DChart':
        chart = {
          type: 'pie3DChart',
          data: extractChartData(plotArea[key]['c:ser']),
          series: extractChartSeries(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser']['c:dPt'], warpObj),
        }
        break
      case 'c:doughnutChart':
        chart = {
          type: 'doughnutChart',
          data: extractChartData(plotArea[key]['c:ser']),
          series: extractChartSeries(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser']['c:dPt'], warpObj),
          holeSize: getTextByPathList(plotArea[key], ['c:holeSize', 'attrs', 'val']),
        }
        break
      case 'c:areaChart':
        chart = {
          type: 'areaChart',
          data: extractChartData(plotArea[key]['c:ser']),
          series: extractChartSeries(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
          grouping: getTextByPathList(plotArea[key], ['c:grouping', 'attrs', 'val']),
        }
        break
      case 'c:area3DChart':
        chart = {
          type: 'area3DChart',
          data: extractChartData(plotArea[key]['c:ser']),
          series: extractChartSeries(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
          grouping: getTextByPathList(plotArea[key], ['c:grouping', 'attrs', 'val']),
        }
        break
      case 'c:scatterChart':
        chart = {
          type: 'scatterChart',
          data: extractChartData(plotArea[key]['c:ser']),
          series: extractChartSeries(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
          style: getTextByPathList(plotArea[key], ['c:scatterStyle', 'attrs', 'val']),
        }
        break
      case 'c:bubbleChart':
        chart = {
          type: 'bubbleChart',
          data: extractChartData(plotArea[key]['c:ser']),
          series: extractChartSeries(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
        }
        break
      case 'c:radarChart':
        chart = {
          type: 'radarChart',
          data: extractChartData(plotArea[key]['c:ser']),
          series: extractChartSeries(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
          style: getTextByPathList(plotArea[key], ['c:radarStyle', 'attrs', 'val']),
        }
        break
      case 'c:surfaceChart':
        chart = {
          type: 'surfaceChart',
          data: extractChartData(plotArea[key]['c:ser']),
          series: extractChartSeries(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
        }
        break
      case 'c:surface3DChart':
        chart = {
          type: 'surface3DChart',
          data: extractChartData(plotArea[key]['c:ser']),
          series: extractChartSeries(plotArea[key]['c:ser']),
          colors: extractChartColors(plotArea[key]['c:ser'], warpObj),
        }
        break
      case 'c:stockChart':
        chart = {
          type: 'stockChart',
          data: extractChartData(plotArea[key]['c:ser']),
          series: extractChartSeries(plotArea[key]['c:ser']),
          colors: [],
        }
        break
      default:
    }

    if (chart) {
      chart.schema = extractChartSchema(chart.type, plotArea[key]['c:ser'])
      chart.dataLabels = extractChartDataLabels(plotArea[key])
      chart.semantics = extractChartSemantics(plotArea[key])
      chart.stacked = chart.grouping === 'stacked' || chart.grouping === 'percentStacked'
      chart.percentStacked = chart.grouping === 'percentStacked'
      chart.seriesOrder = chart.series
        ? chart.series
          .filter(seriesEntry => seriesEntry.order !== undefined)
          .map(seriesEntry => ({
            key: seriesEntry.key,
            order: seriesEntry.order,
          }))
        : undefined
      break
    }
  }

  if (!chart) return chart

  const axes = extractPlotAreaAxes(plotArea)
  chart.title = chartNode ? extractChartTitle(chartNode) : undefined
  chart.legend = chartNode ? extractChartLegend(chartNode) : undefined
  if (axes.categoryAxis) chart.categoryAxis = axes.categoryAxis
  if (axes.valueAxis) chart.valueAxis = axes.valueAxis
  if (axes.seriesAxis) chart.seriesAxis = axes.seriesAxis
  if (axes.dateAxis) chart.dateAxis = axes.dateAxis

  return chart
}
