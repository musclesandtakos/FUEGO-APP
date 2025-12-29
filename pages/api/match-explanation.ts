import type { NextApiRequest, NextApiResponse } from 'next'
import { streamText } from 'ai'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { profileAName, profileALikes, profileBName, profileBLikes } = req.body

    if (!profileAName || !profileBName || !Array.isArray(profileALikes) || !Array.isArray(profileBLikes)) {
      return res.status(400).json({ error: 'Invalid request parameters' })
    }

    const prompt = [
      `You are a friendly match assistant.`,
      `Explain in 2-3 short paragraphs why ${profileAName} and ${profileBName} would be a good match based on these likes:`,
      `${profileAName}: ${profileALikes.join(', ')}`,
      `${profileBName}: ${profileBLikes.join(', ')}`,
      `Keep the tone positive and mention common interests.`
    ].join('\n\n')

    const model = process.env.GPT_MODEL || 'openai/gpt-4'

    const stream = await streamText({
      model,
      prompt
    })

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`)
    }

    res.end()
  } catch (err: any) {
    console.error('Error in match-explanation:', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
}
