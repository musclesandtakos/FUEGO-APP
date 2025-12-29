# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it by creating a private security advisory on GitHub or by contacting the repository maintainers directly.

## Secure API Key Management

### Best Practices

1. **Never commit API keys or secrets to the repository**
   - Use environment variables stored in `.env` files
   - Ensure `.env` files are listed in `.gitignore`

2. **Use .env.example as a template**
   - The `.env.example` file shows which environment variables are needed
   - It contains placeholder values, not actual secrets

3. **Rotate compromised keys immediately**
   - If an API key is accidentally exposed, revoke it immediately
   - Generate a new key and update your local `.env` file
   - Never attempt to "fix" the exposure by removing it from git history alone

4. **Environment-specific configurations**
   - Use different API keys for development, staging, and production
   - Never use production keys in development environments

### What to do if you accidentally commit an API key

1. **Revoke the exposed key immediately** through your API provider
2. **Generate a new API key**
3. **Update your local `.env` file** with the new key
4. **Report the incident** if the key had access to sensitive resources
5. **Review access logs** to check for unauthorized usage

## Supported Environment Variables

- `AI_GATEWAY_API_KEY`: Your AI Gateway API key (required)
  - This key should be obtained from your AI Gateway provider
  - Format: `vck_` followed by alphanumeric characters
  - Keep this key confidential and never share it publicly
