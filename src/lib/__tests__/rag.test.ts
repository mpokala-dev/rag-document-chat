import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRpc = vi.fn()
const mockEmbedText = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: mockRpc,
  },
}))

vi.mock('@/lib/embeddings', () => ({
  embedText: mockEmbedText,
}))

beforeEach(() => {
  vi.resetModules()
  mockRpc.mockReset()
  mockEmbedText.mockReset()
})

describe('retrieveContext', () => {
  it('returns formatted context from matched chunks', async () => {
    mockEmbedText.mockResolvedValue([0.1, 0.2, 0.3])
    mockRpc.mockResolvedValue({
      data: [
        { content: 'First relevant chunk' },
        { content: 'Second relevant chunk' },
      ],
      error: null,
    })

    const { retrieveContext } = await import('../rag')
    const result = await retrieveContext('test query', 'doc-123')

    expect(result).toContain('[Excerpt 1]')
    expect(result).toContain('First relevant chunk')
    expect(result).toContain('[Excerpt 2]')
    expect(result).toContain('Second relevant chunk')
  })

  it('passes documentId correctly to supabase rpc', async () => {
    mockEmbedText.mockResolvedValue([0.1, 0.2])
    mockRpc.mockResolvedValue({ data: [], error: null })

    const { retrieveContext } = await import('../rag')
    await retrieveContext('query', 'my-doc-id')

    expect(mockRpc).toHaveBeenCalledWith('match_chunks', {
      query_embedding: [0.1, 0.2],
      match_count: 5,
      doc_id: 'my-doc-id',
    })
  })

  it('passes null documentId when searching all documents', async () => {
    mockEmbedText.mockResolvedValue([0.1, 0.2])
    mockRpc.mockResolvedValue({ data: [], error: null })

    const { retrieveContext } = await import('../rag')
    await retrieveContext('query', undefined)

    expect(mockRpc).toHaveBeenCalledWith('match_chunks', {
      query_embedding: [0.1, 0.2],
      match_count: 5,
      doc_id: null,
    })
  })

  it('throws when supabase returns an error', async () => {
    mockEmbedText.mockResolvedValue([0.1, 0.2])
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'DB error' },
    })

    const { retrieveContext } = await import('../rag')
    await expect(retrieveContext('query')).rejects.toThrow('Retrieval failed: DB error')
  })

  it('returns empty string when no chunks match', async () => {
    mockEmbedText.mockResolvedValue([0.1, 0.2])
    mockRpc.mockResolvedValue({ data: [], error: null })

    const { retrieveContext } = await import('../rag')
    const result = await retrieveContext('query')
    expect(result).toBe('')
  })
})