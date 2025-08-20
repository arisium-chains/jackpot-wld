# Smart Contract Deployment Guide

## Prerequisites

### 1. Environment Setup
1. Copy `.env.production` to `.env.local`
2. Fill in all required values (see sections below)
3. Ensure you have sufficient ETH/WLD for deployment gas fees

### 2. Required Accounts & API Keys

#### Blockchain Access
- **Alchemy API Key**: Get from [Alchemy Dashboard](https://dashboard.alchemy.com/)
- **Deployer Private Key**: Wallet with sufficient gas funds
- **Etherscan API Key**: For contract verification (optional)
- **Worldscan API Key**: For Worldchain verification (if available)

#### World App Integration
- **World App ID**: From [World App Dev Portal](https://developer.worldcoin.org/)
- **World ID Action ID**: Create action in Dev Portal

#### Monitoring (Optional)
- **Sentry DSN**: For error tracking

## Deployment Steps

### Step 1: Configure Environment Variables

```bash
# Copy the production template
cp .env.production .env.local

# Edit with your actual values
vim .env.local  # or use your preferred editor
```

#### Critical Variables to Update:

```bash
# 🔑 SECURITY - Replace with real values
PRIVATE_KEY=0x...
ALCHEMY_API_KEY=ak_...

# 🌍 World App Configuration
NEXT_PUBLIC_WORLD_APP_ID=app_staging_...
NEXT_PUBLIC_WORLD_ID_ACTION_ID=...

# 🏭 Production Settings
YIELD_IMPL=UNISWAP_V3  # or MOCK for testing
NEXT_PUBLIC_ENVIRONMENT=production
INITIAL_OWNER=0x...  # Use multisig for production
```

### Step 2: Compile Contracts

```bash
npm run compile
```

### Step 3: Run Tests (Recommended)

```bash
# Run all contract tests
npm run test:contracts

# Generate coverage report
npm run test:contracts:coverage

# Gas snapshot
npm run test:contracts:gas
```

### Step 4: Deploy to Testnet (Recommended First)

```bash
# Deploy to Worldchain Sepolia
npm run deploy:testnet
```

This will:
- Deploy all contracts
- Generate `public/addresses.json`
- Generate ABI files
- Verify contracts (if API keys provided)

### Step 5: Deploy to Mainnet

```bash
# Deploy to Worldchain Mainnet
npm run deploy:mainnet
```

### Step 6: Update Frontend Configuration

After deployment, update your environment with the deployed contract addresses:

```bash
# These will be automatically populated in addresses.json
NEXT_PUBLIC_POOL_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_PRIZE_POOL_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_YIELD_ADAPTER_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_YIELD_ADAPTER_ADDRESS=0x...
```

### Step 7: Deploy Frontend

```bash
# Build for Cloudflare Pages
npm run build:pages

# Deploy to Cloudflare Pages
# (Upload .vercel/output/static to Cloudflare Pages)
```

### Step 8: Configure World App Dev Portal

Update your World App with production URLs:

**Allowed Origins:**
```
https://worldcoin-pooltogether-miniapp.pages.dev
```

**Redirect URIs:**
```
https://worldcoin-pooltogether-miniapp.pages.dev
https://worldcoin-pooltogether-miniapp.pages.dev/
https://worldcoin-pooltogether-miniapp.pages.dev/deposit
https://worldcoin-pooltogether-miniapp.pages.dev/dashboard
```

## Network-Specific Information

### Worldchain Mainnet
- **Chain ID**: 480
- **RPC**: `https://worldchain-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
- **Explorer**: TBD

### Worldchain Sepolia (Testnet)
- **Chain ID**: 4801
- **RPC**: `https://worldchain-sepolia.g.alchemy.com/v2/YOUR_API_KEY`
- **Explorer**: `https://worldchain-sepolia.blockscout.com/`

## Troubleshooting

### Common Issues

1. **Insufficient Gas**
   - Ensure deployer wallet has enough ETH
   - Check gas price and limit

2. **RPC Issues**
   - Verify Alchemy API key
   - Check network connectivity

3. **Verification Failures**
   - Ensure API keys are correct
   - Check if verification service is available

4. **World ID Issues**
   - Verify World App ID and Action ID
   - Check Dev Portal configuration

### Deployment Verification

After deployment, verify:

1. **Contracts are deployed** - Check addresses in `public/addresses.json`
2. **Contracts are verified** - Check on block explorer
3. **Frontend connects** - Test deposit/withdraw flows
4. **World ID works** - Test verification flow

## Security Considerations

### Production Checklist

- [ ] Use hardware wallet or secure key management
- [ ] Set `INITIAL_OWNER` to multisig address
- [ ] Enable contract verification
- [ ] Set up monitoring and alerts
- [ ] Conduct security audit
- [ ] Test all functions on testnet first
- [ ] Use real yield implementation (not MOCK)
- [ ] Configure proper access controls

### Environment Security

- [ ] Never commit `.env.local` to git
- [ ] Use different keys for testnet/mainnet
- [ ] Rotate keys regularly
- [ ] Monitor deployed contracts
- [ ] Set up emergency procedures

## Post-Deployment

### Monitoring

1. Set up Sentry for error tracking
2. Monitor contract events
3. Track gas usage and costs
4. Monitor yield generation

### Maintenance

1. Regular security updates
2. Monitor for new vulnerabilities
3. Update dependencies
4. Backup critical data

## Support

For deployment issues:
1. Check this guide first
2. Review contract tests
3. Check deployment logs
4. Verify environment configuration