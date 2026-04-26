export function buildParagraphVisibilityHtml(html: string | undefined, visibleParagraphCount: number): string {
  if (!html) {
    return ''
  }

  const paragraphPattern = /<p\b[\s\S]*?<\/p>/gi
  const paragraphMatches = html.match(paragraphPattern) ?? []

  if (paragraphMatches.length === 0) {
    return html
  }

  if (visibleParagraphCount <= 0) {
    return ''
  }

  if (typeof DOMParser === 'undefined') {
    let seen = 0
    return html.replace(paragraphPattern, (match) => {
      if (seen >= visibleParagraphCount) {
        return ''
      }

      seen += 1
      return match
    })
  }

  const documentNode = new DOMParser().parseFromString(html, 'text/html')
  const paragraphs = Array.from(documentNode.querySelectorAll('p'))

  paragraphs.forEach((paragraph, index) => {
    if (index >= visibleParagraphCount) {
      paragraph.remove()
    }
  })

  return documentNode.body.innerHTML
}
