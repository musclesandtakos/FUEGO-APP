# Supabase SQL runner + verification

This folder provides an automated SQL runner and verification script to apply the pgvector setup, convert jsonb embeddings to float8[], and create PL/pgSQL functions (cosine_similarity and find_matches RPC).

Requirements
- Node 18+ (for top-level await if you edit scripts) or Node 16+ with these scripts as-is.
- Install dependencies:
  npm install pg minimist

Environment
- DATABASE_URL (or SUPABASE_DB_URL) — your Postgres connection string. For Supabase, use the "Connection string" with service_role (Settings → Database) to allow creating extensions and altering tables.

Files
- sql/*.sql — SQL files that will be executed in order by scripts/run-sql.js
- scripts/run-sql.js — runner that applies the SQL files in order
- scripts/verify-supabase-setup.js — runs checks to verify extension, columns, and functions exist; can run a sample RPC if you pass --profile-id <uuid>

Usage
1. Install deps:
   npm install pg minimist

2. (Optional) Inspect SQL files in ./sql to confirm the changes.

3. Run migrations:
   DATABASE_URL="postgres://..." node scripts/run-sql.js

4. Verify:
   DATABASE_URL="postgres://..." node scripts/verify-supabase-setup.js -- --profile-id <uuid>

Notes
- Always test in a staging DB first.
- If you plan to use pgvector, change the vector dimensionality in pgvector_setup.sql (1536) to match your embedding model.
- The migrate_jsonb_to_float8_array.sql will copy data from `embedding` (jsonb) into `embedding_arr` (float8[]). It will only update rows where `embedding` is present and `embedding_arr` is empty.
- If you prefer to use Supabase RPC for applying SQL, you can adapt these scripts to call the Supabase REST SQL endpoint. Using the DB connection is simpler and more robust for DDL operations.
