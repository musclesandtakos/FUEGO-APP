-- Enable pgvector (requires superuser / service_role)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add a pgvector column sized to your embedding dimension (adjust D to match your embedding model)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'embedding_vector'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN embedding_vector vector(1536);
  END IF;
END
$$;

-- Optional ANN index for vector search (ivfflat). Tune lists for your dataset size.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'profiles' AND indexname = 'idx_profiles_embedding_vector'
  ) THEN
    CREATE INDEX idx_profiles_embedding_vector ON profiles USING ivfflat (embedding_vector vector_l2_ops) WITH (lists = 100);
  END IF;
END
$$;
