#!/usr/bin/env node
/**
 * Verify Supabase/Postgres setup created by run-sql.js
 *
 * Usage:
 *   DATABASE_URL="postgres://..." node scripts/verify-supabase-setup.js [--profile-id <uuid>]
 *
 * If --profile-id is provided, the script will attempt:
 *   SELECT * FROM find_matches(<profile-id>, 1, 0)
 *
 * Exit codes:
 *   0 - all checks passed (or passed with optional checks skipped)
 *   1 - a check failed
 *   2 - missing DATABASE_URL
 */
import { Client } from 'pg'
import minimist from 'minimist'

const argv = minimist(process.argv.slice(2))
const profileId = argv['profile-id'] || argv['profileId'] || null

async function checkExtension(client, ext) {
  const res = await client.query('SELECT extname FROM pg_extension WHERE extname = $1', [ext])
  return res.rowCount > 0
}

async function columnExists(client, table, column) {
  const res = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
    [table, column]
  )
  return res.rowCount > 0
}

async function functionExists(client, funcName) {
  const res = await client.query(
    `SELECT proname FROM pg_proc WHERE proname = $1`,
    [funcName]
  )
  return res.rowCount > 0
}

async function run() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
  if (!connectionString) {
    console.error('ERROR: set DATABASE_URL (or SUPABASE_DB_URL) environment variable')
    process.exit(2)
  }
  const client = new Client({ connectionString })
  await client.connect()

  let ok = true
  try {
    console.log('Checking pgvector extension...')
    const hasVector = await checkExtension(client, 'vector')
    console.log('pgvector installed:', hasVector)
    // pgvector is optional; if you didn't run pgvector_setup, warn but don't fail
    if (!hasVector) {
      console.warn('Warning: pgvector extension not found. If you plan to use pgvector, run pgvector_setup.sql with a service role DB URL.')
    }

    console.log('Checking profiles table columns...')
    const hasEmbeddingVector = await columnExists(client, 'profiles', 'embedding_vector')
    const hasEmbeddingArr = await columnExists(client, 'profiles', 'embedding_arr')
    const hasEmbeddingJson = await columnExists(client, 'profiles', 'embedding')
    console.log('embedding_vector (pgvector) exists:', hasEmbeddingVector)
    console.log('embedding_arr (float8[]) exists:', hasEmbeddingArr)
    console.log('embedding (jsonb) exists (original):', hasEmbeddingJson)

    // Check PL/pgSQL function
    console.log('Checking cosine_similarity function...')
    const hasCosine = await functionExists(client, 'cosine_similarity')
    console.log('cosine_similarity exists:', hasCosine)
    console.log('Checking find_matches RPC function...')
    const hasFindMatches = await functionExists(client, 'find_matches')
    console.log('find_matches exists:', hasFindMatches)

    if (!hasCosine || !hasFindMatches) {
      console.error('ERROR: Required functions are missing.')
      ok = false
    }

    // If profileId provided, run a sample find_matches call (safe read-only)
    if (profileId) {
      console.log(`Running sample RPC: find_matches(${profileId}, 1, 0) ...`)
      try {
        const res = await client.query('SELECT * FROM find_matches($1::uuid, $2::int, $3::int)', [profileId, 1, 0])
        console.log('RPC returned rows:', res.rowCount)
        if (res.rowCount > 0) {
          console.log('Sample row:', res.rows[0])
        } else {
          console.warn('Sample RPC returned 0 rows (maybe no other profiles or embeddings missing).')
        }
      } catch (err) {
        console.error('Error running sample RPC:', err.message || err)
        ok = false
      }
    } else {
      console.log('No profile-id provided; skipping sample RPC.')
    }
  } catch (err) {
    console.error('Verification error:', err.message || err)
    ok = false
  } finally {
    await client.end()
  }

  if (!ok) process.exitCode = 1
  else process.exitCode = 0
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
