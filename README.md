# FUEGO-APP
fuego version 14

## Setup

### Environment variables

This project uses environment variables for database connections, API keys, and other secrets.

To get started locally:

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and replace the `REPLACE_WITH_*` placeholders with your real credentials (for example, your database password or Supabase keys).

3. Keep `.env.local` out of version control — it should never be committed. The repository provides `.env.example` with placeholders so contributors know what keys are required.

Notes:
- For production and CI, add environment variables using your host's secret management (Vercel, Netlify, GitHub Actions Secrets, etc.).
- If you use a Postgres database with Prisma, set `DATABASE_URL` in `.env.local` before running migrations.

## Features

### Claude API Integration

This application includes integration with Anthropic's Claude API. You can use it to:

- Send messages to Claude and get AI-powered responses
- Use Claude for text completion tasks
- Build conversational AI features

**Example API Usage:**

```typescript
// Using the Claude client library
import { getClaudeCompletion } from './lib/claude'

const response = await getClaudeCompletion('What is the meaning of life?')
console.log(response)
```

**Example HTTP Request:**

```bash
curl -X POST http://localhost:3000/api/claude-chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is the meaning of life?"}'
```

See `pages/api/claude-chat.ts` for a complete example of how to create a Claude-powered API endpoint.

## Security

- All API keys and secrets must be stored in environment variables
- Use the `.env.example` file as a template
- Never commit actual API keys to the repository
- If an API key is accidentally exposed, revoke it immediately and generate a new one
