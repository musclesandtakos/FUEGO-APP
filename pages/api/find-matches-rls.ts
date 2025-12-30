import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * API route that forwards client JWT to Supabase REST RPC find_matches_cursor
 * and returns results. This relies on RLS policies to enforce access control.
 *
 * Usage:
 *   POST /api/find-matches-rls
 *   Authorization: Bearer <user-jwt>
 *   Body: { profile_id: "uuid", limit?: 10, cursor?: { score: number, id: "uuid" } }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    // Extract JWT from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' })
    }
    const userJwt = authHeader.substring(7)

    // Parse request body
    const { profile_id, limit = 10, cursor = null } = req.body
    if (!profile_id) {
      return res.status(400).json({ error: 'profile_id is required' })
    }

    // Build RPC parameters
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

    // Call Supabase REST RPC with user's JWT
    // Note: fetch is available globally in Next.js 13+ and Node.js 18+
    const rpcUrl = `${supabaseUrl}/rest/v1/rpc/find_matches_cursor`
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${userJwt}`
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Supabase RPC error:', response.status, errorText)
      return res.status(response.status).json({ 
        error: 'RPC call failed',
        details: errorText
      })
    }

    const data = await response.json()
    const matches = Array.isArray(data) ? data : []

    // Calculate next cursor
    let next_cursor = null
    if (matches.length === limit) {
      const last = matches[matches.length - 1]
      next_cursor = { score: last.score, id: last.match_id }
    }

    return res.status(200).json({ matches, next_cursor })
  } catch (err: any) {
    console.error('Error in find-matches-rls API:', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
}
