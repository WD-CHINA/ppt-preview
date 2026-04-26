<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import type { NormalizedTableMeta } from '../../types/presentation'
import { getRenderableTableCells, getTableCellStyle, getTableColumnCount, getTableGridTemplate } from './tableModel'

const props = defineProps<{
  table: NormalizedTableMeta
}>()

const tableStyle = computed<CSSProperties>(() => ({
  display: 'grid',
  gridTemplateColumns: getTableGridTemplate(props.table.colWidths) || `repeat(${getTableColumnCount(props.table)}, 1fr)`,
  gridTemplateRows: getTableGridTemplate(props.table.rowHeights) || undefined,
  gridAutoRows: props.table.rowHeights.length > 0 ? undefined : '1fr',
}))

const renderableCells = computed(() => getRenderableTableCells(props.table))

function sanitizeTableCellHtml(html: string) {
  if (typeof DOMParser === 'undefined') {
    return html
  }

  const documentNode = new DOMParser().parseFromString(html, 'text/html')
  documentNode.querySelectorAll('script, style, iframe, object, embed').forEach((node) => node.remove())

  for (const element of documentNode.querySelectorAll('*')) {
    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name.toLowerCase().startsWith('on')) {
        element.removeAttribute(attribute.name)
      }
    }
  }

  return documentNode.body.innerHTML
}
</script>

<template>
  <div class="table-renderer" :style="tableStyle" role="table">
    <div
      v-for="item in renderableCells"
      :key="item.key"
      class="table-renderer__cell"
      :style="getTableCellStyle(item.cell, item, table)"
      role="cell"
    >
      <div v-if="item.cell.text" class="table-renderer__text" v-html="sanitizeTableCellHtml(item.cell.text)"></div>
    </div>
  </div>
</template>

<style scoped>
.table-renderer {
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.table-renderer__cell {
  display: flex;
  box-sizing: border-box;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  word-break: normal;
  overflow-wrap: break-word;
}

.table-renderer__text {
  width: 100%;
}

.table-renderer__text :deep(p) {
  margin: 0;
}
</style>
