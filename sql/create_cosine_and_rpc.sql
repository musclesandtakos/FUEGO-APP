-- Create cosine similarity function (works on float8[] arrays) and paginated find_matches RPC.
-- Safe to re-run: uses CREATE OR REPLACE for functions.

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
  ORDER BY score DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;
