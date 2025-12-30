-- Combined, idempotent migrations for pgvector matching feature with RLS
-- Safe to re-run multiple times. Includes:
-- 1. pgvector extension setup
-- 2. embedding_arr (float8[]) column
-- 3. embedding_vector (pgvector) column
-- 4. Populate from jsonb embedding
-- 5. cosine_similarity function
-- 6. find_matches RPC (offset-based)
-- 7. find_matches_cursor RPC (cursor-based)
-- 8. user_id and is_public columns
-- 9. RLS policies
-- 10. Optional: normalize and populate embedding_vector

-- ========================================
-- 1. Enable pgvector extension
-- ========================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ========================================
-- 2. Add embedding_arr column (float8[])
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'embedding_arr'
  ) THEN
    ALTER TABLE profiles ADD COLUMN embedding_arr float8[];
  END IF;
END
$$;

-- ========================================
-- 3. Add embedding_vector column (pgvector)
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'embedding_vector'
  ) THEN
    ALTER TABLE profiles ADD COLUMN embedding_vector vector(1536);
  END IF;
END
$$;

-- ========================================
-- 4. Populate embedding_arr from jsonb embedding
-- ========================================
UPDATE profiles
SET embedding_arr = (
  SELECT array_agg(x::float8)
  FROM jsonb_array_elements_text(embedding) AS elems(x)
)
WHERE embedding IS NOT NULL AND (embedding_arr IS NULL OR cardinality(embedding_arr) = 0);

-- ========================================
-- 5. Create cosine_similarity function
-- ========================================
CREATE OR REPLACE FUNCTION cosine_similarity(a float8[], b float8[])
RETURNS float8 AS $$
DECLARE
  dot float8;
  na float8;
  nb float8;
BEGIN
  IF a IS NULL OR b IS NULL THEN
    RETURN 0;
  END IF;

  SELECT SUM(a1*b1), SUM(a1*a1), SUM(b1*b1)
  INTO dot, na, nb
  FROM unnest(a, b) AS t(a1, b1);

  IF dot IS NULL OR na IS NULL OR nb IS NULL OR na = 0 OR nb = 0 THEN
    RETURN 0;
  END IF;

  RETURN dot / (sqrt(na) * sqrt(nb));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ========================================
-- 6. Create find_matches RPC (offset-based)
-- ========================================
CREATE OR REPLACE FUNCTION find_matches(
  p_profile_id uuid,
  p_limit int DEFAULT 10,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  match_id uuid,
  name text,
  likes_text text,
  score float8
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.likes_text,
    cosine_similarity(target.embedding_arr, p.embedding_arr) AS score
  FROM profiles p
  CROSS JOIN LATERAL (
    SELECT embedding_arr
    FROM profiles
    WHERE id = p_profile_id
    LIMIT 1
  ) target
  WHERE p.id <> p_profile_id
    AND p.embedding_arr IS NOT NULL
    AND target.embedding_arr IS NOT NULL
  ORDER BY score DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ========================================
-- 7. Create find_matches_cursor RPC (cursor-based)
-- ========================================
CREATE OR REPLACE FUNCTION find_matches_cursor(
  p_profile_id uuid,
  p_limit int DEFAULT 10,
  p_cursor_score float8 DEFAULT NULL,
  p_cursor_id uuid DEFAULT NULL
)
RETURNS TABLE (
  match_id uuid,
  name text,
  likes_text text,
  score float8
) AS $$
BEGIN
  RETURN QUERY
  WITH target AS (
    SELECT embedding_arr
    FROM profiles
    WHERE id = p_profile_id
    LIMIT 1
  ), scored AS (
    SELECT
      p.id AS match_id,
      p.name,
      p.likes_text,
      cosine_similarity(target.embedding_arr, p.embedding_arr) AS score
    FROM profiles p, target
    WHERE p.id <> p_profile_id
      AND p.embedding_arr IS NOT NULL
      AND target.embedding_arr IS NOT NULL
  ), filtered AS (
    SELECT *
    FROM scored
    WHERE
      p_cursor_score IS NULL
      OR (score < p_cursor_score OR (score = p_cursor_score AND match_id < p_cursor_id))
  )
  SELECT match_id, name, likes_text, score
  FROM filtered
  ORDER BY score DESC, match_id DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ========================================
-- 8. Add user_id and is_public columns
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_id uuid;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_public boolean DEFAULT false;
  END IF;
END
$$;

-- ========================================
-- 9. Enable RLS and create policies
-- ========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: allow selecting public profiles or profiles owned by the current user
DROP POLICY IF EXISTS "select_public_or_own_profiles" ON profiles;
CREATE POLICY "select_public_or_own_profiles" ON profiles
  FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

-- Policy: allow users to update only their own profiles
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: allow insert for authenticated users
DROP POLICY IF EXISTS "insert_profile_authenticated" ON profiles;
CREATE POLICY "insert_profile_authenticated" ON profiles
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- Policy: allow users to delete only their own profiles
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles
  FOR DELETE
  USING (user_id = auth.uid());

-- Set find_matches and find_matches_cursor functions to use SECURITY INVOKER
-- This ensures RLS policies are applied when calling these RPCs
ALTER FUNCTION find_matches(uuid, int, int) SECURITY INVOKER;
ALTER FUNCTION find_matches_cursor(uuid, int, float8, uuid) SECURITY INVOKER;

-- ========================================
-- 10. Helper function to normalize and populate embedding_vector
-- ========================================
CREATE OR REPLACE FUNCTION normalize_array_to_vector(arr float8[])
RETURNS vector AS $$
DECLARE
  norm float8;
  normed float8[];
  s text;
BEGIN
  IF arr IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT sqrt(SUM(x*x)) INTO norm FROM UNNEST(arr) AS x;
  IF norm IS NULL OR norm = 0 THEN
    RETURN NULL;
  END IF;

  SELECT ARRAY_AGG(x / norm) INTO normed FROM UNNEST(arr) AS x;
  s := '[' || array_to_string(normed, ',') || ']';
  RETURN s::vector;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Populate embedding_vector from embedding_arr (normalized)
-- Only update rows where embedding_arr exists and embedding_vector is null
UPDATE profiles
SET embedding_vector = normalize_array_to_vector(embedding_arr)
WHERE embedding_arr IS NOT NULL
  AND embedding_vector IS NULL;

-- Analyze the table for query optimization
ANALYZE profiles;

-- Create ivfflat index for ANN search (optional but recommended for performance)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'profiles' AND indexname = 'idx_profiles_embedding_vector'
  ) THEN
    CREATE INDEX idx_profiles_embedding_vector ON profiles USING ivfflat (embedding_vector vector_l2_ops) WITH (lists = 100);
  END IF;
END
$$;

-- Final VACUUM ANALYZE for index optimization
VACUUM ANALYZE profiles;
