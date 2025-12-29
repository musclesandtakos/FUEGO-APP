import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { profile_id, limit = 10, offset = 0 } = req.body
    if (!profile_id) return res.status(400).json({ error: 'profile_id is required' })

    const { data, error } = await supabase.rpc('find_matches', {
      p_profile_id: profile_id,
      p_limit: limit,
      p_offset: offset
    })

    if (error) {
      console.error('Supabase RPC error:', error)
      return res.status(500).json({ error: error.message || error })
    }

    return res.status(200).json({ matches: data })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ error: err.message || String(err) })
  }
}
