'use client'
import { useEffect, useState } from 'react'
import { streamText } from 'ai'

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

      const stream = await streamText({
        model: process.env.NEXT_PUBLIC_GPT_MODEL || 'openai/gpt-5',
        prompt
      })

      try {
        for await (const chunk of stream) {
          if (cancelled) break
          setText((t) => t + chunk)
        }
      } catch (e) {
        console.error(e)
      }
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
