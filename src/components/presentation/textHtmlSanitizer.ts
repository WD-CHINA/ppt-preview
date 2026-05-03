export function normalizePresentationBlockStyle(styleText: string) {
  const declarations = styleText
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)

  const filtered = declarations.filter((entry) => {
    const separatorIndex = entry.indexOf(':')

    if (separatorIndex === -1) {
      return true
    }

    const property = entry.slice(0, separatorIndex).trim().toLowerCase()

    return property !== 'margin-top' && property !== 'margin-bottom'
  })

  return filtered.join(';')
}

function normalizeBlockSpacing(root: ParentNode) {
  for (const node of root.querySelectorAll('p, div, li')) {
    const styleText = node.getAttribute('style')

    if (!styleText) {
      continue
    }

    const normalized = normalizePresentationBlockStyle(styleText)

    if (normalized) {
      node.setAttribute('style', normalized)
      continue
    }

    node.removeAttribute('style')
  }
}

export function sanitizePresentationHtml(html?: string) {
  if (!html) {
    return ''
  }

  if (typeof DOMParser === 'undefined') {
    return sanitizePresentationHtmlWithoutDom(html)
  }

  const parser = new DOMParser()
  const documentNode = parser.parseFromString(html, 'text/html')

  documentNode.querySelectorAll('script, style, iframe, object, embed').forEach((node) => node.remove())
  documentNode.querySelectorAll('li').forEach((node) => {
    if (isBlankListItem(node)) {
      node.remove()
    }
  })

  for (const element of documentNode.querySelectorAll('*')) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase()

      if (name.startsWith('on')) {
        element.removeAttribute(attribute.name)
      }
    }
  }

  normalizeBlockSpacing(documentNode.body)
  normalizeTextWhitespace(documentNode.body)

  return normalizeSuspiciousDarkTextRuns(documentNode.body.innerHTML)
}

function sanitizePresentationHtmlWithoutDom(html: string) {
  const normalized = html.replace(/<(p|div|li)\b([^>]*)\sstyle=(["'])(.*?)\3/gi, (_match, tagName, attrs, quote, styleText) => {
    const normalized = normalizePresentationBlockStyle(styleText)
    return normalized
      ? `<${tagName}${attrs} style=${quote}${normalized}${quote}`
      : `<${tagName}${attrs}`
  })

  return normalizeSuspiciousDarkTextRuns(normalizeInlineWhitespaceWithoutDom(normalized))
}

export function normalizeSuspiciousDarkTextRuns(html: string) {
  const runs = Array.from(html.matchAll(/<span\b([^>]*)style=(["'])(.*?)\2[^>]*>([\s\S]*?)<\/span>/gi))
    .map((match) => {
      const styleText = match[3] ?? ''
      const content = match[4] ?? ''
      const color = extractColorValue(styleText)
      const visibleText = stripHtmlText(content)

      return {
        fullMatch: match[0],
        styleText,
        content,
        color,
        visibleText,
      }
    })

  const brightVisibleRunCount = runs.filter((run) => run.color && run.visibleText && isBrightTextColor(run.color)).length
  const darkVisibleRunCount = runs.filter((run) => run.color && run.visibleText && isDarkTextColor(run.color)).length
  const visibleWhiteRunCount = runs.filter((run) => run.color && run.visibleText && isNearWhiteTextColor(run.color)).length

  if (brightVisibleRunCount === 0 || darkVisibleRunCount === 0 || visibleWhiteRunCount > 0) {
    return html
  }

  return html.replace(/(<span\b[^>]*style=(["']))(.*?)(\2[^>]*>)([\s\S]*?)(<\/span>)/gi, (match, prefix, _quote, styleText, suffix, content, closingTag) => {
    const color = extractColorValue(styleText)
    const visibleText = stripHtmlText(content)

    if (!color || !visibleText || !isDarkTextColor(color)) {
      return match
    }

    const normalizedStyle = replaceColorValue(styleText, '#FFFFFF')
    return `${prefix}${normalizedStyle}${suffix}${content}${closingTag}`
  })
}

function isBlankListItem(node: HTMLLIElement) {
  const text = node.textContent?.replace(/\u00a0/g, ' ').trim() ?? ''

  if (text.length > 0) {
    return false
  }

  const mediaChild = node.querySelector('img, video, audio, svg, math')
  return !mediaChild
}

function normalizeTextWhitespace(root: ParentNode) {
  for (const node of root.querySelectorAll('p, li, div')) {
    const html = node.innerHTML
    const normalized = normalizeInlineWhitespace(html)

    if (normalized !== html) {
      node.innerHTML = normalized
    }

    normalizeTextNodeWhitespace(node)
  }
}

function normalizeInlineWhitespace(html: string) {
  if (/^(?:\s|&nbsp;|\u00a0)+$/gi.test(html)) {
    return '&nbsp;'
  }

  return html
    .replace(/(?:&nbsp;|\u00a0)+(?:\s*(?:<br\s*\/?>)?\s*(?:&nbsp;|\u00a0)+)+/gi, '&nbsp;')
}

function normalizeInlineWhitespaceWithoutDom(html: string) {
  return html.replace(/>([^<]*)</g, (_match, textContent) => {
    if (/^(?:\s|&nbsp;|\u00a0)+$/gi.test(textContent)) {
      return '>&nbsp;<'
    }

    return `>${textContent.replace(/(?:&nbsp;|\u00a0)/g, ' ')}<`
  })
}

function normalizeTextNodeWhitespace(root: ParentNode) {
  const documentNode = root.ownerDocument

  if (!documentNode) {
    return
  }

  const walker = documentNode.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  let currentNode = walker.nextNode()

  while (currentNode) {
    if (currentNode instanceof Text) {
      textNodes.push(currentNode)
    }
    currentNode = walker.nextNode()
  }

  for (const textNode of textNodes) {
    const value = textNode.nodeValue ?? ''

    if (!value.includes('\u00a0')) {
      continue
    }

    if (value.replace(/\u00a0/g, '').trim().length === 0) {
      textNode.nodeValue = '\u00a0'
      continue
    }

    textNode.nodeValue = value.replace(/\u00a0/g, ' ')
  }
}

function extractColorValue(styleText: string) {
  const match = styleText.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i)
  return match?.[1]?.trim() ?? ''
}

function replaceColorValue(styleText: string, nextColor: string) {
  return styleText.replace(/((?:^|;)\s*color\s*:\s*)([^;]+)/i, `$1${nextColor}`)
}

function stripHtmlText(html: string) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isDarkTextColor(color: string) {
  const rgb = parseHexColor(color)
  return rgb ? relativeLuminance(rgb) <= 0.08 : false
}

function isBrightTextColor(color: string) {
  const rgb = parseHexColor(color)
  return rgb ? relativeLuminance(rgb) >= 0.4 : false
}

function isNearWhiteTextColor(color: string) {
  const rgb = parseHexColor(color)
  if (!rgb) {
    return false
  }

  const minChannel = Math.min(rgb.r, rgb.g, rgb.b)
  const maxChannel = Math.max(rgb.r, rgb.g, rgb.b)
  return minChannel >= 235 && maxChannel - minChannel <= 20
}

function parseHexColor(color: string) {
  const normalized = color.trim().replace(/^#/, '')

  if (!/^[\da-f]{6}$/i.test(normalized)) {
    return undefined
  }

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

function relativeLuminance(input: { r: number; g: number; b: number }) {
  const normalize = (value: number) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }

  const r = normalize(input.r)
  const g = normalize(input.g)
  const b = normalize(input.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
