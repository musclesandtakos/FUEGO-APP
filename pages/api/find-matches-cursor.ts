import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { profile_id, limit = 10, cursor = null } = req.body
    if (!profile_id) return res.status(400).json({ error: 'profile_id is required' })

    const params: any = {
      p_profile_id: profile_id,
      p_limit: limit,
      p_cursor_score: null,
      p_cursor_id: null
    }

    if (cursor && typeof cursor === 'object') {
      if ('score' in cursor && 'id' in cursor) {
        params.p_cursor_score = cursor.score
        params.p_cursor_id = cursor.id
      } else {
        return res.status(400).json({ error: 'cursor must have score and id' })
      }
    }

    const { data, error } = await supabase.rpc('find_matches_cursor', params)

    if (error) {
      console.error('Supabase RPC error:', error)
      return res.status(500).json({ error: error.message || error })
    }

    const matches = Array.isArray(data) ? data : []

    let next_cursor = null
    if (matches.length === limit) {
      const last = matches[matches.length - 1]
      next_cursor = { score: last.score, id: last.match_id }
    }

    return res.status(200).json({ matches, next_cursor })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ error: err.message || String(err) })
  }
}
