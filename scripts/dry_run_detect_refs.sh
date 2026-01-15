#!/usr/bin/env bash
# Dry-run: show which commits and refs (branches/tags) contain the patterns
# specified in replacements.txt or the REPLACEMENTS env var.
# This script is read-only and does not modify the repository.

set -euo pipefail

# Load replacements from replacements.txt (preferred) or REPLACEMENTS env var
if [[ -f "replacements.txt" ]]; then
  mapfile -t LINES < replacements.txt
elif [[ -n "${REPLACEMENTS:-}" ]]; then
  mapfile -t LINES <<< "$REPLACEMENTS"
else
  echo "ERROR: No replacements found. Provide replacements.txt or set REPLACEMENTS environment variable."
  exit 1
fi

# Check we're in a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: Please run this script from inside a git repository clone."
  exit 2
fi

REPORT_FILE="report-$(date +%Y%m%d%H%M%S).txt"
exec > >(tee "$REPORT_FILE")
exec 2>&1

echo "Starting dry-run search across all refs..."

idx=0
for raw in "${LINES[@]}"; do
  idx=$((idx+1))
  # Skip empty/comment lines
  [[ -z "${raw//[[:space:]]/}" ]] && continue
  [[ "${raw#"${raw%%[![:space:]]*}"}" == "#"* ]] && continue

  if [[ "$raw" == *"==>"* ]]; then
    lhs="${raw%%==>*}"
    rhs="${raw#*==>}"
  else
    lhs="$raw"
    rhs=""
  fi

  if [[ "$lhs" == regex:* ]]; then
    pattern="${lhs#regex:}"
    echo
    echo "Pattern #${idx} (regex): ${pattern}"
    echo "Searching history for regex pattern (this may take time)..."

    matches=$(git rev-list --all | xargs -n1 -P4 -I{} git grep -nE --line-number --no-color -e "${pattern}" {} 2>/dev/null || true)

    if [[ -z "$matches" ]]; then
      echo "  No matches found for regex pattern."
      continue
    fi

    total=$(printf '%s\n' "$matches" | wc -l)
    echo "  Found ${total} matches (showing up to first 50):"
    printf '%s\n' "$matches" | sed -n '1,50p'

    commits=$(printf '%s\n' "$matches" | cut -d: -f1 | sort -u)
    echo "  Affected commits (unique):"
    printf '    %s\n' $commits

    for c in $commits; do
      branches=$(git branch --contains "$c" --all --format="%(refname:short)" 2>/dev/null || true)
      tags=$(git tag --contains "$c" 2>/dev/null || true)
      echo "    Commit $c"
      echo "      Branches: ${branches:-(none)}"
      echo "      Tags: ${tags:-(none)}"
    done

  else
    secret="${lhs//\"/}"
    echo
    echo "Pattern #${idx} (literal): (hidden)"

    commits=$(git log --all -S"$secret" --pretty=format:%H 2>/dev/null || true)

    if [[ -z "$commits" ]]; then
      matches=$(git rev-list --all | xargs -n1 -P4 -I{} git grep -nF --line-number --no-color -e "$secret" {} 2>/dev/null || true)
      if [[ -z "$matches" ]]; then
        echo "  No matches found for literal."
        continue
      fi
      total=$(printf '%s\n' "$matches" | wc -l)
      echo "  Found ${total} matches (showing up to first 50):"
      printf '%s\n' "$matches" | sed -n '1,50p'
      commits=$(printf '%s\n' "$matches" | cut -d: -f1 | sort -u)
    else
      echo "  Commits where the literal was added/removed (git log -S):"
      printf '    %s\n' $commits
    fi

    echo "  Refs containing each commit:"
    for c in $commits; do
      branches=$(git branch --contains "$c" --all --format="%(refname:short)" 2>/dev/null || true)
      tags=$(git tag --contains "$c" 2>/dev/null || true)
      echo "    Commit $c"
      echo "      Branches: ${branches:-(none)}"
      echo "      Tags: ${tags:-(none)}"
    done
  fi

done

echo
echo "Dry-run complete. Report saved to $REPORT_FILE"

exit 0
