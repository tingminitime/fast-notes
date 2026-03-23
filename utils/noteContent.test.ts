import { describe, expect, it } from 'vitest'
import { isHtml, toDisplayHtml, toPlainText } from './noteContent'

describe('isHtml', () => {
  it('returns false for empty string', () => {
    expect(isHtml('')).toBe(false)
  })

  it('returns false for plain text', () => {
    expect(isHtml('hello world')).toBe(false)
  })

  it('returns false for non-Tiptap tags like script', () => {
    expect(isHtml('<script>alert(1)</script>')).toBe(false)
  })

  it('returns false for text with newlines', () => {
    expect(isHtml('line1\nline2')).toBe(false)
  })

  it('returns true for paragraph HTML', () => {
    expect(isHtml('<p>hello</p>')).toBe(true)
  })

  it('returns true for list HTML', () => {
    expect(isHtml('<ul><li>item</li></ul>')).toBe(true)
  })

  it('returns true for Tiptap empty paragraph', () => {
    expect(isHtml('<p></p>')).toBe(true)
  })
})

describe('toDisplayHtml', () => {
  it('returns empty string for empty input', () => {
    expect(toDisplayHtml('')).toBe('')
  })

  it('wraps a single line in a paragraph', () => {
    expect(toDisplayHtml('hello')).toBe('<p>hello</p>')
  })

  it('wraps each line in a paragraph', () => {
    expect(toDisplayHtml('a\nb')).toBe('<p>a</p><p>b</p>')
  })

  it('handles three lines', () => {
    expect(toDisplayHtml('My First Note\n123\n456')).toBe('<p>My First Note</p><p>123</p><p>456</p>')
  })

  it('passes through existing HTML unchanged', () => {
    expect(toDisplayHtml('<p>already html</p>')).toBe('<p>already html</p>')
  })

  it('passes through complex HTML unchanged', () => {
    const html = '<p>line1</p><p>line2</p>'
    expect(toDisplayHtml(html)).toBe(html)
  })

  it('escapes < and > in plain-text lines', () => {
    expect(toDisplayHtml('<script>alert(1)</script>')).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>')
  })

  it('escapes & in plain-text lines', () => {
    expect(toDisplayHtml('a & b')).toBe('<p>a &amp; b</p>')
  })

  it('escapes HTML in multi-line plain text', () => {
    expect(toDisplayHtml('safe\n<img onerror="x">')).toBe('<p>safe</p><p>&lt;img onerror=&quot;x&quot;&gt;</p>')
  })
})

describe('toPlainText', () => {
  it('strips paragraph tags', () => {
    expect(toPlainText('<p>hello</p>')).toBe('hello')
  })

  it('returns plain text unchanged', () => {
    expect(toPlainText('plain text')).toBe('plain text')
  })

  it('extracts text from multiple paragraphs', () => {
    const result = toPlainText('<p>line1</p><p>line2</p>')
    expect(result).toContain('line1')
    expect(result).toContain('line2')
  })

  it('strips inline formatting tags', () => {
    expect(toPlainText('<p><strong>bold</strong> text</p>')).toBe('bold text')
  })
})
