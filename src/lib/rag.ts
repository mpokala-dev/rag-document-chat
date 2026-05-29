import { supabase } from './supabase'
import { embedText } from './embeddings'

export async function retrieveContext(
  query: string,
  documentId?: string|null,
  matchCount = 5
): Promise<string> {
  const queryEmbedding = await embedText(query)

  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    doc_id: documentId ?? null,
  })

  if (error) throw new Error(`Retrieval failed: ${error.message}`)

  return (data as { content: string }[])
    .map((chunk, i) => `[Excerpt ${i + 1}]:\n${chunk.content}`)
    .join('\n\n')
}