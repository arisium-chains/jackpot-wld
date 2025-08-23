# Technology Stack

## Frontend Technologies

### Core Framework

- **Next.js 15** - React framework with app router and server components
- **Turbopack** - Next-generation bundler for fast development builds
- **TypeScript** - Type-safe JavaScript with strict mode enabled
- **React 18** - Modern React with concurrent features

### Styling & UI

- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components built on Radix UI
- **Lucide React** - Beautiful & consistent icon set
- **CSS Modules** - Scoped styling solution

### Blockchain Integration

- **Viem** - TypeScript interface for Ethereum
- **Wagmi** - React hooks for Ethereum interactions
- **RainbowKit** - Wallet connection library (if applicable)
- **ConnectKit** - Alternative wallet connection solution

### State Management & Data

- **TanStack Query** - Powerful data synchronization for React
- **Zustand** - Lightweight state management
- **React Context** - Built-in state management for global state

### Notifications & UX

- **Sonner** - Beautiful toast notifications
- **React Hot Toast** - Alternative toast system
- **Framer Motion** - Animation library for React

### Development Tools

- **ESLint** - Code linting and quality enforcement
- **Prettier** - Code formatting
- **Husky** - Git hooks for quality gates
- **Lint-staged** - Run linters on staged files

## Smart Contract Technologies

### Development Framework

- **Foundry** - Fast, portable, and modular toolkit for Ethereum development
  - **Forge** - Testing framework
  - **Cast** - Command-line tool for Ethereum RPC calls
  - **Anvil** - Local Ethereum node

### Language & Standards

- **Solidity 0.8.24** - Smart contract programming language
- **OpenZeppelin Contracts** - Secure smart contract library
- **ERC-20** - Token standard implementation
- **EIP-1967** - Proxy pattern standard

### External Integrations

- **Chainlink VRF** - Verifiable Random Function for secure randomness
- **World ID** - Privacy-preserving identity verification
- **Uniswap V3** - Decentralized exchange protocol for yield generation

### Security & Testing

- **Slither** - Static analysis for Solidity
- **Mythril** - Security analysis tool
- **Echidna** - Property-based fuzzing
- **Foundry Testing** - Comprehensive unit and integration testing

## Monitoring & Analytics

### Error Tracking

- **Sentry** - Error tracking and performance monitoring
  - Frontend error tracking
  - Performance monitoring
  - Real-time alerts
  - Integration with CI/CD

### Logging & Observability

- **Custom Logger** - Structured logging system
- **Console Debugging** - Development-time debugging
- **Performance Profiling** - Built-in Next.js analytics

## DevOps & Deployment

### Version Control

- **Git** - Distributed version control
- **GitHub** - Repository hosting and collaboration
- **GitHub Actions** - CI/CD pipeline automation

### Deployment Platforms

- **Vercel** - Frontend deployment and hosting
  - Edge runtime support
  - Automatic deployments
  - Environment management
  - Performance analytics

### Container & Local Development

- **Docker** - Containerization platform
- **Docker Compose** - Multi-container orchestration
- **Anvil** - Local blockchain for development

### Environment Management

- **dotenv** - Environment variable management
- **Vercel Environment Variables** - Production environment configuration
- **GitHub Secrets** - Secure environment variable storage

## Package Management

### Primary Package Manager

- **pnpm** - Fast, disk space efficient package manager
- **npm** - Fallback package manager
- **Node.js 20+** - JavaScript runtime

### Key Dependencies

#### Frontend Core

```json
{
  "next": "15.4.6",
  "react": "19.0.0",
  "typescript": "5.6.3",
  "tailwindcss": "3.4.1"
}
```

#### Blockchain Libraries

```json
{
  "viem": "2.33.3",
  "wagmi": "2.16.3",
  "@tanstack/react-query": "5.62.2"
}
```

#### UI & Components

```json
{
  "@radix-ui/react-*": "latest",
  "lucide-react": "latest",
  "sonner": "latest"
}
```

#### Development Tools

```json
{
  "eslint": "latest",
  "prettier": "latest",
  "@types/node": "latest",
  "@types/react": "latest"
}
```

## Build & Compilation

### Frontend Build Process

```bash
# Development
pnpm dev --turbopack

# Production Build
pnpm build

# Type Checking
pnpm type-check

# Linting
pnpm lint
```

### Smart Contract Build Process

```bash
# Compile Contracts
forge build

# Run Tests
forge test

# Deploy Local
forge script script/Deploy.s.sol --rpc-url http://localhost:8545

# Deploy Testnet
YIELD_IMPL=MOCK pnpm deploy:testnet
```

## Configuration Files

### Next.js Configuration

- **next.config.mjs** - Next.js configuration with Turbopack
- **tsconfig.json** - TypeScript compiler options
- **tailwind.config.ts** - Tailwind CSS configuration
- **postcss.config.mjs** - PostCSS configuration

### Development Tools Configuration

- **eslint.config.mjs** - ESLint configuration
- **prettier.config.js** - Prettier formatting rules
- **jest.config.js** - Testing framework configuration
- **jest.setup.js** - Test environment setup

### Smart Contract Configuration

- **foundry.toml** - Foundry project configuration
- **remappings.txt** - Import path remappings
- **slither.config.json** - Security analysis configuration

### Environment Configuration

- **.env.local** - Local environment variables
- **.env.example** - Environment variable template
- **vercel.json** - Vercel deployment configuration

## Runtime Requirements

### System Requirements

- **Node.js** - Version 20 or higher
- **Git** - For version control
- **Foundry** - For smart contract development

### Optional Requirements

- **Docker** - For containerized development
- **Wrangler** - For Cloudflare integration
- **Vercel CLI** - For deployment management

## Environment Variables

### Required Variables

```bash
# World ID Integration
NEXT_PUBLIC_WORLD_ID_ACTION_ID=your_action_id
NEXT_PUBLIC_WORLD_ID_APP_ID=your_app_id

# Blockchain Configuration
NEXT_PUBLIC_CHAIN_ID=chain_id
RPC_URL=your_rpc_url

# Contract Addresses
NEXT_PUBLIC_POOL_CONTRACT=contract_address
NEXT_PUBLIC_PRIZE_POOL=contract_address

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

### Optional Variables

```bash
# Development
DEBUG=true
LOG_LEVEL=debug

# Performance
NEXT_PUBLIC_ANALYTICS_ID=analytics_id
```

## Browser Compatibility

### Supported Browsers

- **Chrome** - Version 90+
- **Firefox** - Version 88+
- **Safari** - Version 14+
- **Edge** - Version 90+

### Mobile Support

- **iOS Safari** - Version 14+
- **Chrome Mobile** - Version 90+
- **Samsung Internet** - Version 14+

## Performance Specifications

### Build Performance

- **Development Build Time** - < 5 seconds with Turbopack
- **Production Build Time** - < 2 minutes
- **Hot Reload** - < 1 second

### Runtime Performance

- **First Contentful Paint** - < 2 seconds
- **Time to Interactive** - < 3 seconds
- **Core Web Vitals** - All metrics in "Good" range

### Smart Contract Performance

- **Gas Optimization** - Optimized for minimal gas usage
- **Test Coverage** - > 90% line coverage
- **Compilation Time** - < 30 seconds

This technology stack provides a modern, performant, and secure foundation for the Jackpot WLD system, ensuring scalability, maintainability, and developer productivity.
