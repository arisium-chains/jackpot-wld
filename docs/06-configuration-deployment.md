# Configuration & Deployment

## Environment Setup

### Prerequisites

#### Required Tools

- **Node.js 20+** - JavaScript runtime environment
- **pnpm** - Fast, disk space efficient package manager
- **Foundry** - Ethereum development toolkit
- **Git** - Version control system

#### Optional Tools

- **Docker** - For containerized development
- **Wrangler** - For Cloudflare integration
- **Vercel CLI** - For deployment management
- **Jest** - For frontend testing
- **Slither** - For contract security analysis

### Initial Setup

#### Repository Clone

```bash
git clone <repository-url>
cd worldcoin-pooltogether-miniapp
```

#### Dependency Installation

```bash
# Install Node.js dependencies
pnpm install

# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

#### Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit configuration (see Environment Variables section)
nano .env.local
```

## Environment Variables

### Required Variables

#### World ID Integration

```bash
# World ID Configuration
NEXT_PUBLIC_WORLD_ID_APP_ID=your_world_id_app_id
NEXT_PUBLIC_WORLD_ID_ACTION_ID=your_world_id_action_id
WORLD_ID_GROUP_ID=your_world_id_group_id
```

#### Blockchain Configuration

```bash
# Network Configuration
NEXT_PUBLIC_CHAIN_ID=31337  # Local development
WORLDCHAIN_SEPOLIA_RPC_URL=https://worldchain-sepolia.g.alchemy.com/v2/your-api-key
PRIVATE_KEY=your_deployment_private_key
```

#### Contract Addresses (Auto-populated during deployment)

```bash
NEXT_PUBLIC_POOL_CONTRACT=0x...
NEXT_PUBLIC_PRIZE_POOL=0x...
NEXT_PUBLIC_VRF_CONSUMER=0x...
NEXT_PUBLIC_YIELD_ADAPTER=0x...
```

#### Monitoring & Analytics

```bash
# Sentry Configuration
SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project

# Analytics (Optional)
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
```

### Optional Variables

#### Development Configuration

```bash
# Development Flags
DEBUG=true
LOG_LEVEL=debug
NODE_ENV=development

# Feature Flags
ENABLE_MOCK_WORLD_ID=true
ENABLE_DEBUG_PANEL=true
```

#### Performance Configuration

```bash
# Build Optimization
TURBOPACK=true
BUNDLE_ANALYZER=false

# Runtime Configuration
MAX_CONCURRENT_REQUESTS=10
CACHE_TTL=300
```

## Build & Development

### Development Commands

#### Start Local Blockchain

```bash
# Start Anvil (Foundry's local Ethereum node)
anvil

# Alternative: Start with specific configuration
anvil --host 0.0.0.0 --port 8545 --chain-id 31337
```

#### Smart Contract Development

```bash
# Compile contracts
forge build

# Run tests
forge test

# Run tests with coverage
forge coverage

# Security analysis (requires Slither)
slither .
```

#### Frontend Development

```bash
# Start development server
pnpm dev

# Start with Turbopack (faster builds)
pnpm dev --turbopack

# Type checking
pnpm type-check

# Linting
pnpm lint

# Run tests
pnpm test
```

### Build Commands

#### Production Build

```bash
# Build for production
pnpm build

# Validate build
pnpm start

# Build with analysis
BUNDLE_ANALYZER=true pnpm build
```

#### Contract Compilation

```bash
# Compile all contracts
forge build

# Compile with optimization
forge build --optimize

# Clean and rebuild
forge clean && forge build
```

## Deployment Guide

### Local Development Deployment

#### 1. Start Local Blockchain

```bash
anvil
```

#### 2. Deploy Contracts

```bash
# Deploy with mock yield adapter
YIELD_IMPL=MOCK forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key $PRIVATE_KEY
```

#### 3. Update Environment Variables

```bash
# Update .env.local with deployed contract addresses
# Addresses will be displayed in deployment output
```

#### 4. Start Frontend

```bash
pnpm dev
```

### Testnet Deployment

#### 1. Prepare Environment

```bash
# Ensure environment variables are set
source .env.local

# Verify RPC connectivity
cast block-number --rpc-url $WORLDCHAIN_SEPOLIA_RPC_URL
```

#### 2. Deploy Contracts

