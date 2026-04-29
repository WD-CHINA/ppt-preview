import type { CSSProperties } from 'vue'
import type { NormalizedTableBorder, NormalizedTableCell, NormalizedTableMeta } from '../../types/presentation'

const CSS_PX_PER_POINT = 96 / 72
const FALLBACK_BORDER = '1px solid rgba(148, 163, 184, 0.55)'

type TableSide = 'top' | 'right' | 'bottom' | 'left'

export interface TableCellPosition {
  rowIndex: number
  columnIndex: number
}

export interface RenderableTableCell extends TableCellPosition {
  key: string
  cell: NormalizedTableCell
}

export function getTableGridTemplate(lengths: number[]) {
  return lengths.map((length) => `${formatPx(length)}px`).join(' ')
}

export function getRenderableTableCells(table: NormalizedTableMeta): RenderableTableCell[] {
  return table.cells.flatMap((row, rowIndex) => {
    let columnIndex = 0

    return row.flatMap((cell, cellIndex) => {
      if (isMergeContinuationCell(cell)) {
        return []
      }

      const item = { key: `${rowIndex}-${cellIndex}`, rowIndex, columnIndex, cell }
      columnIndex += Math.max(cell.colSpan ?? 1, 1)
      return [item]
    })
  })
}

export function getTableColumnCount(table: NormalizedTableMeta) {
  if (table.colWidths.length > 0) {
    return table.colWidths.length
  }

  return Math.max(1, ...table.cells.map((row) => getTableRowColumnCount(row)))
}

export function getTableCellStyle(
  cell: NormalizedTableCell,
  position?: TableCellPosition,
  table?: NormalizedTableMeta,
): CSSProperties {
  const typography = getTableCellTypography(cell, position, table)

  const textDecoration = [
    cell.fontUnderline ? 'underline' : '',
    cell.fontStrike ? 'line-through' : '',
  ].filter(Boolean).join(' ') || undefined

  return {
    gridColumn: cell.colSpan && cell.colSpan > 1 ? `span ${cell.colSpan}` : undefined,
    gridRow: cell.rowSpan && cell.rowSpan > 1 ? `span ${cell.rowSpan}` : undefined,
    alignItems: mapTableVerticalAlign(cell.vAlign),
    background: cell.highlightColor ?? cell.fillColor,
    color: cell.fontColor,
    fontFamily: cell.fontFamily,
    fontSize: typeof typography.fontSize === 'number' ? `${formatPx(typography.fontSize)}px` : undefined,
    fontWeight: cell.fontBold ? '700' : undefined,
    fontStyle: cell.fontItalic ? 'italic' : undefined,
    textDecoration,
    textTransform: cell.textTransform,
    letterSpacing: typeof cell.letterSpacing === 'number' ? `${formatPx(cell.letterSpacing)}px` : undefined,
    lineHeight: typography.lineHeight,
    padding: typography.padding,
    wordBreak: typography.wordBreak,
    overflowWrap: typography.overflowWrap,
    ...formatCellBorders(cell, position),
  }
}

function getTableCellTypography(
  cell: NormalizedTableCell,
  position?: TableCellPosition,
  table?: NormalizedTableMeta,
) {
  const effectiveFontSize = getEffectiveTableCellFontSize(cell)
  const fontSize = effectiveFontSize ?? cell.fontSize ?? 0
  const hasSingleLongWord = isSingleLongWordCell(cell.text)
  const availableWidth = getTableCellAvailableWidth(cell, position, table)
  const hasMultipleParagraphs = isMultiParagraphCell(cell.text)

  if (hasSingleLongWord && fontSize >= 14 && availableWidth != null && availableWidth <= 72) {
    return {
      fontSize: fontSize * 0.8,
      lineHeight: '1.15',
      padding: '4px 5px',
      wordBreak: 'keep-all' as const,
      overflowWrap: 'normal' as const,
    }
  }

  if (hasSingleLongWord && fontSize >= 14) {
    return {
      fontSize: fontSize * 0.9,
      lineHeight: '1.2',
      padding: '5px 6px',
      wordBreak: 'keep-all' as const,
      overflowWrap: 'normal' as const,
    }
  }

  if (hasMultipleParagraphs && fontSize > 0 && fontSize <= 16) {
    return {
      fontSize,
      lineHeight: '1.5',
      padding: '7px 8px',
      wordBreak: 'normal' as const,
      overflowWrap: 'break-word' as const,
    }
  }

  const explicitPadding = formatTableCellPadding(cell.padding)

  if (fontSize > 0 && fontSize <= 16) {
    return {
      fontSize,
      lineHeight: '1.35',
      padding: explicitPadding ?? '6px 8px',
    }
  }

  return {
    fontSize: fontSize || undefined,
    lineHeight: '1.25',
    padding: explicitPadding ?? '4px 6px',
  }
}

