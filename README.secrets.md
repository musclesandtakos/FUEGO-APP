## Storing secrets & using GitHub Secrets in Actions (short guide)

1) Add secrets to the repository (recommended)
- In the repository on GitHub: Settings → Secrets and variables → Actions → New repository secret
  - PRISMA_DATABASE_URL = postgres://user:pass@host:5432/db
  - POSTGRES_URL = postgres://user:pass@host:5432/db
  - PRISMA_API_KEY = <new-prisma-api-key>

- Or use the GitHub CLI:
```bash
gh secret set PRISMA_DATABASE_URL --body "postgres://user:pass@host:5432/db" --repo musclesandtakos/FUEGO-APP
gh secret set POSTGRES_URL --body "postgres://user:pass@host:5432/db" --repo musclesandtakos/FUEGO-APP
gh secret set PRISMA_API_KEY --body "new_prisma_key" --repo musclesandtakos/FUEGO-APP
```

2) Example GitHub Actions snippet (use secrets safely)
- Add this to .github/workflows/ci.yml (or your CI workflow):

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Run Prisma migrate (deploy)
        env:
          DATABASE_URL: ${{ secrets.PRISMA_DATABASE_URL }}
          PRISMA_API_KEY: ${{ secrets.PRISMA_API_KEY }}
        run: |
          npm run prisma:generate
          npm run prisma:migrate:deploy   # or the command your project uses

      - name: Run tests
        env:
          DATABASE_URL: ${{ secrets.PRISMA_DATABASE_URL }}
        run: npm test
```

Notes:
- Prefer using ${{ secrets.NAME }} in Actions rather than committing values in repo.
- For deploy steps (Vercel, Heroku, ECS), set the same secret values in the provider's environment variable config to ensure the app uses rotated credentials.

3) Local development
- Keep a local .env (not committed). Use .env.example as the template.
- If sharing credentials for local dev, use temporary/dev-only credentials and document usage in an internal README that is not public.

4) After a leak (summary of required steps)
- Rotate/revoke the exposed keys now.
- Update GitHub Secrets + all deployment environment variables with the new keys.
- Run git-history cleanup if you want to remove the secret from the repository history (e.g., git-filter-repo with replacements.txt), then force-push cleaned history and ask all collaborators to reclone.
- Enable GitHub Secret Scanning and Push Protection in repo Security settings.
- Add pre-commit/CI scanning hooks (detect-secrets / pre-commit) to prevent future leaks.
