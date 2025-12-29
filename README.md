# FUEGO-APP
fuego version 14

## Setup

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables

This application uses environment variables to store sensitive configuration data, including API keys.

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and replace the placeholder values with your actual keys:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_PUBLISHABLE_KEY`: Your Supabase publishable key

**Important**: Never commit your `.env` file to version control. It is already included in `.gitignore`.

### Security Note

API keys and other sensitive credentials should always be stored in environment variables and never hardcoded in the source code or committed to the repository.
