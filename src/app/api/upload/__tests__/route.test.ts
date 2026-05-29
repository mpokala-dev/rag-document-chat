import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockSingle = vi.fn()
const mockChunksInsert = vi.fn()
const mockEmbedBatch = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'documents') {
        return {
          insert: mockInsert.mockReturnValue({
            select: mockSelect.mockReturnValue({
              single: mockSingle,
            }),
          }),
        }
      }
      return {
        insert: mockChunksInsert,
      }
    }),
  },
}))

vi.mock('@/lib/embeddings', () => ({
  embedBatch: mockEmbedBatch,
}))

vi.mock('@/lib/chunker', () => ({
  chunkText: vi.fn().mockReturnValue(['chunk one', 'chunk two']),
}))

vi.mock('unpdf', () => ({
  extractText: vi.fn().mockResolvedValue({ text: 'extracted pdf text' }),
}))

vi.mock('mammoth', () => ({
  extractRawText: vi.fn().mockResolvedValue({ value: 'extracted docx text' }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockEmbedBatch.mockResolvedValue([[0.1, 0.2], [0.3, 0.4]])
  mockSingle.mockResolvedValue({
    data: { id: 'doc-uuid-123', name: 'test.txt', file_type: 'text/plain' },
    error: null,
  })
  mockChunksInsert.mockResolvedValue({ error: null })
})

async function makeRequest(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return new Request('http://localhost/api/upload', {
    method: 'POST',
    body: formData,
  })
}

describe('POST /api/upload', () => {
  it('returns 400 when no file is provided', async () => {
    const { POST } = await import('../route')
    const req = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: new FormData(),
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('No file provided')
  })

  it('returns 400 for unsupported file type', async () => {
    const { POST } = await import('../route')
    const file = new File(['content'], 'test.exe', { type: 'application/octet-stream' })
    const req = await makeRequest(file)
    const res = await POST(req as never)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Unsupported file type')
  })

  it('successfully processes a txt file', async () => {
    const { POST } = await import('../route')
    const file = new File(['hello world content'], 'test.txt', { type: 'text/plain' })
    const req = await makeRequest(file)
    const res = await POST(req as never)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.documentId).toBe('doc-uuid-123')
    expect(body.name).toBe('test.txt')
    expect(body.chunks).toBe(2)
  })

  it('returns 500 when document insert fails', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'DB insert failed' },
    })
    const { POST } = await import('../route')
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
    const req = await makeRequest(file)
    const res = await POST(req as never)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Upload failed')
  })

  it('returns 500 when chunk insert fails', async () => {
    mockChunksInsert.mockResolvedValue({ error: { message: 'chunk insert failed' } })
    const { POST } = await import('../route')
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
    const req = await makeRequest(file)
    const res = await POST(req as never)
    expect(res.status).toBe(500)
  })
})