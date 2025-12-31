-- Convert jsonb embeddings to a float8[] column (safe to re-run).
-- This script creates the embedding_arr column and populates it from embedding (jsonb) if present.

DO $$
BEGIN
  -- Add float8[] column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'embedding_arr'
  ) THEN
    ALTER TABLE profiles ADD COLUMN embedding_arr float8[];
  END IF;
END
$$;

-- Populate embedding_arr from the jsonb embedding column when embedding_arr is null
UPDATE profiles
SET embedding_arr = (
  SELECT array_agg(x::float8)
  FROM jsonb_array_elements_text(embedding) AS elems(x)
)
WHERE embedding IS NOT NULL AND (embedding_arr IS NULL OR cardinality(embedding_arr) = 0);
