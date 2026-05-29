import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn()

vi.mock('openai', () => ({
  default: class MockOpenAI {
    embeddings = { create: mockCreate }
  },
}))

beforeEach(() => {
  mockCreate.mockReset()
})

describe('embedText', () => {
  it('returns an embedding array for a given text', async () => {
    mockCreate.mockResolvedValue({
      data: [{ embedding: [0.1, 0.2, 0.3] }],
    })
    const { embedText } = await import('../embeddings')
    const result = await embedText('hello world')
    expect(result).toEqual([0.1, 0.2, 0.3])
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: 'hello world',
    })
  })

  it('throws if OpenAI call fails', async () => {
    mockCreate.mockRejectedValue(new Error('API error'))
    const { embedText } = await import('../embeddings')
    await expect(embedText('hello')).rejects.toThrow('API error')
  })
})

describe('embedBatch', () => {
  it('returns embeddings for multiple texts', async () => {
    mockCreate.mockResolvedValue({
      data: [
        { embedding: [0.1, 0.2] },
        { embedding: [0.3, 0.4] },
      ],
    })
    const { embedBatch } = await import('../embeddings')
    const result = await embedBatch(['text one', 'text two'])
    expect(result).toEqual([[0.1, 0.2], [0.3, 0.4]])
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: ['text one', 'text two'],
    })
  })

  it('returns empty array for empty input', async () => {
    mockCreate.mockResolvedValue({ data: [] })
    const { embedBatch } = await import('../embeddings')
    const result = await embedBatch([])
    expect(result).toEqual([])
  })
})