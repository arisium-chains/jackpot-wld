# Build Process Documentation

This document outlines the comprehensive build validation pipeline implemented for the Worldcoin PoolTogether MiniApp, designed to mirror Vercel's deployment standards.

## Overview

The build process includes multiple validation stages to ensure code quality, security, and functionality before deployment:

1. **Code Validation** - TypeScript, ESLint, and unit tests
2. **Build Verification** - Next.js compilation and output validation
3. **Security Scanning** - Dependency auditing
4. **Pre-commit Hooks** - Automated validation before commits

## Quick Start

```bash
# Setup development environment with pre-commit hooks
./scripts/setup-hooks.sh

# Run full build validation (recommended before pushing)
npm run build:validate

# Quick validation (type check, lint, tests)
npm run validate
```

## Available Scripts

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run validate` - Run type check, lint, and tests
- `npm run pre-commit` - Pre-commit validation hook

### Building
- `npm run build` - Standard Next.js build
- `npm run build:check` - Sequential validation then build
- `npm run build:validate` - Comprehensive build validation pipeline

### Code Quality
- `npm run type-check` - TypeScript type checking
- `npm run lint` - ESLint validation
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run test` - Run unit tests
- `npm run test:coverage` - Test coverage report

### Smart Contracts
- `npm run compile` - Compile Solidity contracts
- `npm run test:contracts` - Run contract tests
- `npm run test:contracts:coverage` - Contract test coverage

## Build Validation Pipeline

The `npm run build:validate` command runs a comprehensive validation pipeline:

### 1. Environment Check
- Verifies Node.js version
- Ensures dependencies are installed
- Validates project structure

### 2. Code Validation
- **TypeScript**: `tsc --noEmit` for type checking
- **ESLint**: Code style and quality validation
- **Jest**: Unit test execution

### 3. Build Process
- Cleans previous build artifacts
- Compiles Next.js application
- Verifies build output structure
- Analyzes bundle size

### 4. Security Checks
- `npm audit` for dependency vulnerabilities
- Optional Snyk integration (in CI)

### 5. Reporting
- Build duration and statistics
- Error and warning summary
- Exit codes for CI/CD integration

## Pre-commit Hooks

Automated validation runs before each commit:

```bash
# Automatically runs on git commit
- ESLint with auto-fix
- TypeScript type checking
- Related unit tests
```

## CI/CD Integration

### GitHub Actions
The `.github/workflows/web.yml` workflow includes:

1. **Lint and Type Check** - Code quality validation
2. **Build** - Application compilation with full validation
3. **Security Scan** - Dependency and code security
4. **Bundle Analysis** - Performance monitoring
5. **Lighthouse CI** - Performance and accessibility
6. **Deploy Preview** - Vercel preview deployments

### Environment Variables
Required for production builds:

```bash
NEXT_PUBLIC_WORLD_APP_ID
NEXT_PUBLIC_WORLD_ID_ACTION_ID
NEXT_PUBLIC_ALCHEMY_API_KEY
NEXT_PUBLIC_WORLDCHAIN_RPC_URL
NEXT_PUBLIC_WORLDCHAIN_SEPOLIA_RPC_URL
NEXT_PUBLIC_SENTRY_DSN
```

## Configuration Files

### Next.js (`next.config.mjs`)
- ESLint enabled during builds
- TypeScript error checking enabled
- Security headers configured
- Sentry integration

### TypeScript (`tsconfig.json`)
- Strict mode enabled
- Path aliases configured
- Next.js optimizations

### ESLint (`eslint.config.mjs`)
- Next.js recommended rules
- TypeScript integration
- Custom ignore patterns

## Troubleshooting

### Common Issues

1. **Build Timeout**
   ```bash
   # Increase Node.js memory limit
   NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

2. **Type Errors**
   ```bash
   # Run type check in isolation
   npm run type-check
   ```

3. **ESLint Errors**
   ```bash
   # Auto-fix common issues
   npm run lint:fix
   ```

4. **Test Failures**
   ```bash
   # Run tests in watch mode for debugging
   npm run test:watch
   ```

### Performance Optimization

- Build artifacts are cached in CI
- Turbopack used for development
- Bundle analysis on pull requests
- Lighthouse CI for performance monitoring

## Best Practices

1. **Before Committing**
   - Run `npm run validate` locally
   - Ensure all tests pass
   - Check for TypeScript errors

2. **Before Pushing**
   - Run `npm run build:validate` for full validation
   - Review build warnings
   - Verify bundle size changes

3. **Code Quality**
   - Follow ESLint recommendations
   - Write unit tests for new features
   - Use TypeScript strictly

4. **Security**
   - Regularly update dependencies
   - Review `npm audit` results
   - Follow security best practices

## Monitoring

- **Sentry**: Error tracking and performance monitoring
- **Lighthouse CI**: Performance and accessibility metrics
- **Bundle Analysis**: Size and optimization tracking
- **GitHub Actions**: Build status and deployment tracking

For more information, see the individual configuration files and the main README.md.