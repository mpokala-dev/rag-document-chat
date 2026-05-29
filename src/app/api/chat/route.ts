import { openai } from '@ai-sdk/openai'
import { streamText, convertToModelMessages } from 'ai'
import { retrieveContext } from '@/lib/rag'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const { messages, documentId } = await req.json()

  // Extract text from last message for RAG retrieval
  const lastMessage = messages[messages.length - 1]
  const lastMessageText = lastMessage?.parts
    ?.find((p: { type: string }) => p.type === 'text')
    ?.text ?? ''

  if (!lastMessageText) {
    return new Response(JSON.stringify({ error: 'Empty message' }), { status: 400 })
  }

  const context = await retrieveContext(lastMessageText, documentId ?? undefined)

  const systemPrompt = `You are a helpful assistant analysing uploaded documents for the user.
The user has uploaded their documents and the relevant excerpts have been retrieved for you below.
You MUST base your answer entirely on the CONTEXT provided. Do NOT say you cannot access documents.
The context IS the document content — treat it as such and answer directly.

CONTEXT FROM UPLOADED DOCUMENTS:
${context}

IMPORTANT: Never say you cannot view or access documents. The context above contains the actual document content. Use it to answer fully and specifically.`

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}