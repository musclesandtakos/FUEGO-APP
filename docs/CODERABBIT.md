# CodeRabbit Integration

This repository uses [CodeRabbit](https://coderabbit.ai/) for AI-powered code reviews on pull requests.

## What is CodeRabbit?

CodeRabbit is an AI-powered code review platform that automatically reviews code changes when you open a pull request. It provides:

- **Automated code review** - Line-by-line feedback on pull requests
- **Context-aware suggestions** - Understanding of the codebase structure
- **Security analysis** - Highlights potential vulnerabilities
- **Best practices** - Ensures code follows project conventions
- **1-click fixes** - Suggests improvements with code snippets

## How It Works

1. **Open a Pull Request** - Create a PR with your changes
2. **Automatic Review** - CodeRabbit automatically analyzes the code
3. **Review Comments** - CodeRabbit posts comments on lines that need attention
4. **Interactive Chat** - You can ask CodeRabbit questions using `@coderabbitai` in PR comments
5. **Resolve Issues** - Address the feedback and update your PR

## Configuration

The CodeRabbit configuration is stored in `.github/coderabbit.yaml`. This file defines:

- **Review Profile**: "chill" mode for balanced reviews
- **Auto-review**: Enabled for all PRs (except drafts)
- **Path-specific Instructions**: Custom rules for different file types
  - TypeScript/TSX files: Type safety, error handling, security
  - API routes: Validation, authentication, proper error codes
  - SQL migrations: Idempotency, RLS policies, no hardcoded secrets
- **Exclusions**: node_modules, build artifacts, lock files, .env files

## Using CodeRabbit

### Triggering a Review

CodeRabbit automatically reviews all new pull requests. To manually trigger a review, comment:

```
@coderabbitai review
```

### Asking Questions

You can ask CodeRabbit about specific code:

```
@coderabbitai Can you explain why this approach is better?
```

### Requesting Changes

Ask CodeRabbit to suggest improvements:

```
@coderabbitai How can I improve the security of this endpoint?
```

## Security Focus

CodeRabbit is configured to emphasize security for this project:

- **API Key Protection**: Alerts if secrets might be exposed
- **SQL Injection**: Reviews SQL queries for potential vulnerabilities
- **XSS Prevention**: Checks for proper input sanitization
- **Row Level Security**: Ensures RLS policies are properly implemented
- **Environment Variables**: Validates proper use of secrets

## Setup for New Contributors

CodeRabbit works automatically on pull requests - no setup needed! Just create a PR and CodeRabbit will review it.

If you're a repository maintainer, you can access the CodeRabbit dashboard at [app.coderabbit.ai](https://app.coderabbit.ai) to:
- View review history
- Customize settings
- Manage repository access

## Best Practices

1. **Review CodeRabbit feedback** - Take time to understand suggestions
2. **Ask questions** - Use `@coderabbitai` if you need clarification
3. **Address security issues** - Always fix security-related feedback
4. **Iterate** - CodeRabbit reviews updated code after changes

## Resources

- [CodeRabbit Documentation](https://docs.coderabbit.ai/)
- [CodeRabbit GitHub Integration](https://docs.coderabbit.ai/platforms/github-com)
- [FUEGO-APP Security Guidelines](../SECURITY.md)

## Troubleshooting

**CodeRabbit didn't review my PR**
- Check that auto-review is enabled in `.github/coderabbit.yaml`
- Ensure the PR is not a draft
- Try manually triggering with `@coderabbitai review`

**Too many comments**
- CodeRabbit is configured in "chill" mode for balanced reviews
- You can ask CodeRabbit to focus on specific aspects

**False positives**
- Not all suggestions are critical - use your judgment
- If you disagree, you can explain why in a comment

---

For questions or issues with CodeRabbit integration, please open an issue or contact the repository maintainers.
