# Model Context Protocol (MCP) Configuration

## Overview

This repository is configured to use the Model Context Protocol (MCP) to integrate with AI services. MCP is a protocol that enables standardized communication between AI applications and external tools/data sources.

## GitHub Copilot MCP Endpoint

### What is api.githubcopilot.com/mcp?

The GitHub Copilot MCP endpoint (`https://api.githubcopilot.com/mcp`) is GitHub's official Model Context Protocol server that provides access to GitHub Copilot's capabilities through the standardized MCP interface.

### Configuration

The GitHub Copilot MCP server is configured in `mcp.json`:

```json
{
  "mcpServers": {
    "github-copilot": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://api.githubcopilot.com/mcp"
      ]
    }
  }
}
```

### Authentication

To use the GitHub Copilot MCP endpoint, you need:

1. **GitHub Copilot Subscription**: An active GitHub Copilot subscription (Individual, Business, or Enterprise)
2. **Authentication Token**: A valid GitHub token with Copilot access

You can authenticate in several ways:

#### Option 1: Using GitHub CLI (Recommended)
```bash
gh auth login
```

#### Option 2: Environment Variable
```bash
export GITHUB_TOKEN="your_github_token_here"
```

Add this to your `.env` file:
```
GITHUB_TOKEN="your_personal_access_token"
```

**Important**: Never commit your GitHub token to the repository. The `.env` file is gitignored.

## Available MCP Servers

This repository is configured with multiple MCP servers:

### 1. GitHub Copilot (`github-copilot`)
- **Endpoint**: `https://api.githubcopilot.com/mcp`
- **Purpose**: Access GitHub Copilot's AI capabilities via MCP
- **Requires**: GitHub Copilot subscription and authentication

### 2. AI Elements (`ai-elements`)
- **Endpoint**: `https://registry.ai-sdk.dev/api/mcp`
- **Purpose**: Access AI SDK registry tools and resources
- **Requires**: No authentication for basic features

## Using MCP Servers

MCP servers are automatically loaded when you use compatible AI development tools. They provide additional context, tools, and capabilities to AI assistants.

### Verifying Configuration

To verify your MCP configuration is working:

1. Check that `mcp.json` exists in the repository root
2. Ensure you have the required authentication (GitHub token for Copilot)
3. MCP-compatible tools will automatically detect and load the servers

### Troubleshooting

**Issue**: MCP server not connecting
- **Solution**: Verify your GitHub token is valid and has Copilot access
- **Check**: Run `gh auth status` to verify authentication

**Issue**: Permission denied
- **Solution**: Ensure your GitHub Copilot subscription is active
- **Check**: Visit https://github.com/settings/copilot to manage your subscription

**Issue**: Server not found
- **Solution**: Check your internet connection and that the MCP endpoint URLs are correct

## Security Best Practices

1. **Never commit tokens**: Keep your GitHub token in `.env` files that are gitignored
2. **Use minimal permissions**: GitHub tokens should have only the necessary scopes
3. **Rotate tokens regularly**: Generate new tokens periodically for security
4. **Monitor usage**: Check your GitHub Copilot usage in your account settings

## Additional Resources

- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [GitHub Token Management](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

## Support

For issues with:
- **MCP Configuration**: Check this documentation and the `mcp.json` file
- **GitHub Copilot Access**: Visit https://github.com/settings/copilot
- **Authentication**: Run `gh auth status` or check your GitHub token
