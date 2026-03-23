// Matches only block-level tags produced by Tiptap StarterKit
const HTML_PATTERN = /^<(?:p|ul|ol|li|h[1-6]|blockquote|pre|hr|br)[\s>]/i
const AMP_RE = /&/g
const LT_RE = /</g
const GT_RE = />/g
const QUOT_RE = /"/g

export function isHtml(text: string): boolean {
  return HTML_PATTERN.test(text.trim())
}

function escapeLine(line: string): string {
  return line
    .replace(AMP_RE, '&amp;')
    .replace(LT_RE, '&lt;')
    .replace(GT_RE, '&gt;')
    .replace(QUOT_RE, '&quot;')
}

export function toDisplayHtml(text: string): string {
  if (!text)
    return ''
  if (isHtml(text))
    return text
  return text.split('\n').map(line => `<p>${escapeLine(line)}</p>`).join('')
}

export function toPlainText(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent ?? ''
}
