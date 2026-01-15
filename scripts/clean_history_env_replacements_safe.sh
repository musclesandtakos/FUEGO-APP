#!/usr/bin/env bash
# Secure repo history cleanup script that uses replacements supplied via an environment variable.
#
# Behavior:
# - Prompts for OWNER/REPO and clone protocol (HTTPS or SSH).
# - Attempts to pass replacements to git-filter-repo via process substitution (no disk file).
# - If process substitution is unavailable, falls back to a securely-created temporary file
#   with restrictive permissions, which is securely removed after use (shred if available).
# - Mirrors the repo, runs git-filter-repo --replace-text, runs gc, then force-pushes all refs and tags.
#
# IMPORTANT SAFETY NOTES:
# - This WILL rewrite history and force-push. Back up the repository first and coordinate with collaborators.
# - Rotate/revoke the leaked credentials BEFORE or IMMEDIATELY AFTER running this script.
# - Do not run on an untrusted machine.
#
# USAGE:
# 1) In the shell you will use to run the script, set REPLACEMENTS to the replacements file content.
#    Example (bash, multi-line, no disk file):
#      export REPLACEMENTS=$(cat <<'REPL'
#      PRISMA_DATABASE_URL="postgres://<secret>"==>PRISMA_DATABASE_URL=REDACTED_PRISMA_DATABASE_URL
#      POSTGRES_URL="postgres://<secret>"==>POSTGRES_URL=REDACTED_POSTGRES_URL
#      REPL
#      )
#
#    Or build it programmatically in the same shell session. Do not store the replacements in a file
#    unless you understand the security implications.
#
# 2) Make script executable and run:
#      chmod +x scripts/clean_history_env_replacements_safe.sh
#      ./scripts/clean_history_env_replacements_safe.sh
#
set -euo pipefail

# Check for required tool
if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "ERROR: git-filter-repo is not installed or not in PATH. Install it, e.g.:"
  echo "  pip install git-filter-repo"
  exit 2
fi

# Ensure REPLACEMENTS env var exists
if [[ -z "${REPLACEMENTS:-}" ]]; then
  cat <<'MSG'
ERROR: Environment variable REPLACEMENTS is not set or is empty.

Set REPLACEMENTS to the replacement file contents before running this script.
Example (bash):
export REPLACEMENTS=$(cat <<'REPL'
PRISMA_DATABASE_URL="postgres://...secret..."==>PRISMA_DATABASE_URL=REDACTED_PRISMA_DATABASE_URL
POSTGRES_URL="postgres://...secret..."==>POSTGRES_URL=REDACTED_POSTGRES_URL
REPL
)
MSG
  exit 3
fi

# Defaults (can be overridden interactively)
DEFAULT_OWNER="musclesandtakos"
DEFAULT_REPO="FUEGO-APP"
DEFAULT_BRANCH="main"

echo "=== Secure Repo History Cleanup ==="
read -r -p "Owner (default: ${DEFAULT_OWNER}): " OWNER
OWNER=${OWNER:-$DEFAULT_OWNER}
read -r -p "Repository name (default: ${DEFAULT_REPO}): " REPO
REPO=${REPO:-$DEFAULT_REPO}
read -r -p "Default branch name (default: ${DEFAULT_BRANCH}): " BRANCH
BRANCH=${BRANCH:-$DEFAULT_BRANCH}

echo
echo "Choose clone protocol:"
echo "  1) HTTPS (recommended)"
echo "  2) SSH"
read -r -p "Select 1 or 2 (default 1): " PROTO_CHOICE
PROTO_CHOICE=${PROTO_CHOICE:-1}

if [[ "${PROTO_CHOICE}" == "2" ]]; then
  GIT_URL="git@github.com:${OWNER}/${REPO}.git"
else
  GIT_URL="https://github.com/${OWNER}/${REPO}.git"
fi

MIRROR_DIR="${REPO}.git"

echo
echo "Target repository: ${OWNER}/${REPO}"
echo "Clone URL: ${GIT_URL}"
echo
echo "THIS WILL REWRITE HISTORY AND FORCE-PUSH. All collaborators must reclone after."
echo "Have you rotated/revoked the exposed credentials? Type YES to continue."
read -r CONFIRM
if [[ "${CONFIRM}" != "YES" ]]; then
  echo "Aborting. Rotate/revoke secrets and re-run when ready."
  exit 1
