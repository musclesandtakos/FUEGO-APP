# Model Context Protocol (MCP) Configuration

## Overview

This repository includes MCP (Model Context Protocol) server configuration for GitHub Copilot and other AI tools. The configuration is stored in `mcp.json` and defines MCP servers that provide additional context and capabilities.

## What is MCP?

The Model Context Protocol (MCP) is a standardized protocol that allows AI tools like GitHub Copilot to communicate with external servers to access additional context, tools, and capabilities. MCP servers can provide:

- Additional code context from external sources
- Custom tools and functions
- Domain-specific knowledge and data
- Integration with external services

## Current Configuration

The repository is configured with the following MCP server:

### ai-elements

- **Type**: Remote MCP server via mcp-remote
- **Endpoint**: https://registry.ai-sdk.dev/api/mcp
- **Purpose**: Provides AI SDK elements and tools

## Viewing Your Configuration

### Via API Endpoint

You can query the MCP configuration using the API endpoint:

```bash
curl http://localhost:3000/api/mcp-config
```

Response:
```json
{
  "config": {
    "mcpServers": {
      "ai-elements": {
        "command": "npx",
        "args": ["-y", "mcp-remote", "https://registry.ai-sdk.dev/api/mcp"]
      }
    }
  },
  "configPath": "mcp.json",
  "description": "Model Context Protocol (MCP) server configuration for GitHub Copilot",
  "endpoint": "api.githubcopilot.com/mcp"
}
```

### Via File

You can also directly view the configuration file:

```bash
cat mcp.json
```

## GitHub Copilot Integration

GitHub Copilot can use MCP servers configured in `mcp.json` to enhance its capabilities. The endpoint `api.githubcopilot.com/mcp` refers to the GitHub Copilot MCP integration system that reads this configuration.

### How It Works

1. GitHub Copilot reads the `mcp.json` file in your repository
2. It connects to the configured MCP servers
3. The MCP servers provide additional context and tools
4. GitHub Copilot uses this enhanced context to provide better suggestions

## Adding More MCP Servers

To add additional MCP servers, edit `mcp.json`:

```json
{
  "mcpServers": {
    "ai-elements": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://registry.ai-sdk.dev/api/mcp"]
    },
    "your-custom-server": {
      "command": "node",
      "args": ["path/to/your/mcp-server.js"]
    }
  }
}
```

## Common MCP Server Types

### Remote MCP Servers

Uses `mcp-remote` to connect to a remote MCP endpoint:

```json
{
  "command": "npx",
  "args": ["-y", "mcp-remote", "https://your-mcp-server.com/api/mcp"]
}
```

### Local MCP Servers

Runs a local MCP server script:

```json
{
  "command": "node",
  "args": ["./your-mcp-server.js"]
}
```

### NPM Package MCP Servers

Uses an npm package as an MCP server:

```json
{
  "command": "npx",
  "args": ["-y", "@your-org/mcp-server"]
}
```

## Security Considerations

- Only configure trusted MCP servers
- Review the code of local MCP servers before adding them
- Be cautious with remote MCP endpoints from unknown sources
- MCP servers have access to repository context

## References

- [Model Context Protocol Specification](https://spec.modelcontextprotocol.io/)
- [GitHub Copilot MCP Documentation](https://docs.github.com/en/copilot)
- [AI SDK Registry](https://registry.ai-sdk.dev/)

## Support

If you have questions about the MCP configuration:

1. Check the `mcp.json` file for current configuration
2. Use the `/api/mcp-config` endpoint to view configuration programmatically
3. Refer to the MCP specification documentation
4. Review GitHub Copilot documentation for integration details
