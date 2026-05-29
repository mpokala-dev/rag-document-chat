import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { chunkText } from '@/lib/chunker'
import { embedBatch } from '@/lib/embeddings'

export const runtime = 'nodejs'
export const maxDuration = 60

async function extractText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())

  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    const unpdf = await import('unpdf')
    const { text } = await unpdf.extractText(new Uint8Array(buffer))
    return Array.isArray(text) ? text.join('\n') : text;
  }

  if (
    file.name.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  return buffer.toString('utf-8')
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const allowedExts = ['.pdf', '.txt', '.docx']
    if (!allowedExts.some(ext => file.name.endsWith(ext))) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const text = await extractText(file)
    if (!text.trim()) {
      return NextResponse.json({ error: 'Could not extract text from file' }, { status: 400 })
    }

    const { data: doc, error: docError } = await supabaseAdmin
      .from('documents')
      .insert({ name: file.name, file_type: file.type || 'unknown' })
      .select()
      .single()

    if (docError) throw docError

    const chunks = chunkText(text)
    const embeddings = await embedBatch(chunks)

    const rows = chunks.map((content, i) => ({
      document_id: doc.id,
      content,
      embedding: embeddings[i],
      chunk_index: i,
    }))

    const { error: chunkError } = await supabaseAdmin
      .from('document_chunks')
      .insert(rows)

    if (chunkError) throw chunkError

    return NextResponse.json({ documentId: doc.id, name: file.name, chunks: chunks.length })
  } catch (err) {
    console.error('[upload]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}