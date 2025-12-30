export async function getEmbedding(text: string): Promise<number[]> {
  const model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({ model, input: text })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Embedding request failed: ${err}`)
  }

  const j = await res.json()
  return j.data[0].embedding as number[]
}
