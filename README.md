# FUEGO-APP
fuego version 14

## Overview

FUEGO-APP is a Next.js application that uses Supabase for database management and OpenAI for AI-powered matching and embeddings. The app allows users to create profiles with their interests and find matches based on semantic similarity using vector embeddings.

## Prerequisites

- Node.js 18+ installed
- A Supabase project ([create one here](https://app.supabase.com))
- An OpenAI API key ([get one here](https://platform.openai.com/api-keys))

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

This application requires environment variables to be configured.

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your actual credentials:
   
   **Supabase Configuration:**
   - `SUPABASE_URL`: Your Supabase project URL (found in Project Settings > API)
   - `SUPABASE_KEY`: Your Supabase anon/public key (found in Project Settings > API)
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (found in Project Settings > API)
   - `DATABASE_URL`: Your Supabase database connection string (found in Project Settings > Database)
   
   **OpenAI Configuration:**
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `OPENAI_EMBEDDING_MODEL`: The embedding model to use (default: `text-embedding-3-small`)

**Important**: Never commit your `.env` file or expose API keys in the repository. The `.env` file is already included in `.gitignore`.

### 3. Database Setup

Run the SQL migrations to set up your Supabase database with the required tables, functions, and pgvector extension:

```bash
npm run migrate
```

This will execute the following migrations in order:
- `pgvector_setup.sql` - Installs the pgvector extension
- `migrate_jsonb_to_float8_array.sql` - Migrates embedding formats
- `create_cosine_and_rpc.sql` - Creates cosine similarity functions
- `pgvector_migration_and_rpc.sql` - Sets up vector operations
- `rls_and_consent.sql` - Configures Row Level Security policies

### 4. Verify Setup

Verify that your database is correctly configured:

```bash
npm run verify
```

Optionally, test with a specific profile ID:

```bash
npm run verify -- --profile-id <your-uuid>
```

## Running the Application

### Development Mode

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Mode

Build and start the application for production:

```bash
npm run build
npm start
```

## API Endpoints

The application provides the following API endpoints:

- **POST /api/save-profile** - Save a user profile with interests
- **POST /api/find-matches-cursor** - Find matches using cursor-based pagination
- **POST /api/find-matches-paginated** - Find matches with standard pagination
- **POST /api/secure-find-matches** - Find matches with authentication (requires service role)
2. Update the `.env` file with your actual API keys:
   - `AI_GATEWAY_API_KEY`: Your AI Gateway API key
   - `ANTHROPIC_API_KEY`: Your Anthropic Claude API key (get from https://console.anthropic.com/)

**Important**: Never commit your `.env` file or expose API keys in the repository. The `.env` file is already included in `.gitignore`.

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
- Row Level Security (RLS) policies are configured to protect user data
- See [README.secrets.md](./README.secrets.md) for detailed guidance on managing secrets

## Deployment

### Vercel Deployment

This application can be deployed to Vercel. For detailed instructions on setting up automated deployments with GitHub Actions, see:

📖 **[Vercel Deployment Guide](./docs/VERCEL_DEPLOYMENT.md)**

Key steps:
1. Create a Vercel token from your Vercel account
2. Store the token as a GitHub secret named `VERCEL_TOKEN`
3. Configure environment variables in your Vercel project
4. Set up GitHub Actions workflow for automated deployments

**Important**: Never commit Vercel tokens or other deployment secrets to the repository.

## Project Structure

```
FUEGO-APP/
├── components/          # React components
├── docs/               # Documentation
│   └── VERCEL_DEPLOYMENT.md  # Vercel deployment guide
├── lib/                # Utility libraries (Supabase client, embeddings)
├── pages/              # Next.js pages and API routes
│   └── api/           # API endpoints
├── scripts/           # Database migration and verification scripts
├── sql/               # SQL migration files
├── .env.example       # Environment variable template
├── README.md          # This file
├── README.secrets.md  # Guide for managing secrets
├── SECURITY.md        # Security policy
├── package.json       # Project dependencies
├── tsconfig.json      # TypeScript configuration
└── next.config.js     # Next.js configuration
```
