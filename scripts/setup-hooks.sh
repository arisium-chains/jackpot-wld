#!/bin/bash

# Setup script for development environment
# This script initializes pre-commit hooks and validates the build pipeline

set -e

echo "🚀 Setting up development environment..."

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci
fi

# Install husky hooks
echo "🪝 Setting up pre-commit hooks..."
npx husky install

# Create pre-commit hook
echo "📝 Creating pre-commit hook..."
npx husky add .husky/pre-commit "npm run pre-commit"

# Make scripts executable
chmod +x scripts/build-validation.js
chmod +x scripts/setup-hooks.sh

echo "✅ Development environment setup complete!"
echo ""
echo "Available commands:"
echo "  npm run validate        - Run type check, lint, and tests"
echo "  npm run build:validate - Full build validation pipeline"
echo "  npm run build:check    - Quick build check"
echo "  npm run pre-commit     - Run pre-commit validation"
echo ""
echo "Pre-commit hooks are now active. Code will be validated before each commit."