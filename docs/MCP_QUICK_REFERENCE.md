# Quick Reference: GitHub Copilot MCP Endpoint

## What is api.githubcopilot.com/mcp?

**`https://api.githubcopilot.com/mcp`** is GitHub's official Model Context Protocol (MCP) server endpoint.

## What does it do?

This endpoint allows AI development tools to connect to GitHub Copilot's capabilities using the standardized Model Context Protocol. It provides:

- Access to GitHub Copilot's AI models
- Context-aware code suggestions
- Integration with GitHub repositories
- Tool access through the MCP interface

## How is it configured in this repository?

In `mcp.json`:

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

## Requirements

1. **GitHub Copilot Subscription**: Active subscription (Individual, Business, or Enterprise)
2. **Authentication**: Valid GitHub token with Copilot access
   - Set via `gh auth login` (recommended)
   - Or set `GITHUB_TOKEN` environment variable

## Testing the Configuration

MCP servers are automatically loaded by compatible tools. To verify:

```bash
# Check GitHub authentication
gh auth status

# Check MCP configuration exists
cat mcp.json
```

## More Information

For detailed setup and troubleshooting, see [MCP_CONFIGURATION.md](./MCP_CONFIGURATION.md)
