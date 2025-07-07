#!/bin/bash

# Setup script for AI Tooling Matrix project
# This script sets up git hooks and validates the development environment

echo "🚀 Setting up AI Tooling Matrix development environment..."

# Make git hooks executable
if [ -d ".githooks" ]; then
    chmod +x .githooks/*
    echo "✅ Made git hooks executable"
fi

# Set up git hooks directory
if [ -d ".git" ]; then
    git config core.hooksPath .githooks
    echo "✅ Configured git to use .githooks directory"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo "📝 Created .env file from .env.example"
    echo "🔧 Please edit .env and add your GEMINI_API_KEY"
else
    echo "✅ .env file already exists"
fi

# Check if wrangler is available
if command -v wrangler &> /dev/null; then
    echo "✅ Wrangler CLI is installed"
else
    echo "⚠️  Wrangler CLI not found. Install with: npm install -g wrangler"
fi

# Validate .env file has placeholder
if [ -f ".env" ] && grep -q "your_actual_gemini_api_key_here" .env; then
    echo "⚠️  Don't forget to replace the placeholder in .env with your actual API key"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Edit .env and add your GEMINI_API_KEY"
echo "2. Run 'npm run dev' to start local development"
echo "3. Visit the Security section in README.md for best practices"
echo ""
echo "🔒 Security reminder: Never commit real API keys to version control!"
