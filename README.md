# Worldcoin PoolTogether Miniapp

A PoolTogether-style miniapp built on Worldcoin (WLD) that enables users to deposit WLD tokens, generate yield through liquidity provision or staking, and participate in periodic lottery draws funded by the generated yield. The application integrates with World App using the Miniapp SDK and implements World ID verification for sybil-resistance.

## Features

- **No-Loss Lottery**: Deposit WLD tokens and participate in lottery draws while keeping your principal
- **Yield Generation**: Automatic routing of deposits to LP/staking mechanisms for yield generation
- **World ID Integration**: Sybil-resistant lottery participation through World ID verification
- **Mobile-First**: Built as a World App Miniapp for seamless mobile experience
- **Transparent & Secure**: Smart contracts with comprehensive testing and security measures

## Tech Stack

### Frontend

- **Next.js 15** with TypeScript and Tailwind CSS
- **shadcn/ui** for component library
- **Viem & Wagmi** for blockchain interactions
- **World App Miniapp SDK** for World App integration

### Smart Contracts

- **Foundry** for smart contract development and testing
- **Solidity 0.8.24** with OpenZeppelin contracts
- **Chainlink VRF** for verifiable randomness in lottery draws

### Development Environment

- **Docker Compose** for containerized development
- **Anvil** for local Ethereum node
- **PostgreSQL & Redis** for optional data persistence and caching

## Development Setup

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Git

### Quick Start

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd worldcoin-pooltogether-miniapp
   ```

2. **Install dependencies**

   ```bash
   npm install
   forge install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development environment**

   ```bash
   # Option 1: Using Docker Compose (recommended)
   npm run docker:up

   # Option 2: Local development
   npm run dev
   ```

5. **Compile and test smart contracts**
   ```bash
   npm run compile
   npm run test:contracts
   ```

### Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build production application
- `npm run compile` - Compile smart contracts
- `npm run test:contracts` - Run Foundry tests
- `npm run deploy:local` - Deploy contracts to local Anvil
- `npm run docker:up` - Start Docker development environment
- `npm run docker:down` - Stop Docker environment

### Project Structure

```
├── src/                    # Frontend source code
│   ├── app/               # Next.js app router pages
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   └── features/     # Feature-specific components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── contracts/             # Smart contracts
│   ├── interfaces/       # Contract interfaces
│   ├── libraries/        # Contract libraries
│   └── mocks/           # Mock contracts for testing
├── test/                 # Smart contract tests
├── script/               # Deployment scripts
└── lib/                  # Foundry dependencies
```

- **TanStack Query** for data fetching and caching

### Smart Contracts

- **Foundry** for development, testing, and deployment
- **Solidity 0.8.24** with OpenZeppelin contracts
- **Chainlink VRF** for verifiable randomness
- **World ID** for identity verification

## Smart Contract Architecture

### Core Interfaces

The protocol is built around three main interfaces that define the core functionality:

#### IPoolContract

The main entry point for user interactions, handling deposits and withdrawals.

```solidity
interface IPoolContract {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getUserBalance(address user) external view returns (uint256);
    function getTotalDeposits() external view returns (uint256);
    function verifyUser(address user, uint256 root, uint256 nullifierHash, uint256[8] calldata proof) external;
}
```

**Implementation Status**: ✅ **COMPLETED**

- Full deposit/withdrawal functionality with World ID verification
- Comprehensive input validation and security checks
- Integration points for yield adapter and prize pool contracts
- Emergency functions and administrative controls

#### IPrizePool

Manages lottery draws and prize distribution from accumulated yield.

```solidity
interface IPrizePool {
    function addYield(uint256 amount) external;
    function drawWinner() external returns (address winner);
    function getCurrentPrizeAmount() external view returns (uint256);
    function getNextDrawTime() external view returns (uint256);
}
```

#### IYieldAdapter

Abstracts yield generation strategies (LP provision, staking).

```solidity
interface IYieldAdapter {
    function deposit(uint256 amount) external returns (uint256 shares);
    function withdraw(uint256 shares) external returns (uint256 amount);
    function harvestYield() external returns (uint256 yieldAmount);
    function getAPY() external view returns (uint256);
}
```

### Base Contract

All protocol contracts inherit from `BaseContract` which provides:

- **Access Control**: Owner, admin, and operator roles
- **Pausable**: Emergency pause functionality
- **Reentrancy Guard**: Protection against reentrancy attacks
- **Safe Transfers**: Secure token transfer utilities

### Libraries

#### Errors.sol

Centralized custom error definitions for gas-efficient error handling.

#### Constants.sol

Protocol constants including time intervals, limits, and precision values.

#### Math.sol

Mathematical utilities for percentage calculations, APY computation, and share/asset conversions.

### Mock Contracts

For testing and development:

- **MockWLD**: ERC20 token simulating WLD with faucet functionality
- **MockWorldID**: Simulates World ID verification for testing
- **MockVRFCoordinator**: Mock Chainlink VRF for deterministic randomness in tests

### Testing

