#!/usr/bin/env node
/**
 * Populate profiles.user_id from a mapping JSON file
 *
 * Usage:
 *   DATABASE_URL="postgres://..." node scripts/populate-userid-from-mapping.js --file=mappings.json
 *
 * The mapping file should be a JSON array of objects with profile_id and user_id:
 *   [
 *     { "profile_id": "uuid1", "user_id": "uuid2" },
 *     { "profile_id": "uuid3", "user_id": "uuid4" }
 *   ]
 *
 * Or a JSON object mapping profile_id to user_id:
 *   {
 *     "uuid1": "uuid2",
 *     "uuid3": "uuid4"
 *   }
 */
import fs from 'fs'
import { Client } from 'pg'
import minimist from 'minimist'

const argv = minimist(process.argv.slice(2))

async function main() {
  const mappingFile = argv.file || argv.f
  if (!mappingFile) {
    console.error('ERROR: --file parameter is required')
    console.log('Usage: node scripts/populate-userid-from-mapping.js --file=mappings.json')
    process.exit(2)
  }

  if (!fs.existsSync(mappingFile)) {
    console.error(`ERROR: File not found: ${mappingFile}`)
    process.exit(2)
  }

  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
  if (!connectionString) {
    console.error('ERROR: set DATABASE_URL environment variable')
    process.exit(2)
  }

  // Load mapping file
  console.log(`Loading mappings from ${mappingFile}...`)
  const fileContent = fs.readFileSync(mappingFile, 'utf8')
  const rawData = JSON.parse(fileContent)

  // Normalize to array of { profile_id, user_id }
  let mappings = []
  if (Array.isArray(rawData)) {
    mappings = rawData
  } else if (typeof rawData === 'object') {
    mappings = Object.entries(rawData).map(([profile_id, user_id]) => ({
      profile_id,
      user_id
    }))
  } else {
    console.error('ERROR: Mapping file must be a JSON array or object')
    process.exit(2)
  }

  console.log(`Found ${mappings.length} mappings`)

  const client = new Client({ connectionString })
  await client.connect()

  try {
    let updated = 0
    let skipped = 0
    let errors = 0

    for (const mapping of mappings) {
      const { profile_id, user_id } = mapping
      if (!profile_id || !user_id) {
        console.warn(`Skipping invalid mapping: ${JSON.stringify(mapping)}`)
        skipped++
        continue
      }

      try {
        const result = await client.query(
          'UPDATE profiles SET user_id = $1 WHERE id = $2',
          [user_id, profile_id]
        )
        if (result.rowCount > 0) {
          updated++
          console.log(`✅ Updated profile ${profile_id} -> user ${user_id}`)
        } else {
          console.warn(`⚠️  Profile ${profile_id} not found`)
          skipped++
        }
      } catch (err) {
        console.error(`❌ Error updating profile ${profile_id}:`, err.message)
        errors++
      }
    }

    console.log('\nSummary:')
    console.log(`  Updated: ${updated}`)
    console.log(`  Skipped: ${skipped}`)
    console.log(`  Errors:  ${errors}`)

    if (errors > 0) {
      process.exitCode = 1
    }
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
