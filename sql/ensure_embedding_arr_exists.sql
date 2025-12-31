-- Idempotent helper: ensure embedding_arr (float8[]) exists and populate it from jsonb embedding when available.
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

-- Populate embedding_arr from jsonb embedding if present and embedding_arr is empty
UPDATE profiles
SET embedding_arr = (
  SELECT array_agg(x::float8)
  FROM jsonb_array_elements_text(embedding) AS elems(x)
)
WHERE embedding IS NOT NULL AND (embedding_arr IS NULL OR cardinality(embedding_arr) = 0);
