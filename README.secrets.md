## Storing secrets & using GitHub Secrets in Actions (short guide)

⚠️ **SECURITY ALERT**: If you received a Vercel token in a public issue or pull request, that token has been exposed and MUST be revoked immediately. Follow the instructions in section 2.1 and 4 below to revoke and replace it.

1) Add secrets to the repository (recommended)
- In the repository on GitHub: Settings → Secrets and variables → Actions → New repository secret
  - PRISMA_DATABASE_URL = postgres://user:pass@host:5432/db
  - POSTGRES_URL = postgres://user:pass@host:5432/db
  - PRISMA_API_KEY = <new-prisma-api-key>
  - VERCEL_TOKEN = <your-vercel-token>

- Or use the GitHub CLI:
```bash
gh secret set PRISMA_DATABASE_URL --body "postgres://user:pass@host:5432/db" --repo musclesandtakos/FUEGO-APP
gh secret set POSTGRES_URL --body "postgres://user:pass@host:5432/db" --repo musclesandtakos/FUEGO-APP
gh secret set PRISMA_API_KEY --body "new_prisma_key" --repo musclesandtakos/FUEGO-APP
gh secret set VERCEL_TOKEN --body "your-vercel-token" --repo musclesandtakos/FUEGO-APP
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

2.1) Vercel Deployment Token
- The VERCEL_TOKEN is used for automated deployments via GitHub Actions to Vercel.
- To obtain a Vercel token:
  1. Log in to your Vercel account at https://vercel.com
  2. Go to Settings → Tokens
  3. Create a new token with appropriate scope for your project
  4. Copy the token immediately (it won't be shown again)
  5. Store it as a GitHub secret named `VERCEL_TOKEN`

**Security Warning**: Never commit Vercel tokens to the repository. If a token is exposed:
  - Revoke it immediately from your Vercel account (Settings → Tokens)
  - Generate a new token
  - Update the GitHub secret with the new token
  - Review Vercel deployment logs for any unauthorized activity

Example GitHub Actions workflow using Vercel token:
```yaml
- name: Deploy to Vercel
  env:
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
  run: |
    npm install -g vercel
    vercel --token $VERCEL_TOKEN --prod
```

3) Local development
- Keep a local .env (not committed). Use .env.example as the template.
- If sharing credentials for local dev, use temporary/dev-only credentials and document usage in an internal README that is not public.

4) After a leak (summary of required steps)
- Rotate/revoke the exposed keys now.
- Update GitHub Secrets + all deployment environment variables with the new keys.
- Run git-history cleanup if you want to remove the secret from the repository history (e.g., git-filter-repo with replacements.txt), then force-push cleaned history and ask all collaborators to reclone.
- Enable GitHub Secret Scanning and Push Protection in repo Security settings.
- Add pre-commit/CI scanning hooks (detect-secrets / pre-commit) to prevent future leaks.
