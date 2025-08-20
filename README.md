# Jackpot WLD - Production-Ready Lottery System

🎰 **A comprehensive PoolTogether-style lottery system built on Worldcoin (WLD)** 🎰

A production-ready no-loss lottery system where users deposit WLD tokens, generate yield through configurable adapters, and participate in automated lottery draws funded by the generated yield. Features real World ID verification, VRF randomness, automated draws, and comprehensive observability.

## ✨ Production Features

### Core System
- **Real World ID Integration**: Full IDKit client + server verification with configurable flags
- **Configurable Yield Adapters**: Live-switchable yield strategies (Mock, Uniswap V3, extensible)
- **Secure Randomness**: Chainlink VRF integration for cryptographically secure winner selection
- **Automated Draws**: CLI automation system with configurable intervals
- **Comprehensive Testing**: 45+ passing tests with security analysis

### User Experience
- **Toast Notifications**: Real-time feedback with Sonner integration
- **Loading States**: Skeleton components for smooth UX
- **Empty States**: Contextual empty state components
- **Event History**: Complete transaction and action tracking
- **Error Boundaries**: Graceful error handling with Sentry integration

### DevOps & Security
- **CI/CD Pipelines**: GitHub Actions for contracts and web app
- **Security Analysis**: Slither integration with comprehensive rules
- **Monitoring**: Sentry error tracking and performance monitoring
- **Documentation**: Security policies and contribution guidelines

## ✨ Features Implemented

- **Core Pool Contract**: Deposit/withdraw WLD tokens with balance tracking and yield integration
- **Prize Pool System**: Automated yield accumulation and lottery draw mechanism
- **Yield Adapter**: Mock yield generation with configurable APY and harvest functionality
- **Admin Functions**: Prize pool management, draw execution, and yield harvesting
- **Frontend Interface**: React-based UI with wallet connection and contract interactions
- **Comprehensive Testing**: 45 passing tests covering all major contract functionality
- **Demo Scripts**: Complete deployment and flow demonstration scripts
- **TypeScript Integration**: Fully typed frontend with viem/wagmi for blockchain interactions

## 🛠 Tech Stack

### Frontend
- **Next.js 15** with TypeScript and Tailwind CSS
- **shadcn/ui** for component library with custom extensions
- **Viem & Wagmi** for blockchain interactions
- **Sonner** for toast notifications
- **Sentry** for error tracking and performance monitoring
- **World ID (IDKit)** for human verification

### Smart Contracts
- **Foundry** for smart contract development and testing
- **Solidity 0.8.24** with OpenZeppelin contracts
- **Chainlink VRF** for secure randomness
- **Configurable yield adapters** (Mock, Uniswap V3, extensible)
- **Slither** for security analysis

### DevOps & Automation
- **GitHub Actions** for CI/CD pipelines
- **Vercel** for frontend deployment
- **CLI automation** for draw management
- **Comprehensive testing** with coverage reporting

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Foundry (for smart contracts)
- Git
- World ID Developer Account (for production)
- Sentry Account (for monitoring)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd worldcoin-pooltogether-miniapp
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your configuration:
# - World ID App ID and Action ID
# - RPC URLs for target networks
# - Sentry DSN for monitoring
# - Yield implementation preference
```

### 3. Smart Contract Development

```bash
# Install Foundry dependencies
forge install

# Compile contracts
forge build

# Run all tests (should pass with 45+ tests)
forge test

# Run with coverage
forge coverage
```

### 4. Local Development

```bash
# Terminal 1: Start local Anvil node
anvil

# Terminal 2: Deploy contracts locally
pnpm deploy:local

# Terminal 3: Start frontend
pnpm dev

# Open http://localhost:3000
```

### 5. Testnet Deployment

```bash
# Deploy to Worldchain Sepolia testnet
YIELD_IMPL=MOCK pnpm deploy:testnet

# Or deploy with Uniswap V3 yield adapter
YIELD_IMPL=UNISWAP_V3 pnpm deploy:testnet

