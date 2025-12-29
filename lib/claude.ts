/**
 * Claude API Client
 * 
 * This module provides a client for interacting with Anthropic's Claude API.
 * Requires ANTHROPIC_API_KEY environment variable to be set.
 */

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ClaudeResponse {
  id: string
  type: string
  role: string
  content: Array<{
    type: string
    text: string
  }>
  model: string
  stop_reason: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
}

/**
 * Send a message to Claude and get a response
 * 
 * @param messages - Array of messages in the conversation
 * @param model - Claude model to use (default: claude-3-5-sonnet-20241022)
 * @param maxTokens - Maximum tokens in the response (default: 1024)
 * @returns The Claude API response
 */
export async function sendClaudeMessage(
  messages: ClaudeMessage[],
  model: string = 'claude-3-5-sonnet-20241022',
  maxTokens: number = 1024
): Promise<ClaudeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set')
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages
    })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API request failed: ${err}`)
  }

  return await res.json()
}

/**
 * Get a simple text completion from Claude
 * 
 * @param prompt - The user's prompt
 * @param model - Claude model to use (default: claude-3-5-sonnet-20241022)
 * @param maxTokens - Maximum tokens in the response (default: 1024)
 * @returns The text response from Claude
 */
export async function getClaudeCompletion(
  prompt: string,
  model: string = 'claude-3-5-sonnet-20241022',
  maxTokens: number = 1024
): Promise<string> {
  const response = await sendClaudeMessage(
    [{ role: 'user', content: prompt }],
    model,
    maxTokens
  )

  return response.content[0].text
}
