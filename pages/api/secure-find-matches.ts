import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY should be set for secure-find-matches endpoint.')
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.split(' ')[1]

    if (!token) return res.status(401).json({ error: 'Missing Authorization token' })

    // 1) Verify token and get user
    const {
      data: { user },
      error: userErr
    } = await supabaseAdmin.auth.getUser(token)

    if (userErr || !user) {
      console.error('Auth error:', userErr)
      return res.status(401).json({ error: 'Invalid token' })
    }

    const userId = user.id

    // 2) Fetch the caller's profile id and check consent. Use the service role client to read the profile.
    const { data: profileRow, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, consent_to_matching')
      .eq('id', userId)
      .single()

    if (profileErr) {
      console.error('Error fetching profile:', profileErr)
      return res.status(500).json({ error: 'Error fetching profile' })
    }

    if (!profileRow?.consent_to_matching) {
      return res.status(403).json({ error: 'User has not consented to matching' })
    }

    // 3) Call the pgvector RPC find_matches_pgvector on behalf of the user
    const { limit = 10, cursor = null } = req.body

    const params: any = {
      p_profile_id: userId,
      p_limit: limit,
      p_cursor_score: null,
      p_cursor_id: null
    }

    if (cursor && typeof cursor === 'object') {
      if ('score' in cursor && 'id' in cursor) {
        params.p_cursor_score = cursor.score
        params.p_cursor_id = cursor.id
      } else {
        return res.status(400).json({ error: 'Invalid cursor: must contain score and id' })
      }
    }

    const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('find_matches_pgvector', params)

    if (rpcErr) {
      console.error('RPC error:', rpcErr)
      return res.status(500).json({ error: 'Error running match RPC' })
    }

    const matches = Array.isArray(rpcData) ? rpcData : []

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
