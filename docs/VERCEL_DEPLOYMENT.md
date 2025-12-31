# Vercel Deployment Guide

This guide provides instructions for setting up and managing Vercel deployments for the FUEGO-APP.

## Quick Start

### Step 1: Set Up Vercel Token as GitHub Secret

The FUEGO-APP uses GitHub Actions to automate deployments to Vercel. You need to store your Vercel token as a GitHub secret.

#### ⚠️ CRITICAL SECURITY NOTICE

**A Vercel token was exposed in a public issue and must be revoked immediately.**

If you have received or used a Vercel token from a public issue or pull request:
1. Go to https://vercel.com → Settings → Tokens
2. Revoke the token immediately
3. Create a new token following the instructions below
4. Never share tokens in public issues, pull requests, or commit them to the repository

### Step 2: Create a New Vercel Token

1. Log in to your Vercel account at https://vercel.com
2. Navigate to **Settings** → **Tokens**
3. Click **Create Token**
4. Give your token a descriptive name (e.g., "FUEGO-APP GitHub Actions")
5. Select the appropriate scope:
   - **Recommended**: Select specific projects if you want to limit access
   - **Full Access**: Only if you need to deploy multiple projects
6. Set an expiration date (recommended for security)
7. Click **Create**
8. **Copy the token immediately** - it won't be shown again!

### Step 3: Store Token as GitHub Secret

#### Option 1: Using GitHub Web Interface

1. Go to your repository on GitHub: https://github.com/musclesandtakos/FUEGO-APP
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `VERCEL_TOKEN`
5. Value: Paste your Vercel token
6. Click **Add secret**

#### Option 2: Using GitHub CLI

```bash
gh secret set VERCEL_TOKEN --body "your-actual-vercel-token-here" --repo musclesandtakos/FUEGO-APP
```

### Step 4: Additional Vercel Secrets (Optional)

For more granular control over deployments, you may also want to set:

```bash
# Your Vercel organization/team ID
gh secret set VERCEL_ORG_ID --body "your-org-id" --repo musclesandtakos/FUEGO-APP

# Your specific project ID
gh secret set VERCEL_PROJECT_ID --body "your-project-id" --repo musclesandtakos/FUEGO-APP
```

You can find these IDs in your Vercel project settings.

## Using Vercel Token in GitHub Actions

Here's an example of how to use the Vercel token in a GitHub Actions workflow:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install Vercel CLI
        run: npm install -g vercel@latest
      
      - name: Pull Vercel Environment Information
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## Environment Variables in Vercel

Don't forget to also set your application's environment variables in Vercel:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add the following variables (from your `.env.example`):
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
   - `OPENAI_EMBEDDING_MODEL`
   - Any other variables your app requires

Make sure to set these for all environments (Production, Preview, Development) as needed.

## Security Best Practices

### Token Security

1. **Never commit tokens to the repository**
   - Always use GitHub Secrets or environment variables
   - Never hardcode tokens in workflow files

2. **Rotate tokens regularly**
   - Set expiration dates on tokens when creating them
   - Create new tokens and update secrets before expiration
   - Revoke old tokens after updating

3. **Use minimal scope**
   - Only grant tokens the permissions they need
   - Use project-specific tokens when possible
   - Avoid using full-access tokens for automated deployments

4. **Monitor token usage**
   - Regularly review your Vercel audit logs
   - Check for unexpected deployments
   - Set up alerts for unusual activity

### What to Do If a Token Is Compromised

1. **Revoke immediately**: Go to Vercel Settings → Tokens and revoke the compromised token
2. **Generate new token**: Create a new token with the same or more restrictive permissions
3. **Update GitHub secret**: Update the `VERCEL_TOKEN` secret with the new value
4. **Review logs**: Check Vercel deployment logs for any unauthorized activity
5. **Check deployments**: Verify that no unauthorized deployments were made
6. **Notify team**: Alert team members of the security incident

## Verification

To verify that your Vercel token is correctly configured:

1. Trigger a GitHub Actions workflow that uses the token
2. Check the workflow logs for successful authentication
3. Verify that deployment completes successfully
4. Check your Vercel dashboard for the new deployment

## Troubleshooting

### "Invalid token" error

- Verify the token hasn't expired
- Check that you copied the entire token
- Ensure no extra spaces in the GitHub secret value
- Verify the token has the necessary permissions

### "Project not found" error

- Verify `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are set correctly
- Check that the token has access to the specified project
- Ensure the project exists in your Vercel account

### Deployment fails silently

- Check Vercel dashboard for error messages
- Review GitHub Actions logs for detailed error output
- Verify all required environment variables are set in Vercel

## Additional Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [GitHub Actions with Vercel](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
- [Vercel API Tokens](https://vercel.com/docs/rest-api#creating-an-access-token)

## Support

If you encounter issues with Vercel deployment:

1. Check the Vercel documentation
2. Review GitHub Actions logs
3. Consult the FUEGO-APP README.md and SECURITY.md
4. Create an issue in the repository (without including any secrets!)
