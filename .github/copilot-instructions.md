# GitHub Copilot Instructions for FUEGO-APP

This document provides guidance for GitHub Copilot when working on the FUEGO-APP repository.

## Project Overview

FUEGO-APP (version 14) is a matching application that uses AI and vector similarity to connect users based on their interests. The application integrates with Anthropic's Claude API for AI-powered features and uses Supabase with PostgreSQL (pgvector extension) for database operations.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Next.js (API routes in `pages/api/`)
- **Database**: PostgreSQL with pgvector extension via Supabase
- **AI Integration**: Anthropic Claude API (claude-3-5-sonnet-20241022)
- **Frontend**: React with TypeScript (TSX components)
- **Package Manager**: npm

## Code Style and Conventions

### TypeScript

- Use TypeScript for all new code
- Define proper interfaces for API requests/responses
- Use explicit type annotations for function parameters and return types
- Prefer `const` over `let` when variables don't change
- Use template literals for string concatenation

### API Endpoints

- Follow Next.js API route conventions (`pages/api/`)
- Always validate HTTP methods (check `req.method`)
- Validate request body structure and types before processing
- Return appropriate HTTP status codes:
  - `200` for successful GET/POST operations
  - `400` for invalid request body or parameters
  - `405` for method not allowed
  - `500` for server errors
- Use try-catch blocks and return error messages in JSON format
- Log errors with `console.error()` before returning error responses

Example pattern:
```typescript
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' })
    }
    
    // Validate required fields
    const { field } = req.body
    if (!field || typeof field !== 'string') {
      return res.status(400).json({ error: 'field (string) is required' })
    }

    // Process request
    const result = await processRequest(field)
    res.json({ result })
  } catch (err: any) {
    console.error('API error:', err)
    res.status(500).json({ error: err.message || String(err) })
  }
}
```

### React Components

- Use functional components with hooks
- Mark client-side components with `'use client'` directive when needed
- Clean up effects with return cleanup functions
- Use TypeScript for component props with explicit interfaces
- Handle loading and error states appropriately

### Database and SQL

- SQL migrations are located in the `sql/` directory
- Use the `scripts/run-sql.js` script to run migrations
- Migrations should be idempotent (safe to run multiple times)
- Use `DO $$ ... END $$` blocks for conditional DDL operations
- Always enable Row Level Security (RLS) on tables with user data
- Create appropriate RLS policies to protect user privacy
- Use pgvector's `vector` type for embedding columns
- Prefer float8[] arrays over JSONB for vector data when using pgvector

### Environment Variables

- All sensitive data (API keys, secrets) must be stored in environment variables
- Never hardcode API keys or secrets in the code
- Use `process.env.VARIABLE_NAME` to access environment variables
- Always check if required environment variables are set before using them
- Throw descriptive errors when required variables are missing

## Security Requirements

### Critical Security Rules

1. **Never commit API keys or secrets to the repository**
   - All secrets must be in `.env` files (which are gitignored)
   - Use `.env.example` to document required environment variables

2. **Validate all user input**
   - Check types and formats of all incoming data
   - Sanitize inputs before using in database queries
   - Validate request bodies in API endpoints

3. **Use Row Level Security (RLS)**
   - Enable RLS on all tables containing user data
   - Create policies that respect user consent and privacy
   - Only allow users to access data they're authorized to see

4. **Respect user consent**
   - Check `consent_to_matching` flag before showing user profiles
   - Allow users to control their own data
   - Implement proper authorization checks

5. **Handle errors securely**
   - Don't expose sensitive information in error messages
   - Log detailed errors server-side, return generic messages to clients
   - Use appropriate HTTP status codes

### API Key Management

The application uses the following environment variables:

**AI Services:**
- `ANTHROPIC_API_KEY`: For Claude API integration (required for Claude features in `lib/claude.ts`)
- `OPENAI_API_KEY`: For OpenAI API integration (required for embeddings in `lib/embeddings.ts` - not in `.env.example`, add if needed)
- `AI_GATEWAY_API_KEY`: Alternative to `OPENAI_API_KEY` for match explanations (used in `pages/api/match-explanation.ts`)
- `GPT_MODEL`: OpenAI model to use (optional, default: gpt-4)
- `OPENAI_EMBEDDING_MODEL`: Model for generating embeddings (optional, default: text-embedding-3-small)

