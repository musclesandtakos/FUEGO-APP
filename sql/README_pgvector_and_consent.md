pgvector migration, consent, RLS, and secure matching endpoint — README

Overview
- `sql/pgvector_migration_and_rpc.sql`:
  - Adds `embedding_vector` (pgvector) column
  - Adds `normalize_array_to_vector` helper
  - Populates `embedding_vector` from `embedding_arr` (float8[]) by normalizing vectors
  - Creates ivfflat index `idx_profiles_embedding_vector`
  - Adds `find_matches_pgvector` RPC (cursor-based)

- `sql/rls_and_consent.sql`:
  - Adds `consent_to_matching` boolean column (default false)
  - Enables Row Level Security (RLS) on `profiles`
  - Adds example policies:
    - selection allowed when `consent_to_matching = true` OR the row belongs to the requester (id = auth.uid())
    - update allowed only for the owner
    - insert allowed for authenticated users

- `pages/api/secure-find-matches.ts`:
  - Secure server endpoint for fetching matches.
  - Expects Authorization: Bearer <access_token> (user token).
  - Verifies the token and that the user has consented.
  - Calls `find_matches_pgvector` RPC with service role key and returns matches with `next_cursor`.

How to run (recommended order)
1. Ensure embeddings exist in `profiles.embedding_arr` as float8[] (if not, run your earlier migration that converts JSON to float8[]).
2. Run pgvector migration:
   DATABASE_URL="postgres://..." psql -f sql/pgvector_migration_and_rpc.sql
   (Or use the run-sql.js migration runner you already have with the same SQL file in the 'sql' directory)
3. Apply RLS & consent:
   DATABASE_URL="postgres://..." psql -f sql/rls_and_consent.sql
4. Restart/refresh your app so server env vars are available (SUPABASE_SERVICE_ROLE_KEY etc).
5. Use the secure endpoint:
   - Client sends Authorization: Bearer <user_access_token> and POSTs to /api/secure-find-matches with body { limit, cursor }.

Notes & recommendations
- The `consent_to_matching` default is `false`. You should implement a clear UI to request consent from users and let them toggle it.
- RLS policies above are examples. Adjust them for your exact security model — e.g., you may want more restrictive insert/update policies or allow additional server roles.
- ivfflat index `lists` parameter may require tuning. After large inserts, run `VACUUM ANALYZE profiles;` to fully populate the index.
- For very large datasets, consider switching to HNSW (if supported) or dedicated vector DBs like Pinecone/Weaviate.
- Logging and monitoring: track RPC performance and add fallback logic for users with no/partial embeddings.