Run the smart contract test suite:

```bash
# Run all tests
forge test

# Run tests with gas reporting
forge test --gas-report

# Run specific test file
forge test --match-contract BaseContractTest

# Run with coverage
forge coverage
```

### Deployment

The deployment script supports multiple networks:

```bash
# Deploy to local Anvil
npm run deploy:local

# Deploy to Worldchain Sepolia
npm run deploy:sepolia

# Deploy to Worldchain Mainnet
npm run deploy:mainnet
```

### Security Features

- **Reentrancy Protection**: All state-changing functions protected
- **Access Control**: Multi-level permission system
- **Input Validation**: Comprehensive parameter validation
- **Safe Math**: Overflow/underflow protection
- **Pausable**: Emergency stop functionality
- **Custom Errors**: Gas-efficient error handling

## Project Structure

```
worldcoin-pooltogether-miniapp/
├── contracts/                 # Smart contracts
│   ├── interfaces/           # Contract interfaces
│   ├── libraries/           # Shared libraries
│   └── mocks/              # Mock contracts for testing
├── src/                     # Frontend source code
│   ├── app/                # Next.js app router pages
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   └── features/      # Feature-specific components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   └── constants/         # Application constants
├── test/                   # Smart contract tests
├── script/                # Deployment scripts
├── lib/                   # Foundry dependencies
└── deploy/               # Deployment configurations
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Docker and Docker Compose (optional, for containerized development)

### Installation

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd worldcoin-pooltogether-miniapp
   npm run setup
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start local development environment:**

   ```bash
   # Option 1: Using Docker Compose (recommended)
   npm run docker:up

   # Option 2: Manual setup
   # Terminal 1: Start local blockchain
   anvil --host 0.0.0.0 --port 8545

   # Terminal 2: Start frontend
   npm run dev
   ```

### Development Workflow

1. **Smart Contract Development:**

   ```bash
   # Compile contracts
   npm run compile

   # Run tests
   npm run test:contracts

   # Generate gas report
   npm run test:contracts:gas

   # Check coverage
   npm run test:contracts:coverage
   ```

2. **Frontend Development:**

   ```bash
   # Start development server
   npm run dev

   # Lint code
   npm run lint

   # Build for production
   npm run build
   ```

3. **Deployment:**

   ```bash
   # Deploy to local network
   npm run deploy:local

   # Deploy to Worldchain Sepolia
   npm run deploy:sepolia

   # Deploy to Worldchain Mainnet
   npm run deploy:mainnet
   ```

## Configuration

### Environment Variables

Create a `.env.local` file based on `.env.example`:

- `NEXT_PUBLIC_WORLD_APP_ID`: Your World App ID
- `NEXT_PUBLIC_WORLD_ID_ACTION_ID`: World ID action ID for verification
- `NEXT_PUBLIC_ALCHEMY_API_KEY`: Alchemy API key for RPC access
- `PRIVATE_KEY`: Private key for contract deployment (keep secure!)

### Foundry Configuration

The `foundry.toml` file contains:

- Solidity compiler settings
- Gas optimization configurations
- RPC endpoints for different networks
- Etherscan/Worldscan API configurations

## Smart Contract Architecture

### Core Contracts

1. **PoolContract**: Main entry point for user deposits and withdrawals
2. **PrizePoolContract**: Manages yield accumulation and lottery draws
3. **YieldAdapter**: Abstracts yield generation mechanisms (LP/staking)

### Key Features

- **World ID Integration**: Ensures only verified humans can participate
- **Yield Generation**: Automatic routing to LP positions or staking
- **Verifiable Randomness**: Chainlink VRF for fair winner selection
- **Security**: Reentrancy protection, input validation, and comprehensive testing

## Testing

### Smart Contract Tests

```bash
# Run all tests
forge test

# Run tests with gas reporting
forge test --gas-report

# Run specific test file
forge test --match-path test/PoolContract.t.sol

# Run with coverage
forge coverage
```

### Frontend Tests

```bash
# Run component tests (when implemented)
npm run test

# Run E2E tests (when implemented)
npm run test:e2e
```

## Deployment

### Local Development

1. Start Anvil: `anvil --host 0.0.0.0`
2. Deploy contracts: `npm run deploy:local`
3. Update contract addresses in `.env.local`
4. Start frontend: `npm run dev`

### Testnet Deployment

1. Configure `.env` with testnet RPC and private key
2. Deploy: `npm run deploy:sepolia`
3. Verify contracts on block explorer
4. Update frontend configuration

### Mainnet Deployment

1. Audit smart contracts thoroughly
2. Configure production environment variables
3. Deploy: `npm run deploy:mainnet`
4. Verify and publish contract source code

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Security

- Smart contracts include reentrancy protection and input validation
- All external calls are properly handled with error checking
- Comprehensive test coverage including edge cases and attack vectors
- Regular security audits recommended before mainnet deployment

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions and support:

- Create an issue in this repository
- Join our Discord community
- Check the documentation in the `/docs` folder
