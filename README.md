# AI Software Engineering Tooling Decision Matrix

A responsive web application that helps developers choose the right AI software engineering tools based on their specific needs and requirements.

## Features

- Interactive decision matrix with comprehensive tool comparison
- AI-powered recommendation system using Cloudflare Workers AI
- Responsive design with dark theme
- Secure backend API implementation

## Deployment on Cloudflare Pages

### Prerequisites

1. A Cloudflare account
2. A GitHub repository (for CI/CD)

Note: No external AI API key needed - uses Cloudflare Workers AI automatically!

### Quick Start

1. **Fork this repository** or create a new one with these files

2. **Connect to Cloudflare Pages**:
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click "Create a project" → "Connect to Git"
   - Select your repository
   - Set build settings:
     - Build command: `echo "Static site"`
     - Build output directory: `/`

3. **Set Environment Variables** in Cloudflare Pages:
   - Go to your Pages project → Settings → Environment variables
   - **No manual setup needed!** Cloudflare Workers AI is automatically available
   - AI functionality works out-of-the-box with Cloudflare Pages + Functions

4. **Configure GitHub Secrets** (for CI/CD):
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add these repository secrets:
     - `CLOUDFLARE_API_TOKEN`: Create at [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
     - `CLOUDFLARE_ACCOUNT_ID`: Found in your Cloudflare dashboard sidebar

5. **Deploy**: Push to main branch and GitHub Actions will automatically deploy

### Manual Deployment (Alternative)

If you prefer not to use GitHub Actions:

1. Install Wrangler CLI: `npm install -g wrangler`
2. Login: `wrangler login`
3. Deploy: `wrangler pages deploy .`

### Local Development

1. **Clone the repository**:

   ```bash
   git clone https://github.com/znanfelt/se-tool-matrix.git
   cd se-tool-matrix
   ```

2. **Run the setup script**:

   ```bash
   ./setup.sh
   ```

   This will:
   - Set up git hooks for security checks
   - Create `.env` from template
   - Validate your development environment

3. **No API key setup needed**:
   - Cloudflare Workers AI is automatically available
   - No external API keys required

4. **Start local development server**:

   ```bash
   npm run dev
   # or: npx wrangler pages dev .
   ```

### Project Structure

```text
├── index.html                    # Main application file
├── functions/
│   └── api/
│       └── recommendations.js    # Cloudflare Function for AI API calls
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Actions CI/CD
├── .githooks/
│   └── pre-commit              # Git hook to prevent secret commits
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules (includes security patterns)
├── .nvmrc                      # Node.js version specification
├── wrangler.toml               # Cloudflare Workers configuration
├── package.json                # Node.js configuration
├── setup.sh                    # Development environment setup script
├── SECURITY.md                 # Security policy and best practices
├── LICENSE                     # MIT License
└── README.md                   # This file
```

## Security & Best Practices

This project implements comprehensive security measures for production use:

### API Security

- ✅ **Strict CORS Policy**: Only authorized origins can access the API
- ✅ **Request Validation**: Input validation, sanitization, and size limits
- ✅ **Rate Limiting**: Protected by Cloudflare's built-in protections
- ✅ **Timeout Protection**: Prevents hanging requests and DoS attacks
- ✅ **Error Handling**: Secure error responses without information disclosure

### Security Headers

- ✅ **X-Content-Type-Options**: Prevents MIME type sniffing attacks
- ✅ **X-Frame-Options**: Prevents clickjacking attacks  
- ✅ **X-XSS-Protection**: Browser XSS protection enabled
- ✅ **Referrer-Policy**: Controls referrer information leakage
- ✅ **Cache-Control**: Prevents sensitive data caching

### Infrastructure Security

- ✅ **No secrets in code**: Zero API keys or credentials in source
- ✅ **Secure .gitignore**: Prevents accidental secret commits  
- ✅ **Git hooks**: Pre-commit checks prevent secret commits
- ✅ **Server-side processing**: All AI calls made server-side only
- ✅ **CI/CD security**: GitHub Actions with proper secret management
- ✅ **Cloudflare Protection**: DDoS protection, WAF, and bot management

### Development Security

- ✅ **Security policy**: Clear guidelines in `SECURITY.md`
- ✅ **Setup automation**: `setup.sh` configures secure development environment
- ✅ **Dependency scanning**: Automated vulnerability checks
- ✅ **HTTPS enforcement**: All traffic encrypted in transit

### Important Security Notes

- **Never commit `.env` files** - they're git-ignored for safety
- **Git hooks** will block commits containing potential secrets
- **API keys go in Cloudflare Pages dashboard**, not GitHub secrets
- **GitHub secrets** are only for Cloudflare API tokens (for deployment)
- **Environment variables** are separate between preview/production environments

### API Endpoint

- `POST /api/recommendations` - Get AI-powered tool recommendations

### Technologies Used

- HTML5, CSS3, JavaScript (ES6+)
- Tailwind CSS for styling
- Cloudflare Workers AI for AI recommendations
- Cloudflare Pages + Functions for hosting and backend