fi

# Ensure we won't accidentally overwrite existing data without consent
if [[ -d "${MIRROR_DIR}" ]]; then
  read -r -p "Mirror dir '${MIRROR_DIR}' already exists. Remove it? (y/N): " RESP
  RESP=${RESP:-N}
  if [[ "${RESP}" =~ ^[Yy]$ ]]; then
    rm -rf "${MIRROR_DIR}"
  else
    echo "Aborting to avoid overwriting existing directory."
    exit 1
  fi
fi

echo "Cloning mirror of ${GIT_URL}..."
git clone --mirror "${GIT_URL}" "${MIRROR_DIR}"

# Prepare cleanup trap to remove any temp file (if created)
TMPFILE=""
cleanup() {
  # Attempt to securely remove tmp file if created
  if [[ -n "${TMPFILE}" && -f "${TMPFILE}" ]]; then
    # Try shred, then fallback to overwrite+rm
    if command -v shred >/dev/null 2>&1; then
      shred -u "${TMPFILE}" || rm -f "${TMPFILE}"
    else
      # overwrite with zeros then remove
      : > "${TMPFILE}"
      rm -f "${TMPFILE}"
    fi
    TMPFILE=""
  fi
  # Do NOT remove the mirror repo here automatically (left for operator)
}
trap cleanup EXIT

echo "Running git-filter-repo with replacements..."
# Attempt process substitution first (avoids writing a file)
USE_PROC_SUB=false
# Check if the shell supports process substitution by attempting to create one
# We'll try a harmless command that reads from a process-substitution fd
if bash -c 'cat <(echo ok) >/dev/null' 2>/dev/null; then
  USE_PROC_SUB=true
fi

echo "Running git-filter-repo with replacements..."
if $USE_PROC_SUB; then
  # Use process substitution: this passes replacements via a fd, not a disk file.
  # NOTE: this requires a bash-compatible shell.
  git -C "${MIRROR_DIR}" filter-repo --replace-text <(printf '%s
' "$REPLACEMENTS")
  FILTER_EXIT=$?
else
  # Fall back to a secure temporary file with restrictive permissions.
  # Create tmp file in secure mode.
  TMPFILE=$(mktemp --tmpdir "replacements.XXXXXX") || TMPFILE=$(mktemp "/tmp/replacements.XXXXXX")
  # Restrict permissions
  chmod 600 "${TMPFILE}"
  # Write replacements into it
  printf '%s
' "$REPLACEMENTS" > "${TMPFILE}"
  # Run git-filter-repo with that tmp file
  git -C "${MIRROR_DIR}" filter-repo --replace-text "${TMPFILE}"
  FILTER_EXIT=$?
  # TMPFILE will be removed by cleanup trap (shred or rm)
fi

if [[ "${FILTER_EXIT}" -ne 0 ]]; then
  echo "git-filter-repo failed with exit code ${FILTER_EXIT}. Aborting before push."
  exit "${FILTER_EXIT}"
fi

echo "Expiring reflog and running aggressive garbage collection..."
git -C "${MIRROR_DIR}" reflog expire --expire=now --all
git -C "${MIRROR_DIR}" gc --prune=now --aggressive

echo "Force-pushing cleaned branches and tags to origin..."
git -C "${MIRROR_DIR}" push --force --all "${GIT_URL}"
git -C "${MIRROR_DIR}" push --force --tags "${GIT_URL}"

# Cleanup the tmp file (trap will attempt to remove)
cleanup

echo
echo "=== DONE ==="
echo "Repository history was rewritten and force-pushed to ${GIT_URL}."
echo
echo "IMPORTANT NEXT STEPS:"
echo "- Confirm secrets have been rotated/revoked."
echo "- Inform all collaborators to reclone the repository:"
echo "    git clone ${GIT_URL}"
echo "- Rebuild CI caches and redeploy using rotated secrets stored in a secure secret store."
echo "- Audit for secrets in LFS, backups, or external copies and clean them."
echo
exit 0
