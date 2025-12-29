'use client'
import { useEffect, useState } from 'react'

export default function MatchExplanation({ profileAName, profileALikes, profileBName, profileBLikes }: {
  profileAName: string, profileALikes: string[], profileBName: string, profileBLikes: string[]
}) {
  const [text, setText] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const prompt = [
        `You are a friendly match assistant.`,
        `Explain in 2-3 short paragraphs why ${profileAName} and ${profileBName} would be a good match based on these likes:`,
        `${profileAName}: ${profileALikes.join(', ')}`,
        `${profileBName}: ${profileBLikes.join(', ')}`,
        `Keep the tone positive and mention common interests.`
      ].join('\n\n')

      // Simple implementation without streaming for now
      // In a real implementation, you would call an API endpoint that handles the AI request
      setText('Match explanation will be generated via AI when properly configured with API endpoints.')
      
      // TODO: Implement streaming with proper AI SDK setup
      // This requires setting up an API route that handles the AI request
    })()

    return () => { cancelled = true }
  }, [profileAName, profileALikes, profileBName, profileBLikes])

  return (
    <div>
      <h3>Why this is a match</h3>
      <div>{text || 'Generating...'}</div>
    </div>
  )
}
