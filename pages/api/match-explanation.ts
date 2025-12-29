import type { NextApiRequest, NextApiResponse } from 'next'

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

    const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY
    const model = process.env.GPT_MODEL || 'gpt-4'

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' })
    }

    // Call OpenAI API with streaming
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: true
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', errorText)
      return res.status(500).json({ error: 'Failed to generate explanation' })
    }

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      return res.status(500).json({ error: 'No response stream' })
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`)
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    res.end()
  } catch (err: any) {
    console.error('Error in match-explanation:', err)
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message || String(err) })
    }
  }
}
