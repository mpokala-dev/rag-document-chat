import { describe, it, expect } from 'vitest'
import { chunkText } from '../chunker'

describe('chunkText', () => {
  it('returns a single chunk for short text', () => {
    const text = 'Hello world. This is a short sentence.'
    const chunks = chunkText(text)
    expect(chunks.length).toBe(1)
    expect(chunks[0]).toContain('Hello world')
  })

  it('splits long text into multiple chunks', () => {
    const sentence = 'This is a sentence that is repeated many times. '
    const text = sentence.repeat(30)
    const chunks = chunkText(text)
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('each chunk is within the size limit with some overlap tolerance', () => {
    const sentence = 'This is a reasonably long sentence used for testing purposes. '
    const text = sentence.repeat(20)
    const chunks = chunkText(text, 500, 50)
    chunks.forEach(chunk => {
      expect(chunk.length).toBeLessThan(700)
    })
  })

  it('returns empty array for empty string', () => {
    const chunks = chunkText('')
    expect(chunks.length).toBe(0)
  })

  it('preserves content across chunks', () => {
    const sentence = 'Unique word here. '
    const text = sentence.repeat(30)
    const chunks = chunkText(text)
    const joined = chunks.join(' ')
    expect(joined).toContain('Unique word here')
  })

  it('respects custom chunk size', () => {
    const text = 'Short sentence one. Short sentence two. Short sentence three.'
    const chunks = chunkText(text, 100, 10)
    expect(chunks.length).toBeGreaterThanOrEqual(1)
  })
})