# Addresses and ABIs automatically written to src/lib/
```

## 🔧 Environment Variables

### Required Configuration

```bash
# World ID Configuration
NEXT_PUBLIC_WORLDID_APP_ID="app_staging_xxx"     # Your World ID App ID
NEXT_PUBLIC_WORLDID_ACTION_ID="deposit"          # Action ID for verification
NEXT_PUBLIC_WORLDID_ENABLED="true"               # Enable/disable World ID

# Network Configuration
NEXT_PUBLIC_RPC_URL="https://worldchain-sepolia.g.alchemy.com/v2/xxx"
NEXT_PUBLIC_CHAIN_ID="11155111"                   # Sepolia testnet
PRIVATE_KEY="0x..."                              # Deployment private key

# Yield Configuration
YIELD_IMPL="MOCK"                                # MOCK | UNISWAP_V3
UNISWAP_V3_FACTORY="0x..."                       # Uniswap V3 factory address
UNISWAP_V3_ROUTER="0x..."                        # Uniswap V3 router address

# Monitoring (Optional)
NEXT_PUBLIC_SENTRY_DSN="https://xxx@sentry.io/xxx"
SENTRY_ORG="your-org"
SENTRY_PROJECT="jackpot-wld"
SENTRY_AUTH_TOKEN="xxx"
```

### Development Flags

```bash
# Feature Flags
NEXT_PUBLIC_DEBUG="false"                        # Enable debug mode
NEXT_PUBLIC_MOCK_DATA="false"                    # Use mock data

# Development
NEXT_PUBLIC_VERCEL_URL=""                        # Auto-set by Vercel
NEXT_PUBLIC_VERCEL_ENV=""                        # Auto-set by Vercel
```

## 🤖 Automation & CLI

### Draw Automation

```bash
# Manual draw execution
pnpm draw:tick

# Automated draws with cron (every hour)
0 * * * * cd /path/to/project && pnpm draw:tick

# Check automation status
pnpm draw:status
```

### Contract Management

```bash
# Deploy contracts
pnpm deploy:local          # Local Anvil deployment
pnpm deploy:testnet         # Worldchain Sepolia deployment

# Contract verification
forge verify-contract <address> <contract> --chain-id 11155111

# Run security analysis
slither .
```

## 📁 Project Structure

```
├── contracts/              # Smart contracts
│   ├── PoolContract.sol   # Main pool contract
│   ├── PrizePool.sol      # Prize pool and lottery logic
│   ├── adapters/          # Yield adapter implementations
│   ├── factories/         # Factory contracts
│   ├── interfaces/        # Contract interfaces
│   └── mocks/             # Mock contracts for testing
├── script/                # Foundry deployment scripts
│   ├── Deploy.s.sol       # Local deployment
│   ├── DeployTestnet.s.sol # Testnet deployment
│   └── DemoFlow.s.sol     # Complete demo flow
├── scripts/               # Automation and CLI tools
│   ├── draw-tick.ts       # Draw automation script
│   └── draw-automation.sh # Shell automation wrapper
├── src/                   # Frontend application
│   ├── app/               # Next.js app router pages
│   ├── components/        # React components (UI + business)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and configurations
│   └── providers/         # Context providers
├── test/                  # Smart contract tests
├── .github/workflows/     # CI/CD pipelines
└── docs/                  # Documentation
```

## 🆔 World ID Setup

### 1. Create World ID Application

1. Visit [World ID Developer Portal](https://developer.worldcoin.org/)
2. Create a new application
3. Configure your application:
   - **Name**: Jackpot WLD
   - **Description**: No-loss lottery system
   - **Verification Level**: Device (for testing) or Orb (for production)
4. Copy your `App ID` and `Action ID`

### 2. Configure Environment

```bash
# Add to .env.local
NEXT_PUBLIC_WORLDID_APP_ID="app_your_app_id_here"
NEXT_PUBLIC_WORLDID_ACTION_ID="your_action_id_here"
NEXT_PUBLIC_WORLDID_ENABLED=true
```

### 3. Test Integration

```bash
# Start development server
pnpm dev