function formatTableCellPadding(padding?: NormalizedTableCell['padding']) {
  if (!padding) {
    return undefined
  }

  const top = formatPaddingSide(padding.top, 4)
  const right = formatPaddingSide(padding.right, 6)
  const bottom = formatPaddingSide(padding.bottom, 4)
  const left = formatPaddingSide(padding.left, 6)
  return `${top}px ${right}px ${bottom}px ${left}px`
}

function formatPaddingSide(value: number | undefined, fallbackPoints: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return formatPx(value)
  }

  return formatPx(pointToCssPx(fallbackPoints))
}


function getEffectiveTableCellFontSize(cell: NormalizedTableCell) {
  const htmlFontSizes = extractRunFontSizes(cell.text)

  if (htmlFontSizes.length === 0) {
    return cell.fontSize
  }

  const maxRunFontSize = Math.max(...htmlFontSizes)
  return Math.max(cell.fontSize ?? 0, maxRunFontSize)
}

function extractRunFontSizes(text?: string) {
  if (!text) {
    return []
  }

  const pattern = /font-size\s*:\s*([\d.]+)px/gi
  const fontSizes: number[] = []
  let match = pattern.exec(text)

  while (match) {
    const value = Number(match[1])
    if (Number.isFinite(value) && value > 0) {
      fontSizes.push(value)
    }
    match = pattern.exec(text)
  }

  return fontSizes
}

function getTableCellAvailableWidth(
  cell: NormalizedTableCell,
  position?: TableCellPosition,
  table?: NormalizedTableMeta,
) {
  if (!position || !table || table.colWidths.length === 0) {
    return undefined
  }

  const span = Math.max(cell.colSpan ?? 1, 1)
  const widths = table.colWidths.slice(position.columnIndex, position.columnIndex + span)

  if (widths.length === 0) {
    return undefined
  }

  return widths.reduce((sum, width) => sum + width, 0)
}

function isSingleLongWordCell(text?: string) {
  const plainText = extractTableCellText(text)

  if (!plainText || plainText.includes(' ')) {
    return false
  }

  return plainText.length >= 10
}

function isMultiParagraphCell(text?: string) {
  if (!text) {
    return false
  }

  const paragraphMatches = text.match(/<p\b/gi) ?? []
  return paragraphMatches.length > 1
}

function extractTableCellText(text?: string) {
  if (!text) {
    return ''
  }

  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatBorder(side: TableSide, border?: NormalizedTableBorder): CSSProperties {
  if (!border) {
    return {}
  }

  const width = typeof border.width === 'number' ? pointToCssPx(border.width) : 1
  const style = border.type === 'dashed' || border.type === 'dotted' ? border.type : 'solid'
  const color = border.color ?? '#94a3b8'
  const key = `border${capitalize(side)}` as keyof CSSProperties

  return {
    [key]: `${formatPx(width)}px ${style} ${color}`,
  }
}

function formatCellBorders(cell: NormalizedTableCell, position?: TableCellPosition): CSSProperties {
  const explicitBorders = {
    ...formatBorder('top', cell.borders?.top),
    ...formatBorder('right', cell.borders?.right),
    ...formatBorder('bottom', cell.borders?.bottom),
    ...formatBorder('left', cell.borders?.left),
  }

  return {
    ...formatFallbackBorder('top', explicitBorders, !position || position.rowIndex === 0),
    ...formatFallbackBorder('left', explicitBorders, !position || position.columnIndex === 0),
    ...formatFallbackBorder('right', explicitBorders, true),
    ...formatFallbackBorder('bottom', explicitBorders, true),
    ...explicitBorders,
  }
}

function formatFallbackBorder(side: TableSide, explicitBorders: CSSProperties, shouldRender: boolean): CSSProperties {
  const key = `border${capitalize(side)}` as keyof CSSProperties

  if (!shouldRender || explicitBorders[key]) {
    return {}
  }

  return {
    [key]: FALLBACK_BORDER,
  }
}

function mapTableVerticalAlign(vAlign?: string) {
  switch (vAlign) {
    case 'mid':
      return 'center'
    case 'down':
      return 'flex-end'
    default:
      return 'flex-start'
  }
}

function getTableRowColumnCount(row: NormalizedTableCell[]) {
  return row.reduce((count, cell) => {
    if (isMergeContinuationCell(cell)) {
      return count
    }

    return count + Math.max(cell.colSpan ?? 1, 1)
  }, 0)
}

function isMergeContinuationCell(cell: NormalizedTableCell) {
  return Boolean(cell.hMerge || cell.vMerge)
}

function pointToCssPx(value: number) {
  return value * CSS_PX_PER_POINT
}

function formatPx(value: number) {
  return Number(value.toFixed(4))
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}
