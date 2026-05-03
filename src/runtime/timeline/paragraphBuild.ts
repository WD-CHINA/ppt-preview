export function buildParagraphVisibilityHtml(html: string | undefined, visibleParagraphCount: number): string {
  if (!html) {
    return ''
  }

  const blockPattern = /<(p|li)\b[\s\S]*?<\/\1>/gi
  const blockMatches = html.match(blockPattern) ?? []

  if (blockMatches.length === 0) {
    return html
  }

  if (visibleParagraphCount <= 0) {
    return ''
  }

  if (typeof DOMParser === 'undefined') {
    let seenMeaningful = 0
    let hidingRemaining = false
    return html.replace(blockPattern, (match) => {
      if (hidingRemaining) {
        return ''
      }

      const meaningful = isMeaningfulParagraphHtml(match)

      if (meaningful) {
        if (seenMeaningful >= visibleParagraphCount) {
          hidingRemaining = true
          return ''
        }

        seenMeaningful += 1
      }
      else if (seenMeaningful === 0) {
        return ''
      }

      return match
    })
  }

  const documentNode = new DOMParser().parseFromString(html, 'text/html')
  const paragraphs = Array.from(documentNode.querySelectorAll('p, li'))
  let seenMeaningful = 0
  let hidingRemaining = false

  paragraphs.forEach((paragraph) => {
    if (hidingRemaining) {
      paragraph.remove()
      return
    }

    if (isMeaningfulParagraphText(paragraph.textContent)) {
      if (seenMeaningful >= visibleParagraphCount) {
        hidingRemaining = true
        paragraph.remove()
        return
      }

      seenMeaningful += 1
      return
    }

    if (seenMeaningful === 0) {
      paragraph.remove()
    }
  })

  return documentNode.body.innerHTML
}

function isMeaningfulParagraphHtml(html: string) {
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')

  return isMeaningfulParagraphText(text)
}

function isMeaningfulParagraphText(text: string | null | undefined) {
  return typeof text === 'string' && text.replace(/\u00A0/g, ' ').trim().length > 0
}
