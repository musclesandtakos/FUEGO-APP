import type { NextApiRequest, NextApiResponse } from 'next'
import { getClaudeCompletion } from '../../lib/claude'

/**
 * Example API endpoint demonstrating Claude integration
 * 
 * POST /api/claude-chat
 * Body: { prompt: string }
 * 
 * Returns: { response: string }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { prompt } = req.body

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt (string) is required' })
    }

    // Get completion from Claude
    const response = await getClaudeCompletion(prompt)

    res.json({ response })
  } catch (err: any) {
    console.error('Claude API error:', err)
    res.status(500).json({ error: err.message || String(err) })
  }
}
