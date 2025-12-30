import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'
import { getEmbedding } from '../../lib/embeddings'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { id, name, likes } = req.body
    if (!name || !Array.isArray(likes)) return res.status(400).json({ error: 'name and likes[] required' })

    const likesText = likes.join('\n')
    const embedding = await getEmbedding(likesText)

    const { data, error } = await supabase
      .from('profiles')
      .insert([{ id, name, likes_text: likesText, embedding }])
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: err.message || String(err) })
  }
}
