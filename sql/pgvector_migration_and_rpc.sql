-- Idempotent pgvector setup, normalization, index, and pgvector-based cursor RPC.
-- Adjust the vector dimensionality (1536) to match your embedding model.

-- 1) Enable pgvector extension (requires superuser / service_role)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2) Helper function: normalize a float8[] and return a pgvector
-- Safe to re-run: CREATE OR REPLACE
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

-- 3) Add embedding_vector column if missing
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

-- 4) Populate embedding_vector from embedding_arr (float8[]) by normalizing
-- Only populate rows where embedding_arr exists and embedding_vector is null.
UPDATE profiles
SET embedding_vector = normalize_array_to_vector(embedding_arr)
WHERE embedding_arr IS NOT NULL
  AND (embedding_vector IS NULL);

-- 5) Analyze the table (helps ivfflat index creation)
ANALYZE profiles;

-- 6) Create ivfflat ANN index if missing; tune lists for your dataset size
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'profiles' AND indexname = 'idx_profiles_embedding_vector'
  ) THEN
    -- ivfflat uses L2 distance; because vectors are normalized, nearest by L2 ~ nearest by cosine
    CREATE INDEX idx_profiles_embedding_vector ON profiles USING ivfflat (embedding_vector vector_l2_ops) WITH (lists = 100);
    -- After creating ivfflat, you should run: VACUUM ANALYZE profiles; (we already ANALYZE'd above)
  END IF;
END
$$;

-- 7) Cursor-based RPC using pgvector ANN for matching
-- It returns (match_id, name, likes_text, score) ordered by score DESC.
-- Score is derived from L2 distance on normalized vectors:
--   score = 1 - 0.5 * dist^2   (for normalized vectors: dist^2 = 2 - 2*cos; solved => cos = 1 - dist^2/2)
-- Higher score = better match (cosine-like in [ -1..1 ] but practically [0..1] for normalized embeddings used here)
CREATE OR REPLACE FUNCTION find_matches_pgvector(
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
    SELECT embedding_vector
    FROM profiles
    WHERE id = p_profile_id
    LIMIT 1
  ), scored AS (
    SELECT
      p.id AS match_id,
      p.name,
      p.likes_text,
      (p.embedding_vector <-> t.embedding_vector) AS dist
    FROM profiles p, target t
    WHERE p.id <> p_profile_id
      AND p.embedding_vector IS NOT NULL
      AND t.embedding_vector IS NOT NULL
  ), with_score AS (
    SELECT
      match_id,
      name,
      likes_text,
      (1.0 - 0.5 * dist * dist) AS score
    FROM scored
  ), filtered AS (
    SELECT *
    FROM with_score
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
