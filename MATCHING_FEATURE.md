# Matching Feature with pgvector, RLS, and Cursor-based Pagination

This guide covers the setup and usage of the matching feature with pgvector embeddings, Row-Level Security (RLS), and cursor-based pagination.

## Overview

The matching feature includes:
- **pgvector extension** for efficient vector similarity search
- **Combined migrations** for idempotent schema setup
- **RLS policies** to protect user data
- **Cursor-based pagination** for scalable matching results
- **Multiple API options**: Next.js API routes and Supabase Edge Functions
- **Admin tools** for database management and verification

## Files Added

### SQL Migrations
- `sql/all_migrations_combined.sql` - Complete, idempotent migration combining all features
- Existing files (preserved):
  - `sql/pgvector_setup.sql`
  - `sql/migrate_jsonb_to_float8_array.sql`
  - `sql/create_cosine_and_rpc.sql`
  - `sql/create_find_matches_cursor.sql`
  - `sql/add_user_id_to_profiles.sql`
  - `sql/create_rls_policies_and_security_invoker.sql`

### Scripts
- `scripts/run-sql.js` - Run SQL migrations in order
- `scripts/verify-rls-and-rpc.js` - Verify RLS policies and test RPC calls
- `scripts/populate-userid-from-mapping.js` - Populate user_id from mapping file
- `scripts/verify-supabase-setup.js` - Verify database setup (existing)

### API & Edge Functions
- `pages/api/find-matches-rls.ts` - Next.js API route with JWT forwarding
- `supabase/functions/find-matches-cursor/index.ts` - Supabase Edge Function
- `lib/supabase-admin.ts` - Admin client factory for server-side operations

### Sample Files
- `mappings.sample.json` - Sample mapping file for user_id population

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This will install the required dependencies:
- `pg` - PostgreSQL client
- `minimist` - Command-line argument parser
- `node-fetch` - Fetch API for Node.js

### 2. Run Migrations

Use a **service_role** DATABASE_URL when running migrations (requires superuser permissions for pgvector):

```bash
DATABASE_URL="postgresql://postgres:[password]@[host]:[port]/[database]" npm run migrate
```

This will run all SQL files in order, including `all_migrations_combined.sql`.

**What the migration does:**
- Enables pgvector extension
- Creates `embedding_arr` (float8[]) and `embedding_vector` (vector) columns
- Populates embeddings from jsonb `embedding` column
- Creates `cosine_similarity` function
- Creates `find_matches` and `find_matches_cursor` RPC functions
- Adds `user_id` and `is_public` columns
- Enables RLS and creates security policies
- Sets functions to SECURITY INVOKER mode
- Creates optional ivfflat index for performance

### 3. Populate User IDs (Optional)

If you have a mapping of profile IDs to user IDs, create a mapping file based on `mappings.sample.json`:

```json
[
  {
    "profile_id": "uuid1",
    "user_id": "uuid2"
  }
]
```

Or use object format:
```json
{
  "profile-uuid-1": "user-uuid-1",
  "profile-uuid-2": "user-uuid-2"
}
```

Then run:
```bash
DATABASE_URL="postgresql://..." npm run populate-userid -- --file=mappings.json
```

### 4. Verify Setup

**Check database schema and functions:**
```bash
DATABASE_URL="postgresql://..." npm run verify
```

**Check RLS policies:**
```bash
DATABASE_URL="postgresql://..." npm run verify-rls -- --check-policies
```

**Test RPC as a user:**
```bash
SUPABASE_URL="https://your-project.supabase.co" \
SUPABASE_ANON_KEY="your-anon-key" \
USER_JWT="user-jwt-token" \
PROFILE_ID="profile-uuid" \
npm run verify-rls -- --test-rpc
```

## Usage

### Using Next.js API Route

The `find-matches-rls` API route forwards the client's JWT to Supabase and relies on RLS for access control.

**Required Environment Variables:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

**Example Request:**
```typescript
const response = await fetch('/api/find-matches-rls', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userJwtToken}`
  },
  body: JSON.stringify({
    profile_id: 'user-profile-uuid',
    limit: 10,
    cursor: null // or { score: 0.95, id: 'last-match-uuid' }
  })
})

const { matches, next_cursor } = await response.json()
```

### Using Supabase Edge Function

Deploy the Edge Function:
```bash
supabase functions deploy find-matches-cursor
```

The Edge Function provides additional security by verifying profile ownership server-side.

**Example Request:**
```typescript
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/find-matches-cursor',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userJwtToken}`
    },
    body: JSON.stringify({
      profile_id: 'user-profile-uuid',
      limit: 10,
      cursor: null
    })
  }
)

const { matches, next_cursor } = await response.json()
```

### Using Admin Client

For server-side operations that need to bypass RLS:

```typescript
import { getSupabaseAdmin } from '../lib/supabase-admin'

const admin = getSupabaseAdmin()
const { data, error } = await admin
  .from('profiles')
  .select('*')
  .eq('id', profileId)
```

**⚠️ Security Warning:** Only use the admin client in secure server contexts. Never expose the service role key to clients.

## RLS Policies

The following policies are created:

1. **select_public_or_own_profiles** - Users can select:
   - Public profiles (`is_public = true`)
   - Their own profiles (`user_id = auth.uid()`)

2. **update_own_profile** - Users can only update their own profiles

3. **insert_profile_authenticated** - Authenticated users can insert profiles (must set `user_id = auth.uid()`)

4. **delete_own_profile** - Users can only delete their own profiles

## RPC Functions

### find_matches (offset-based)
```sql
SELECT * FROM find_matches(
  'profile-uuid',  -- p_profile_id
  10,              -- p_limit
  0                -- p_offset
)
```

### find_matches_cursor (cursor-based)
```sql
SELECT * FROM find_matches_cursor(
  'profile-uuid',  -- p_profile_id
  10,              -- p_limit
  0.95,            -- p_cursor_score (or NULL)
  'last-match-id'  -- p_cursor_id (or NULL)
)
```

Both functions are set to `SECURITY INVOKER`, meaning RLS policies apply when called via REST API.

## Security Considerations

1. **Service Role Key**: Keep `SUPABASE_SERVICE_ROLE_KEY` secret. Never expose it to clients.

2. **Test in Staging First**: Always test migrations and RLS policies in a staging environment before production.

3. **RLS Policies**: Ensure policies match your application's security requirements. Review and customize as needed.

4. **JWT Validation**: Both API route and Edge Function validate JWTs, but Edge Function provides additional ownership verification.

5. **User ID Assignment**: Ensure `user_id` is correctly set for all profiles. Use the populate script or handle in your application logic.

## Troubleshooting

**Migration fails with "permission denied":**
- Use a DATABASE_URL with service_role or superuser permissions

**RPC returns empty results:**
- Check that embeddings are populated (`embedding_arr` is not null)
- Verify RLS policies allow access to the profiles
- Ensure `user_id` is set correctly

**"Missing required environment variables" error:**
- Check that all required environment variables are set in `.env` or your deployment platform

**RLS test fails:**
- Verify the user JWT is valid and not expired
- Check that the profile exists and has `is_public = true` or belongs to the user

## Additional Resources

- [Supabase pgvector Guide](https://supabase.com/docs/guides/ai/vector-columns)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
