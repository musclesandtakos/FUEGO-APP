#!/usr/bin/env node
/**
 * Verify RLS policies and optionally test RPC calls as a user
 *
 * Usage:
 *   # Check RLS policies exist
 *   DATABASE_URL="postgres://..." node scripts/verify-rls-and-rpc.js --check-policies
 *
 *   # Test RPC as a user via Supabase REST API
 *   SUPABASE_URL="https://..." SUPABASE_ANON_KEY="..." USER_JWT="..." PROFILE_ID="..." \
 *     node scripts/verify-rls-and-rpc.js --test-rpc
 *
 * Environment variables:
 *   DATABASE_URL - Postgres connection string (for --check-policies)
 *   SUPABASE_URL - Supabase project URL (for --test-rpc)
 *   SUPABASE_ANON_KEY - Supabase anon key (for --test-rpc)
 *   USER_JWT - User JWT token (for --test-rpc)
 *   PROFILE_ID - Profile ID to test matching (for --test-rpc)
 */
import { Client } from 'pg'
import minimist from 'minimist'

const argv = minimist(process.argv.slice(2))

async function checkPolicies() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
  if (!connectionString) {
    console.error('ERROR: set DATABASE_URL environment variable')
    process.exit(2)
  }

  const client = new Client({ connectionString })
  await client.connect()

  try {
    console.log('Checking RLS is enabled on profiles table...')
    const rlsRes = await client.query(`
      SELECT relname, relrowsecurity
      FROM pg_class
      WHERE relname = 'profiles'
    `)
    if (rlsRes.rowCount === 0) {
      console.error('ERROR: profiles table not found')
      return false
    }
    const rlsEnabled = rlsRes.rows[0].relrowsecurity
    console.log('RLS enabled:', rlsEnabled)

    console.log('\nChecking RLS policies on profiles table...')
    const policiesRes = await client.query(`
      SELECT policyname, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'profiles'
      ORDER BY policyname
    `)
    console.log(`Found ${policiesRes.rowCount} policies:`)
    policiesRes.rows.forEach((row) => {
      console.log(`  - ${row.policyname} (${row.cmd})`)
    })

    const expectedPolicies = [
      'select_public_or_own_profiles',
      'update_own_profile',
      'insert_profile_authenticated',
      'delete_own_profile'
    ]
    const foundPolicies = policiesRes.rows.map((r) => r.policyname)
    const missingPolicies = expectedPolicies.filter((p) => !foundPolicies.includes(p))
    if (missingPolicies.length > 0) {
      console.warn(`\nWARNING: Missing expected policies: ${missingPolicies.join(', ')}`)
    } else {
      console.log('\n✅ All expected RLS policies found')
    }

    console.log('\nChecking function security settings...')
    const funcRes = await client.query(`
      SELECT proname, prosecdef
      FROM pg_proc
      WHERE proname IN ('find_matches', 'find_matches_cursor')
    `)
    funcRes.rows.forEach((row) => {
      const securityType = row.prosecdef ? 'SECURITY DEFINER' : 'SECURITY INVOKER'
      console.log(`  - ${row.proname}: ${securityType}`)
      if (row.prosecdef) {
        console.warn(`    WARNING: ${row.proname} is SECURITY DEFINER, RLS may be bypassed`)
      }
    })

    return true
  } catch (err) {
    console.error('Error checking policies:', err.message || err)
    return false
  } finally {
    await client.end()
  }
}

async function testRPC() {
  const supabaseUrl = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  const userJwt = process.env.USER_JWT
  const profileId = process.env.PROFILE_ID

  if (!supabaseUrl || !anonKey || !userJwt || !profileId) {
    console.error('ERROR: SUPABASE_URL, SUPABASE_ANON_KEY, USER_JWT, and PROFILE_ID are required for --test-rpc')
    process.exit(2)
  }

  try {
    // Use dynamic import for node-fetch
    const fetch = (await import('node-fetch')).default

    console.log(`Testing find_matches_cursor RPC for profile ${profileId}...`)
    const rpcUrl = `${supabaseUrl}/rest/v1/rpc/find_matches_cursor`
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${userJwt}`
      },
      body: JSON.stringify({
        p_profile_id: profileId,
        p_limit: 5,
        p_cursor_score: null,
        p_cursor_id: null
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`ERROR: RPC call failed with status ${response.status}`)
      console.error('Response:', errorText)
      return false
    }

    const data = await response.json()
    console.log(`\n✅ RPC call successful, returned ${data.length} matches`)
    if (data.length > 0) {
      console.log('Sample match:', JSON.stringify(data[0], null, 2))
    }
    return true
  } catch (err) {
    console.error('Error testing RPC:', err.message || err)
    return false
  }
}

async function main() {
  let success = true

  if (argv['check-policies']) {
    success = await checkPolicies() && success
  }

  if (argv['test-rpc']) {
    success = await testRPC() && success
  }

  if (!argv['check-policies'] && !argv['test-rpc']) {
    console.log('Usage:')
    console.log('  --check-policies   Check RLS policies in database')
    console.log('  --test-rpc         Test RPC call via Supabase REST API')
    console.log('\nExamples:')
    console.log('  DATABASE_URL="postgres://..." node scripts/verify-rls-and-rpc.js --check-policies')
    console.log('  SUPABASE_URL="..." SUPABASE_ANON_KEY="..." USER_JWT="..." PROFILE_ID="..." \\')
    console.log('    node scripts/verify-rls-and-rpc.js --test-rpc')
    process.exit(1)
  }

  process.exitCode = success ? 0 : 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
