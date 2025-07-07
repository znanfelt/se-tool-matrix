# AI Software Engineering Tooling Decision Matrix

A responsive web application that helps developers choose the right AI software engineering tools based on their specific needs and requirements.

## Features

- Interactive decision matrix with comprehensive tool comparison
- AI-powered recommendation system using Google Gemini
- Responsive design with dark theme
- Secure backend API implementation

## Deployment on Cloudflare Pages

### Prerequisites

1. A Cloudflare account
2. A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
3. A GitHub repository (for CI/CD)

### Quick Start

1. **Fork this repository** or create a new one with these files

2. **Connect to Cloudflare Pages**:
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click "Create a project" → "Connect to Git"
   - Select your repository
   - Set build settings:
     - Build command: `echo "Static site, no build needed"`
     - Build output directory: `/`

3. **Set Environment Variables** in Cloudflare Pages:
   - Go to your Pages project → Settings → Environment variables
   - Add: `GEMINI_API_KEY` with your actual Google Gemini API key
   - **Important**: Set this for both "Production" and "Preview" environments

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

3. **Add your API key**:
   - Edit `.env` and replace `your_actual_gemini_api_key_here` with your real Gemini API key
   - Get one at: <https://makersuite.google.com/app/apikey>

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
├── package.json                # Node.js configuration
├── setup.sh                    # Development environment setup script
├── SECURITY.md                 # Security policy and best practices
├── LICENSE                     # MIT License
└── README.md                   # This file
```

## Security & Best Practices

This project follows security best practices for public repositories:

- ✅ **No secrets in code**: All API keys are environment variables
- ✅ **Secure .gitignore**: Prevents accidental secret commits  
- ✅ **Git hooks**: Pre-commit checks prevent secret commits
- ✅ **Server-side API calls**: Cloudflare Functions protect API keys
- ✅ **CI/CD security**: GitHub Actions with proper secret management
- ✅ **Security policy**: Clear guidelines in `SECURITY.md`
- ✅ **Setup automation**: `setup.sh` configures secure development environment

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
- Google Gemini API for AI recommendations
- Cloudflare Pages + Functions for hosting and backend
