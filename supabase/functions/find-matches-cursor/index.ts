// Supabase Edge Function: find-matches-cursor
// Secure RPC wrapper that verifies user ownership and calls find_matches_cursor
// Deploy with: supabase functions deploy find-matches-cursor

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface RequestBody {
  profile_id: string
  limit?: number
  cursor?: {
    score: number
    id: string
  } | null
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    }

    // Create admin client (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Get user from JWT in Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: RequestBody = await req.json()
    const { profile_id, limit = 10, cursor = null } = body

    if (!profile_id) {
      return new Response(
        JSON.stringify({ error: 'profile_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user owns the profile_id or profile is public
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, is_public')
      .eq('id', profile_id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check authorization: user must own the profile or profile must be public
    if (profile.user_id !== user.id && !profile.is_public) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: you do not own this profile' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
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
        return new Response(
          JSON.stringify({ error: 'cursor must have score and id' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Call the find_matches_cursor RPC
    const { data, error } = await supabaseAdmin.rpc('find_matches_cursor', params)

    if (error) {
      console.error('RPC error:', error)
      return new Response(
        JSON.stringify({ error: error.message || 'RPC call failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const matches = Array.isArray(data) ? data : []

    // Calculate next cursor
    let next_cursor = null
    if (matches.length === limit) {
      const last = matches[matches.length - 1]
      next_cursor = { score: last.score, id: last.match_id }
    }

    return new Response(
      JSON.stringify({ matches, next_cursor }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ error: err.message || String(err) }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
