# FUEGO-APP
fuego version 14

## Setup

### Environment Variables

This application requires environment variables to be configured. 

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your actual API keys:
   - `AI_GATEWAY_API_KEY`: Your AI Gateway API key
   - `ANTHROPIC_API_KEY`: Your Anthropic Claude API key (get from https://console.anthropic.com/)

**Important**: Never commit your `.env` file or expose API keys in the repository. The `.env` file is already included in `.gitignore`.

## Security

- All API keys and secrets must be stored in environment variables
- Use the `.env.example` file as a template
- Never commit actual API keys to the repository
- If an API key is accidentally exposed, revoke it immediately and generate a new one
