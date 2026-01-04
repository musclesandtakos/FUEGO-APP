# Dry-run secret-detection workflow

This document explains how to set the REPLACEMENTS secret and run the dry-run workflow that detects which refs/commits contain secret patterns.

## Add the REPLACEMENTS secret

1. Go to the repository: Settings → Secrets and variables → Actions → New repository secret
2. Name: `REPLACEMENTS`
3. Value: the replacements file content that you would pass to git-filter-repo --replace-text. Example (use literal newlines):

```text
PRISMA_DATABASE_URL="postgres://user:password@host/db"==>PRISMA_DATABASE_URL=REDACTED_PRISMA_DATABASE_URL
POSTGRES_URL="postgres://secret"==>POSTGRES_URL=REDACTED_POSTGRES_URL
regex:sk-[A-Za-z0-9]{48}==>REDACTED_OPENAI_KEY
```

**Note**: Each line should be a pattern to search for. Lines can be:
- Literal strings (with optional replacement): `SECRET_VALUE==>REDACTED`
- Regex patterns: `regex:pattern==>REDACTED`
- Comments starting with `#` are ignored
- Empty lines are ignored

### Using GitHub CLI

Alternatively, you can add the secret using the `gh` CLI:

```bash
# Create a replacements.txt file locally (do NOT commit it!)
cat > /tmp/replacements.txt <<'EOF'
PRISMA_DATABASE_URL="postgres://secret"==>REDACTED
regex:sk-[A-Za-z0-9]{48}==>REDACTED
EOF

# Add as a repository secret
gh secret set REPLACEMENTS < /tmp/replacements.txt

# Clean up the temporary file
rm /tmp/replacements.txt
```

## Run the workflow

1. Go to the repository on GitHub
2. Click on **Actions** tab
3. Select **Dry-run secret detection** workflow from the left sidebar
4. Click **Run workflow** button
5. Select the branch you want to run on (default: main)
6. Click **Run workflow**

The workflow will:
- Check out the repository with full history
- Create a replacements.txt file from the REPLACEMENTS secret
- Run the dry-run detection script
- Upload a report as an artifact

## View the results

After the workflow completes:

1. Click on the completed workflow run
2. Scroll down to the **Artifacts** section
3. Download the `dry-run-report` artifact
4. Extract and review the `report-*.txt` file

The report will show:
- Which commits contain the secret patterns
- Which branches and tags contain those commits
- Match counts and locations (for regex patterns)

## Security notes

### Important safety considerations

- **Read-only**: This workflow does NOT modify repository history
- **Secret masking**: GitHub automatically masks secrets in workflow logs
- **Permissions**: The workflow uses minimal permissions (read-only)
- **No destructive changes**: This is a detection/analysis tool only

### Before cleaning history

If the dry-run detects secrets in your history:

1. **DO NOT** immediately clean history - plan carefully first
2. **Rotate/revoke** the exposed credentials BEFORE cleaning
3. **Coordinate** with all repository collaborators
4. **Backup** the repository before running any history rewriting
5. **Use** the `clean_history_env_replacements_safe.sh` script for actual cleanup (not this dry-run)

## Next steps

After reviewing the dry-run report:

1. **If secrets are found**:
   - Rotate/revoke all exposed credentials immediately
   - Plan a maintenance window for history cleanup
   - Use the `scripts/clean_history_env_replacements_safe.sh` script to clean history
   - Force-push cleaned history and notify collaborators to reclone

2. **If no secrets are found**:
   - You're good! The repository history is clean
   - Consider setting up secret scanning tools for ongoing monitoring

## Troubleshooting

### "No replacements found" error

- Ensure the `REPLACEMENTS` secret is set in repository settings
- Check that the secret value is not empty
- Verify the secret name is exactly `REPLACEMENTS` (case-sensitive)

### Workflow fails to run

- Check that you have the required permissions to run workflows
- Ensure Actions are enabled for the repository
- Verify the workflow file syntax is valid YAML

### No matches in report

- This is good news - no secrets found!
- Double-check your replacement patterns are correct
- Try with a simple test pattern to verify the workflow works

## Related documentation

- [README.secrets.md](../README.secrets.md) - General secrets management guidance
- [SECURITY.md](../SECURITY.md) - Security policies and reporting
- [scripts/clean_history_env_replacements_safe.sh](../scripts/clean_history_env_replacements_safe.sh) - Actual history cleanup script