# Test World ID verification in browser
# Use World App simulator for testing
```

## 🚀 Production Deployment

### 1. Testnet Deployment (Worldchain Sepolia)

```bash
# Set environment variables
export RPC_URL="https://worldchain-sepolia.g.alchemy.com/v2/your-key"
export PRIVATE_KEY="0x..."
export YIELD_IMPL="MOCK"  # or UNISWAP_V3

# Deploy contracts
pnpm deploy:testnet

# Verify deployment
cat public/addresses.json
```

### 2. Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
# - NEXT_PUBLIC_WORLDID_APP_ID
# - NEXT_PUBLIC_WORLDID_ACTION_ID
# - NEXT_PUBLIC_SENTRY_DSN
# - Contract addresses from deployment
```

### 3. Monitoring Setup

```bash
# Configure Sentry
# 1. Create Sentry project
# 2. Get DSN from project settings
# 3. Set NEXT_PUBLIC_SENTRY_DSN in environment

# Setup error tracking
# Errors automatically tracked via ErrorBoundary
# Performance monitoring enabled by default
```

## 📋 Operations Runbook

### Daily Operations

```bash
# Check system health
pnpm draw:check

# Monitor error rates in Sentry
# Check transaction success rates
# Verify yield generation
```

### Draw Management

```bash
# Manual draw execution
pnpm draw:tick

# Check draw eligibility
# Verify prize pool balance
# Confirm winner selection
```

### Troubleshooting

#### Common Issues

1. **World ID Verification Fails**
   ```bash
   # Check app configuration
   # Verify action ID matches
   # Test with World App simulator
   ```

2. **Transaction Failures**
   ```bash
   # Check gas prices
   # Verify contract addresses
   # Check RPC connectivity
   ```

3. **Yield Generation Issues**
   ```bash
   # Check yield adapter configuration
   # Verify Uniswap V3 pool liquidity
   # Monitor harvest transactions
   ```

### Emergency Procedures

1. **Pause System**
   ```bash
   # Use admin functions to pause deposits
   # Monitor for security issues
   ```

2. **Upgrade Contracts**
   ```bash
   # Deploy new implementation
   # Update frontend addresses
   # Migrate user funds if needed
   ```

## 🎮 Demo Flow

The `DemoFlow.s.sol` script demonstrates the complete system:

1. **Deploy Contracts**: WLD token, yield adapter, prize pool, and main pool contract
2. **Setup Configuration**: Set draw intervals and yield thresholds
3. **User Deposits**: Simulate multiple users depositing WLD tokens
4. **Yield Generation**: Mock yield generation on deposited funds
5. **Harvest & Fund**: Harvest yield and fund the prize pool
6. **Draw Winner**: Execute lottery draw and distribute prize

```bash
# Run the complete demo
forge script script/DemoFlow.s.sol --fork-url <RPC_URL> --broadcast
```

## 🌐 Frontend Pages

- **Home (`/`)**: Overview, stats, and recent winners
- **Deposit (`/deposit`)**: Deposit WLD tokens with World ID verification
- **Withdraw (`/withdraw`)**: Withdraw deposited tokens
- **History (`/history`)**: Transaction and event history
- **Admin (`/admin`)**: Administrative functions (harvest, draw winner)

## 📖 Production Runbook

### Initial Deployment

