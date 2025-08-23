#!/bin/bash

# Comprehensive Error Fix Script for JackpotWLD
# This script addresses common build and runtime issues

echo "🔧 Starting comprehensive error fix..."

# 1. Clean and reinstall dependencies
echo "📦 Cleaning and reinstalling dependencies..."
rm -rf node_modules package-lock.json .next
npm install

# 2. Fix potential TypeScript issues
echo "🔍 Running TypeScript check..."
npm run type-check

# 3. Fix ESLint issues automatically
echo "🧹 Fixing ESLint issues..."
npm run lint:fix

# 4. Check for missing environment variables
echo "🌍 Checking environment configuration..."
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local file missing - using defaults"
    cp .env.example .env.local 2>/dev/null || echo "📝 Please create .env.local based on .env.example"
fi

# 5. Run tests to ensure core functionality
echo "🧪 Running tests..."
npm run test

# 6. Try building the application
echo "🏗️  Building application..."
npm run build

echo "✅ Error fix script completed!"
echo "🚀 Try running 'npm run dev' to start the development server"