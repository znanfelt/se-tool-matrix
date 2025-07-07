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
    echo "ℹ️  No API key setup needed - Cloudflare AI works automatically!"
else
    echo "✅ .env file already exists"
fi

# Check if wrangler is available
if command -v wrangler &> /dev/null; then
    echo "✅ Wrangler CLI is installed"
else
    echo "⚠️  Wrangler CLI not found. Install with: npm install -g wrangler"
fi

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Run 'npm run dev' to start local development"
echo "2. Visit the Security section in README.md for best practices"
echo "3. Deploy to Cloudflare Pages for AI functionality"
echo ""
echo "🔒 Security reminder: Cloudflare AI is automatically available - no external API keys needed!"