```bash
# Deploy with mock yield adapter
YIELD_IMPL=MOCK pnpm deploy:testnet

# Deploy with Uniswap V3 adapter
YIELD_IMPL=UNISWAP_V3 pnpm deploy:testnet

# Custom deployment script
forge script script/DeployTestnet.s.sol \
  --rpc-url $WORLDCHAIN_SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --private-key $PRIVATE_KEY
```

#### 3. Verify Contracts

```bash
# Verify on block explorer (if supported)
forge verify-contract \
  --chain-id 4801 \
  --compiler-version 0.8.24 \
  <contract-address> \
  contracts/PoolContract.sol:PoolContract
```

#### 4. Update Configuration

```bash
# Update environment variables with testnet addresses
# Update public/addresses.json for frontend
```

### Production Deployment

#### 1. Pre-deployment Checklist

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Environment variables configured
- [ ] Monitoring systems set up
- [ ] Emergency procedures documented
- [ ] Multi-signature wallet configured

#### 2. Smart Contract Deployment

```bash
# Deploy with production configuration
YIELD_IMPL=UNISWAP_V3 \
VERIFY_CONTRACTS=true \
forge script script/Deploy.s.sol \
  --rpc-url $MAINNET_RPC_URL \
  --broadcast \
  --verify \
  --private-key $DEPLOYMENT_PRIVATE_KEY
```

#### 3. Frontend Deployment

```bash
# Deploy to Vercel
vercel --prod

# Deploy with environment variables
vercel --prod --env-file .env.production
```

#### 4. Post-deployment Verification

```bash
# Verify contract deployment
cast call $POOL_CONTRACT "owner()" --rpc-url $MAINNET_RPC_URL

# Test basic functionality
cast call $POOL_CONTRACT "getTotalDeposits()" --rpc-url $MAINNET_RPC_URL

# Monitor deployment
curl -I https://your-domain.vercel.app
```

## Configuration Management

### Contract Configuration

#### Foundry Configuration (`foundry.toml`)

```toml
[profile.default]
src = "contracts"
out = "out"
libs = ["lib"]
solc_version = "0.8.24"
optimizer = true
optimizer_runs = 200
via_ir = true

[profile.ci]
fuzz_runs = 10000
invariant_runs = 1000

[rpc_endpoints]
localhost = "http://localhost:8545"
sepolia = "${WORLDCHAIN_SEPOLIA_RPC_URL}"
```

#### Deployment Configuration

```solidity
// script/Config.s.sol
contract Config {
    // Yield implementation selection
    enum YieldImpl { MOCK, UNISWAP_V3 }

    // Network-specific configurations
    struct NetworkConfig {
        address wldToken;
        address worldId;
        address vrfCoordinator;
        uint64 vrfSubscriptionId;
        bytes32 vrfKeyHash;
        uint256 worldIdGroupId;
    }
}
```

### Frontend Configuration

#### Next.js Configuration (`next.config.mjs`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  // Environment variable validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};
```

#### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Deployment Verification

### Contract Verification Checklist

- [ ] Contracts deployed successfully
- [ ] Contract addresses updated in environment
- [ ] Contract ownership transferred (if applicable)
- [ ] Initial configuration set
- [ ] Access controls verified
- [ ] Emergency functions tested

### Frontend Verification Checklist

- [ ] Application loads successfully
- [ ] Wallet connection working
- [ ] Contract interactions functional
- [ ] Error handling working
- [ ] Performance metrics acceptable
- [ ] Monitoring systems active

### Integration Testing

```bash
# Test complete flow
pnpm test:integration

# Test specific scenarios
pnpm test:deposit
pnpm test:withdraw
pnpm test:world-id
pnpm test:lottery-draw
```

## Monitoring & Maintenance

### Health Checks

```bash
# Frontend health check
curl -f https://your-domain.vercel.app/api/health

# Contract health check
cast call $POOL_CONTRACT "paused()" --rpc-url $RPC_URL
```

### Automated Monitoring

- **Sentry** for error tracking and performance monitoring
- **Vercel Analytics** for frontend performance
- **Blockchain monitoring** for contract events
- **Uptime monitoring** for service availability

### Maintenance Procedures

- **Regular dependency updates**
- **Security patch deployment**
- **Performance optimization**
- **Backup and recovery procedures**

This configuration and deployment guide ensures a smooth setup process and reliable deployment procedures for both development and production environments.
