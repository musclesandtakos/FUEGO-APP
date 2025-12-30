#!/usr/bin/env node
/**
 * Run SQL migration files against a Postgres DB.
 *
 * Usage:
 *   DATABASE_URL="postgres://..." node scripts/run-sql.js
 *
 * The script will run SQL files in the ORDERED array below.
 *
 * WARNING: Use a staging DB first. The script runs DDL statements.
 */
import fs from 'fs'
import path from 'path'
import { Client } from 'pg'

const sqlDir = path.resolve(process.cwd(), 'sql')

// Ordered SQL files to run
const files = [
  'all_migrations_combined.sql',
  'pgvector_setup.sql',
  'migrate_jsonb_to_float8_array.sql',
  'create_cosine_and_rpc.sql',
  'pgvector_migration_and_rpc.sql',
  'rls_and_consent.sql'
]

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
  if (!connectionString) {
    console.error('ERROR: set DATABASE_URL (or SUPABASE_DB_URL) environment variable')
    process.exit(2)
  }

  const client = new Client({ connectionString })
  await client.connect()

  try {
    for (const file of files) {
      const filePath = path.join(sqlDir, file)
      if (!fs.existsSync(filePath)) {
        console.warn(`Skipping missing file: ${filePath}`)
        continue
      }
      console.log(`\n--- Running ${file} ---`)
      const sql = fs.readFileSync(filePath, 'utf8')
      try {
        // execute SQL in a transaction
        await client.query('BEGIN')
        await client.query(sql)
        await client.query('COMMIT')
        console.log(`✅ ${file} applied`)
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`❌ Error applying ${file}:`, err.message || err)
        // stop on first error
        throw err
      }
    }
    console.log('\nAll migrations applied successfully.')
  } catch (err) {
    console.error('\nMigration failed:', err.message || err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
