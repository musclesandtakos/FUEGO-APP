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
    
    if (!fs.existsSync(mcpConfigPath)) {
      return res.status(404).json({ error: 'MCP configuration file not found' })
    }

    const mcpConfigContent = fs.readFileSync(mcpConfigPath, 'utf-8')
    const mcpConfig = JSON.parse(mcpConfigContent)

    res.json({
      config: mcpConfig,
      configPath: 'mcp.json',
      description: 'Model Context Protocol (MCP) server configuration for GitHub Copilot',
      endpoint: 'api.githubcopilot.com/mcp'
    })
  } catch (err: any) {
    console.error('MCP config error:', err)
    res.status(500).json({ error: err.message || String(err) })
  }
}
