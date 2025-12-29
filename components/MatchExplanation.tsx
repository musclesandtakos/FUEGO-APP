'use client'
import { useEffect, useState } from 'react'

export default function MatchExplanation({ profileAName, profileALikes, profileBName, profileBLikes }: {
  profileAName: string, profileALikes: string[], profileBName: string, profileBLikes: string[]
}) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch('/api/match-explanation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            profileAName,
            profileALikes,
            profileBName,
            profileBLikes
          })
        })

        if (!response.ok) {
          throw new Error('Failed to fetch match explanation')
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error('No response body')
        }

        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done || cancelled) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.content) {
                  setText((t) => t + data.content)
                }
              } catch (e) {
                // Skip malformed JSON
                console.warn('Failed to parse SSE data:', line)
              }
            }
          }
        }
      } catch (e) {
        console.error(e)
        setError('Error generating explanation')
      }
    })()

    return () => { cancelled = true }
  }, [profileAName, profileALikes, profileBName, profileBLikes])

  return (
    <div>
      <h3>Why this is a match</h3>
      <div>{error || text || 'Generating...'}</div>
    </div>
  )
}
