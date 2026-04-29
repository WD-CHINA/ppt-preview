import { describe, expect, it } from 'vitest'
import type { NormalizedTableCell, NormalizedTableMeta } from '../../types/presentation'
import {
  getRenderableTableCells,
  getTableCellStyle,
  getTableColumnCount,
  getTableGridTemplate,
} from './tableModel'

describe('tableModel', () => {
  it('uses normalized row and column dimensions as css grid tracks', () => {
    expect(getTableGridTemplate([16, 32])).toBe('16px 32px')
  })

  it('maps cell style, span, and vertical alignment for table rendering', () => {
    const cell: NormalizedTableCell = {
      text: '<p>Header</p>',
      colSpan: 2,
      vAlign: 'mid',
      fillColor: '#123456',
      fontColor: '#ffffff',
      fontFamily: 'Aptos',
      fontSize: 16,
      fontBold: true,
      fontItalic: true,
      fontUnderline: true,
      fontStrike: true,
      highlightColor: '#fff59d',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      padding: {
        top: 5,
        right: 7,
        bottom: 9,
        left: 11,
      },
      borders: {
        top: { color: '#111111', width: 1 },
        right: { color: '#222222', width: 2, type: 'dashed' },
      },
    }

    expect(getTableCellStyle(cell)).toMatchObject({
      gridColumn: 'span 2',
      alignItems: 'center',
      background: '#fff59d',
      color: '#ffffff',
      fontFamily: 'Aptos',
      fontSize: '16px',
      fontWeight: '700',
      fontStyle: 'italic',
      textDecoration: 'underline line-through',
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
      lineHeight: '1.35',
      padding: '5px 7px 9px 11px',
      borderTop: '1.3333px solid #111111',
      borderRight: '2.6667px dashed #222222',
    })
  })

  it('uses less aggressive typography defaults for small table text to reduce cramped wrapping', () => {
    const compactCell: NormalizedTableCell = {
      text: 'Quarterly planning and reporting',
      fontSize: 12,
    }

    const largeCell: NormalizedTableCell = {
      text: 'Headline',
      fontSize: 24,
    }

    expect(getTableCellStyle(compactCell)).toMatchObject({
      fontSize: '12px',
      lineHeight: '1.35',
      padding: '6px 8px',
    })
    expect(getTableCellStyle(largeCell)).toMatchObject({
      fontSize: '24px',
      lineHeight: '1.25',
      padding: '4px 6px',
    })
  })

  it('shrinks narrow single-word labels instead of relying on hard word breaks', () => {
    const narrowLabelCell: NormalizedTableCell = {
      text: '<p>INTERMEDIATE</p>',
      fontSize: 16,
      fontBold: true,
    }

    const sentenceCell: NormalizedTableCell = {
      text: '<p>Quarterly planning</p>',
      fontSize: 16,
    }

    expect(getTableCellStyle(narrowLabelCell)).toMatchObject({
      fontSize: '14.4px',
      wordBreak: 'keep-all',
      overflowWrap: 'normal',
    })
    expect(getTableCellStyle(sentenceCell)).toMatchObject({
      fontSize: '16px',
      wordBreak: undefined,
      overflowWrap: undefined,
    })
  })

  it('uses narrower-column heuristics for long single-word labels', () => {
    const table: NormalizedTableMeta = {
      rowHeights: [20],
      colWidths: [56, 96],
      cells: [[{ text: '<p>INTERMEDIATE</p>', fontSize: 16, fontBold: true }, { text: '<p>Quarterly planning</p>', fontSize: 16 }]],
    }

    const [narrowLabel, regularCell] = getRenderableTableCells(table)

    expect(narrowLabel).toBeDefined()
    expect(regularCell).toBeDefined()
    expect(getTableCellStyle(narrowLabel!.cell, narrowLabel, table)).toMatchObject({
      fontSize: '12.8px',
      lineHeight: '1.15',
      padding: '4px 5px',
      wordBreak: 'keep-all',
      overflowWrap: 'normal',
    })
    expect(getTableCellStyle(regularCell!.cell, regularCell, table)).toMatchObject({
      fontSize: '16px',
      lineHeight: '1.35',
      padding: '6px 8px',
    })
  })

  it('prefers roomier typography for multi-paragraph table content', () => {
    const paragraphCell: NormalizedTableCell = {
      text: '<p>First paragraph with several words.</p><p>Second paragraph with more details.</p>',
      fontSize: 14,
    }

    expect(getTableCellStyle(paragraphCell)).toMatchObject({
      fontSize: '14px',
      lineHeight: '1.5',
      padding: '7px 8px',
      wordBreak: 'normal',
      overflowWrap: 'break-word',
    })
  })

  it('uses run-level font-size as the effective typography size when html contains larger spans', () => {
    const runAwareCell: NormalizedTableCell = {
      text: '<p><span style="font-size: 18px;">Headline</span><span style="font-size: 11px;"> supporting copy</span></p>',
      fontSize: 12,
    }

    expect(getTableCellStyle(runAwareCell)).toMatchObject({
      fontSize: '18px',
      lineHeight: '1.25',
      padding: '4px 6px',
    })
  })

  it('skips merge continuation cells while preserving origin cell spans', () => {
    const table: NormalizedTableMeta = {
      rowHeights: [20, 20],
      colWidths: [40, 40, 40],
      cells: [
        [
          { text: 'A', colSpan: 2 },
          { text: 'A continuation', hMerge: 1 },
          { text: 'B' },
        ],
        [
          { text: 'C', rowSpan: 2 },
          { text: 'D' },
          { text: 'E' },
        ],
        [
          { text: 'C continuation', vMerge: 1 },
          { text: 'F' },
          { text: 'G' },
        ],
      ],
    }

    expect(getRenderableTableCells(table).map((item) => item.cell.text)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    expect(getTableColumnCount(table)).toBe(3)
  })

  it('collapses fallback borders to avoid double-width internal table lines', () => {
    const table: NormalizedTableMeta = {
      rowHeights: [20, 20],
      colWidths: [40, 40],
      cells: [
        [{ text: 'A' }, { text: 'B' }],
        [{ text: 'C' }, { text: 'D' }],
      ],
    }

    const [topLeft, topRight, bottomLeft] = getRenderableTableCells(table)

    expect(topLeft).toBeDefined()
    expect(topRight).toBeDefined()
    expect(bottomLeft).toBeDefined()
    expect(getTableCellStyle(topLeft!.cell, topLeft)).toMatchObject({
      borderTop: '1px solid rgba(148, 163, 184, 0.55)',
      borderLeft: '1px solid rgba(148, 163, 184, 0.55)',
      borderRight: '1px solid rgba(148, 163, 184, 0.55)',
      borderBottom: '1px solid rgba(148, 163, 184, 0.55)',
    })
    expect(getTableCellStyle(topRight!.cell, topRight)).not.toHaveProperty('borderLeft')
    expect(getTableCellStyle(bottomLeft!.cell, bottomLeft)).not.toHaveProperty('borderTop')
  })
})
