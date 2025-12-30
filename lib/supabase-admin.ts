import { createClient } from '@supabase/supabase-js'

/**
 * Create a Supabase admin client using the service role key.
 * This client bypasses RLS and should only be used in secure server contexts.
 * 
 * @throws Error if SUPABASE_SERVICE_ROLE_KEY is not set
 * @returns Supabase client with admin privileges
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Get a singleton admin client instance (lazy initialization)
 */
let adminClientInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (!adminClientInstance) {
    adminClientInstance = createSupabaseAdminClient()
  }
  return adminClientInstance
}
