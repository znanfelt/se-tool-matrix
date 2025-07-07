# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please send an email to <security@yourproject.com> or create a private security advisory on GitHub.

**Please do not create public GitHub issues for security vulnerabilities.**

## Security Measures Implemented

This project implements comprehensive security measures:

### API Security

- ✅ **Strict CORS Policy**: Only allows requests from authorized origins
  - Production: `https://se-tool-matrix.pages.dev`
  - Preview: `https://se-tool-matrix-preview.pages.dev`
  - Development: `localhost:8788`, `localhost:3000`
- ✅ **Request Size Limits**: Maximum 1MB request size to prevent DoS attacks
- ✅ **Input Validation**: All user inputs are validated for type, length, and structure
- ✅ **Input Sanitization**: Removes potentially dangerous characters from user input
- ✅ **AI Response Validation**: Validates and sanitizes AI model responses
- ✅ **Timeout Protection**: 30-second timeout for AI requests to prevent hanging

### Security Headers

The API implements comprehensive security headers:

- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking attacks
- `X-XSS-Protection: 1; mode=block` - Enables XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information
- `Cache-Control: no-cache, no-store, must-revalidate` - Prevents sensitive data caching

### Backend Security

- ✅ **Server-side Processing**: All AI API calls made server-side only
- ✅ **No API Keys Required**: Uses Cloudflare Workers AI with built-in authentication
- ✅ **Error Handling**: Generic error messages to prevent information disclosure
- ✅ **Rate Limiting**: Protected by Cloudflare's built-in rate limiting
- ✅ **Secure JSON Parsing**: Protected against JSON injection attacks

### Frontend Security

- ✅ **Content Security Policy**: Implemented via meta tags
- ✅ **Input Validation**: Client-side validation as first line of defense
- ✅ **Error Handling**: No sensitive information exposed to users

### Infrastructure Security

- ✅ **Cloudflare Protection**: DDoS protection, WAF, and bot management
- ✅ **HTTPS Only**: All traffic encrypted in transit
- ✅ **No Secrets in Code**: Zero API keys or secrets in source code
- ✅ **Secure CI/CD**: GitHub Actions with proper secret management

## What NOT to commit

Never commit files containing:

- API keys or passwords
- Private certificates
- Database connection strings
- Any `.env` files (except `.env.example`)
- Personal access tokens
- Session tokens or cookies
- Private keys or certificates

## Security Testing

Regular security testing includes:

- Dependency vulnerability scans
- CORS policy validation
- Input validation testing
- Error handling verification
- Rate limiting confirmation

## Incident Response

In case of a security incident:

1. **Immediate**: Report via <security@yourproject.com>
2. **Assessment**: We'll evaluate the impact within 24 hours
3. **Response**: Security patches deployed within 48 hours for critical issues
4. **Communication**: Public disclosure after fix is deployed