**Database:**
- `SUPABASE_URL`: Supabase project URL (required - not in `.env.example`, add if needed)
- `SUPABASE_KEY`: Supabase anon/public key (used in `lib/supabase.ts` - not in `.env.example`, add if needed)
- `SUPABASE_PUBLISHABLE_KEY`: Alternative name for Supabase public key (used in `config.js` - not in `.env.example`, add if needed)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for admin operations (required for `secure-find-matches` endpoint - not in `.env.example`, add if needed)
- `DATABASE_URL`: Direct PostgreSQL connection string (preferred for migrations via `npm run migrate` - not in `.env.example`, add if needed)
- `SUPABASE_DB_URL`: Alternative to `DATABASE_URL` for migrations (fallback option)

**Note**: The `.env.example` file only includes `AI_GATEWAY_API_KEY` and `ANTHROPIC_API_KEY`. Add other environment variables to your `.env` file as needed for the features you're using.

Always verify required environment variables are set before using them and throw clear errors if missing.

## AI Integration

### Claude API Integration

- Default model: `claude-3-5-sonnet-20241022`
- Use the `lib/claude.ts` module for all Claude API interactions
- Two main functions:
  - `sendClaudeMessage()`: For multi-turn conversations
  - `getClaudeCompletion()`: For simple text completions
- Default max_tokens: 1024 (adjust based on use case)
- Always handle API errors gracefully
- Check for empty responses and handle appropriately

### OpenAI API Integration

- Used in `pages/api/match-explanation.ts` for streaming match explanations
- Used in `lib/embeddings.ts` for generating vector embeddings
- Match explanations support both `OPENAI_API_KEY` and `AI_GATEWAY_API_KEY` environment variables
- Embeddings require `OPENAI_API_KEY` specifically
- Default model from `GPT_MODEL` env var (default: gpt-4) for chat completions
- Default embedding model from `OPENAI_EMBEDDING_MODEL` (default: text-embedding-3-small)
- Implements Server-Sent Events (SSE) for streaming in match-explanation endpoint

### Choosing Between APIs

The application supports both OpenAI and Claude APIs:
- Use Claude for general AI completions and conversations
- Use OpenAI for embeddings and streaming match explanations
- Check for appropriate API keys before making requests
- Handle missing API keys with clear error messages

## Testing and Build

- Run SQL migrations: `npm run migrate`
- Verify Supabase setup: `npm run verify`
- Ensure all TypeScript files compile without errors
- Test API endpoints thoroughly
- Validate environment variables are properly configured

## Documentation

- Document all public functions with JSDoc comments
- Include usage examples in comments for complex features
- Keep README.md updated with setup instructions
- Document API endpoints with request/response examples
- Update SECURITY.md when adding new security-sensitive features

## Common Patterns

### Streaming Responses

For streaming AI responses (implemented in `pages/api/match-explanation.ts`):
- Use Server-Sent Events (SSE) format with OpenAI streaming API
- Set appropriate headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`
- Send data as `data: {json}\n\n`
- Handle cleanup with cancelled flags in useEffect (client-side)
- Decode stream chunks with TextDecoder
- Handle partial lines properly (keep buffer of incomplete data)
- The `MatchExplanation.tsx` component consumes this streaming API

### Database Queries with Supabase

- Import from `lib/supabase.ts`
- Use the Supabase client for all database operations
- Apply RLS policies consistently
- Use pgvector for similarity searches
- Handle null/undefined results appropriately

## What NOT to Do

- ❌ Don't commit `.env` files or any files containing secrets
- ❌ Don't disable RLS without proper justification
- ❌ Don't expose internal error details to API clients
- ❌ Don't use `any` type unless absolutely necessary
- ❌ Don't skip input validation on API endpoints
- ❌ Don't hardcode configuration values that should be environment variables
- ❌ Don't create unsafe SQL queries vulnerable to injection
- ❌ Don't bypass user consent mechanisms

## Project Structure

```
/
├── .github/              # GitHub configuration
├── components/           # React components
├── lib/                 # Shared libraries and utilities
│   ├── claude.ts        # Claude API client
│   ├── supabase.ts      # Supabase client
│   └── embeddings.ts    # Vector embedding utilities
├── pages/
│   └── api/             # Next.js API routes
├── scripts/             # Database migration scripts
├── sql/                 # SQL migration files
├── .env.example         # Environment variable template
├── .gitignore          # Git ignore rules
├── package.json        # Node.js dependencies
└── README.md           # Project documentation
```

## Additional Notes

- This is version 14 of the FUEGO application
- The application focuses on AI-powered matching based on user interests
- Privacy and user consent are core values of the application
- Follow existing patterns when adding new features
- Maintain consistency with the codebase style