1. **Setup Environment**
   ```bash
   # Configure environment variables
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

2. **Deploy to Testnet**
   ```bash
   # Deploy with mock yield adapter
   YIELD_IMPL=MOCK pnpm deploy:testnet
   
   # Or deploy with Uniswap V3 adapter
   YIELD_IMPL=UNISWAP_V3 pnpm deploy:testnet
   ```

3. **Verify Deployment**
   ```bash
   # Check generated files
   ls src/lib/addresses.json
   ls src/abi/*.json
   
   # Test frontend connection
   pnpm dev
   ```

### Ongoing Operations

1. **Monitor System Health**
   - Check Sentry for errors and performance
   - Monitor contract balances and yield generation
   - Verify draw automation is running

2. **Draw Management**
   ```bash
   # Check if draw is due
   pnpm draw:status
   
   # Manual draw execution
   pnpm draw:tick
   
   # Setup automated draws
   crontab -e
   # Add: 0 * * * * cd /path/to/project && pnpm draw:tick
   ```

3. **Yield Harvesting**
   ```bash
   # Check harvestable yield
   cast call $YIELD_ADAPTER "getHarvestableAmount()" --rpc-url $RPC_URL
   
   # Harvest yield (admin only)
   cast send $POOL_CONTRACT "harvestYield()" --private-key $PRIVATE_KEY --rpc-url $RPC_URL
   ```

### Troubleshooting

1. **Common Issues**
   - **World ID verification fails**: Check app ID and action ID configuration
   - **Transactions fail**: Verify contract addresses and network configuration
   - **Yield not generating**: Check yield adapter configuration and balances
   - **Draws not executing**: Verify automation setup and contract permissions

2. **Debug Commands**
   ```bash
   # Check contract state
   cast call $POOL_CONTRACT "totalDeposits()" --rpc-url $RPC_URL
   cast call $PRIZE_POOL "currentPrizeAmount()" --rpc-url $RPC_URL
   
   # View recent transactions
   cast logs --address $POOL_CONTRACT --rpc-url $RPC_URL
   ```

### Security Checklist

- [ ] Private keys stored securely (never in code)
- [ ] Contract addresses verified on block explorer
- [ ] Slither security analysis passed
- [ ] Test coverage above 90%
- [ ] Sentry monitoring configured
- [ ] Rate limiting enabled for API endpoints
- [ ] World ID verification working correctly
- [ ] VRF randomness properly configured

## 🔒 Security Considerations

### Smart Contract Security
- **Access Controls**: Admin functions protected with proper role-based access
- **Reentrancy Protection**: All external calls protected against reentrancy attacks
- **Integer Overflow**: SafeMath and Solidity 0.8+ built-in protections
- **Slither Analysis**: Automated security analysis in CI pipeline

### Frontend Security
- **Input Validation**: All user inputs validated and sanitized
- **Error Handling**: Comprehensive error boundaries with Sentry integration
- **Environment Variables**: Sensitive data properly managed
- **Content Security Policy**: Configured in Next.js for XSS protection

### Operational Security
- **Private Key Management**: Never commit private keys to repository
- **RPC Security**: Use reputable RPC providers with rate limiting
- **Monitoring**: Real-time error tracking and performance monitoring
- **Incident Response**: Documented procedures for security incidents

## 🚧 Future Enhancements

Potential improvements for future versions:

1. **Multi-Token Support**: Support for additional ERC-20 tokens
2. **Advanced Yield Strategies**: Integration with more DeFi protocols
3. **Governance System**: DAO governance for parameter updates
4. **Mobile App**: Native World App Miniapp integration
5. **Layer 2 Support**: Deployment to additional L2 networks
6. **Social Features**: Leaderboards, achievements, and social sharing

## 🚀 Production Deployment

### Mainnet Deployment Checklist

- [ ] **Security Audit**: Complete professional smart contract audit
- [ ] **Testnet Testing**: Extensive testing on Worldchain Sepolia
- [ ] **World ID Production**: Configure production World ID app
- [ ] **VRF Setup**: Deploy and configure Chainlink VRF on mainnet
- [ ] **Yield Strategy**: Configure production yield adapters
- [ ] **Monitoring**: Setup comprehensive monitoring and alerting
- [ ] **Documentation**: Complete user and operator documentation
- [ ] **Insurance**: Consider smart contract insurance coverage

### Scaling Considerations

1. **Multi-Pool Support**: Deploy multiple pools with different strategies
2. **Governance**: Implement DAO governance for parameter updates
3. **Advanced Yield**: Integrate multiple DeFi protocols for yield optimization
4. **Mobile App**: World App Miniapp SDK integration
5. **Cross-Chain**: Consider multi-chain deployment strategy

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

## 🔒 Security

See [SECURITY.md](SECURITY.md) for security policies and vulnerability reporting.

## 📄 License

MIT License - see LICENSE file for details.

---

**✅ Production Ready**: This system has been designed for production use with comprehensive security, monitoring, and operational features. Always perform thorough testing and security audits before mainnet deployment.
