export function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const chunks: string[] = []
  const sentences = text.split(/(?<=[.!?])\s+/)
  let current = ''

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > chunkSize && current.length > 0) {
      chunks.push(current.trim())
      current = current.slice(-overlap) + ' ' + sentence
    } else {
      current = current ? current + ' ' + sentence : sentence
    }
  }

  if (current.trim()) chunks.push(current.trim())
  return chunks
}