import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

/**
 * API endpoint to retrieve MCP (Model Context Protocol) configuration
 * 
 * GET /api/mcp-config
 * 
 * Returns: The MCP server configuration from mcp.json
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Read the mcp.json file
    const mcpConfigPath = path.join(process.cwd(), 'mcp.json')
    
    let mcpConfigContent: string
    try {
      mcpConfigContent = fs.readFileSync(mcpConfigPath, 'utf-8')
    } catch (readErr: unknown) {
      if (readErr instanceof Error && 'code' in readErr && readErr.code === 'ENOENT') {
        return res.status(404).json({ error: 'MCP configuration file not found' })
      }
      throw readErr
    }

    let mcpConfig: unknown
    try {
      mcpConfig = JSON.parse(mcpConfigContent)
    } catch (parseErr: unknown) {
      console.error('Invalid JSON in mcp.json:', parseErr)
      return res.status(500).json({ error: 'Invalid MCP configuration format' })
    }

    res.json({
      config: mcpConfig,
      configPath: 'mcp.json',
      description: 'Model Context Protocol (MCP) server configuration for GitHub Copilot',
      endpoint: 'api.githubcopilot.com/mcp'
    })
  } catch (err: unknown) {
    console.error('MCP config error:', err)
    // Return a generic error message without exposing internal details
    res.status(500).json({ error: 'Failed to retrieve MCP configuration' })
  }
}
