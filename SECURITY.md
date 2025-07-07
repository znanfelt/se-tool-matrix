# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please send an email to [your-email@domain.com].

**Please do not create public GitHub issues for security vulnerabilities.**

## Security Best Practices

This project follows these security practices:

### API Key Management

- ✅ API keys are never committed to version control
- ✅ Environment variables are used for sensitive data
- ✅ `.env.example` provides templates without real keys
- ✅ Production secrets are managed via Cloudflare Pages dashboard

### Backend Security

- ✅ All AI API calls are made server-side
- ✅ Input validation and sanitization
- ✅ Error handling without exposing sensitive info
- ✅ CORS headers properly configured

### CI/CD Security

- ✅ Secrets are stored in GitHub repository secrets
- ✅ No secrets in workflow files
- ✅ Principle of least privilege for tokens

## What NOT to commit

Never commit files containing:

- API keys or passwords
- Private certificates
- Database connection strings
- Any `.env` files (except `.env.example`)
- Personal access tokens

## Cloudflare Setup

1. Cloudflare Workers AI is automatically available with Cloudflare Pages + Functions
2. No additional environment variables or API keys needed
3. AI functionality works out-of-the-box with your Cloudflare account
