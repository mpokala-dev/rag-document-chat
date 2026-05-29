import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRetrieveContext = vi.fn()
const mockStreamText = vi.fn()
const mockToUIMessageStreamResponse = vi.fn()
const mockConvertToModelMessages = vi.fn()

vi.mock('@/lib/rag', () => ({
  retrieveContext: mockRetrieveContext,
}))

vi.mock('ai', () => ({
  streamText: mockStreamText,
  convertToModelMessages: mockConvertToModelMessages,
}))

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn().mockReturnValue('mocked-model'),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockRetrieveContext.mockResolvedValue('Relevant context from document')
  mockConvertToModelMessages.mockResolvedValue([
    { role: 'user', content: 'test question' },
  ])
  mockToUIMessageStreamResponse.mockReturnValue(
    new Response('streamed response', { status: 200 })
  )
  mockStreamText.mockReturnValue({
    toUIMessageStreamResponse: mockToUIMessageStreamResponse,
  })
})

function makeRequest(body: object) {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/chat', () => {
  it('returns 400 when message text is empty', async () => {
    const { POST } = await import('../route')
    const req = makeRequest({
      messages: [{ role: 'user', parts: [] }],
      documentId: null,
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Empty message')
  })

  it('calls retrieveContext with correct query and documentId', async () => {
    const { POST } = await import('../route')
    const req = makeRequest({
      messages: [{ role: 'user', parts: [{ type: 'text', text: 'What is this document about?' }] }],
      documentId: 'doc-123',
    })
    await POST(req as never)
    expect(mockRetrieveContext).toHaveBeenCalledWith(
      'What is this document about?',
      'doc-123'
    )
  })

  it('passes null documentId when searching all documents', async () => {
    const { POST } = await import('../route')
    const req = makeRequest({
      messages: [{ role: 'user', parts: [{ type: 'text', text: 'Summarise all docs' }] }],
      documentId: null,
    })
    await POST(req as never)
    expect(mockRetrieveContext).toHaveBeenCalledWith('Summarise all docs', undefined)
  })

  it('calls streamText with system prompt containing context', async () => {
    const { POST } = await import('../route')
    const req = makeRequest({
      messages: [{ role: 'user', parts: [{ type: 'text', text: 'test question' }] }],
      documentId: 'doc-abc',
    })
    await POST(req as never)
    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mocked-model',
        system: expect.stringContaining('Relevant context from document'),
      })
    )
  })

  it('returns streamed response on success', async () => {
    const { POST } = await import('../route')
    const req = makeRequest({
      messages: [{ role: 'user', parts: [{ type: 'text', text: 'hello' }] }],
      documentId: null,
    })
    const res = await POST(req as never)
    expect(res.status).toBe(200)
  })
})