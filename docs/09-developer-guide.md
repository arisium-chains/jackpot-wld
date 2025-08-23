# Developer Guide

## Getting Started

### Prerequisites

Before starting development on the Jackpot WLD project, ensure you have the following tools installed:

#### Required Tools
- **Node.js 20+** - JavaScript runtime environment
- **pnpm** - Fast, disk space efficient package manager
- **Git** - Version control system
- **Foundry** - Ethereum development toolkit

#### Installation Commands
```bash
# Install Node.js (via nvm - recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Install pnpm
npm install -g pnpm

# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

#### Optional Tools
- **Docker** - For containerized development
- **Vercel CLI** - For deployment management
- **Slither** - For smart contract security analysis

### Repository Setup

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd worldcoin-pooltogether-miniapp
```

#### 2. Install Dependencies
```bash
# Install Node.js dependencies
pnpm install

# Install git hooks (for code quality)
pnpm prepare
```

#### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit configuration with your values
nano .env.local
```

Required environment variables:
```bash
# World ID Configuration
NEXT_PUBLIC_WORLD_ID_APP_ID=your_app_id
NEXT_PUBLIC_WORLD_ID_ACTION_ID=your_action_id

# Development
NEXT_PUBLIC_CHAIN_ID=31337  # Local development
PRIVATE_KEY=your_test_private_key

# Optional
DEBUG=true
LOG_LEVEL=debug
```

## Development Workflow

### 1. Starting Development Environment

#### Start Local Blockchain
```bash
# Terminal 1: Start Anvil
anvil --host 0.0.0.0 --port 8545
```

#### Deploy Smart Contracts
```bash
# Terminal 2: Deploy contracts
YIELD_IMPL=MOCK pnpm deploy:local

# Verify deployment
cast call <POOL_CONTRACT_ADDRESS> "owner()" --rpc-url http://localhost:8545
```

#### Start Frontend Development Server
```bash
# Terminal 3: Start Next.js development server
pnpm dev

# Access application at http://localhost:3000
```

### 2. Development Scripts

#### Smart Contract Development
```bash
# Compile contracts
forge build

# Run tests
forge test

# Run tests with coverage
forge coverage

# Run specific test
forge test --match-test testDeposit

# Security analysis
slither . --config-file slither.config.json
```

#### Frontend Development
```bash
# Development server with Turbopack
pnpm dev --turbopack

# Type checking
pnpm type-check

# Linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Build for production
pnpm build

# Run production build locally
pnpm start
```

## Project Structure

### Directory Overview
```
worldcoin-pooltogether-miniapp/
├── contracts/              # Smart contracts
│   ├── adapters/           # Yield adapter implementations
│   ├── factories/          # Factory contracts
│   ├── interfaces/         # Contract interfaces
│   ├── libraries/          # Shared libraries
│   ├── mocks/              # Mock contracts for testing
│   ├── BaseContract.sol    # Base contract with common functionality
│   ├── PoolContract.sol    # Main pool contract
│   ├── PrizePool.sol       # Prize pool and lottery logic
│   ├── VrfConsumer.sol     # Chainlink VRF integration
│   └── YieldAdapter.sol    # Base yield adapter
├── script/                 # Foundry deployment scripts
│   ├── Deploy.s.sol        # Local deployment
│   ├── DeployTestnet.s.sol # Testnet deployment
│   └── DemoFlow.s.sol      # Demo flow execution
├── scripts/                # CLI tools and automation
│   ├── draw-tick.ts        # Draw automation script
│   └── draw-automation.sh  # Shell automation wrapper
├── src/                    # Frontend application
│   ├── app/                # Next.js app router pages
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities and configurations
│   ├── providers/          # Context providers
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── test/                   # Smart contract tests
├── docs/                   # Documentation
└── public/                 # Static assets
```

### Key Files

#### Configuration Files
- **foundry.toml** - Foundry project configuration
- **next.config.mjs** - Next.js configuration
- **tsconfig.json** - TypeScript configuration
- **tailwind.config.ts** - Tailwind CSS configuration
- **package.json** - Node.js dependencies and scripts

#### Environment Files
- **.env.example** - Environment variable template
- **.env.local** - Local development configuration
- **.env.production** - Production configuration

## Smart Contract Development

### Contract Architecture

#### Base Contract Pattern
```solidity
// BaseContract.sol
abstract contract BaseContract is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    modifier notZeroAddress(address addr) {
        if (addr == address(0)) revert ZeroAddress();
        _;
    }
    
    modifier validAmount(uint256 amount) {
        if (amount == 0) revert InvalidAmount();
        _;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
```

#### Interface Implementation
```solidity
// Example: Implementing IYieldAdapter
contract CustomYieldAdapter is YieldAdapter {
    function deposit(uint256 amount) external override returns (uint256 shares) {
        // Implement deposit logic
        return _calculateShares(amount);
    }
    
    function withdraw(uint256 shares) external override returns (uint256 amount) {
        // Implement withdrawal logic
        return _calculateAmount(shares);
    }
    
    function harvest() external override returns (uint256 yield) {
        // Implement yield harvesting
        return _harvestYield();
    }
}
```

### Testing Framework

#### Test Structure
```solidity
// test/PoolContract.t.sol
contract PoolContractTest is Test {
    PoolContract public poolContract;
    MockWLD public wldToken;
    MockWorldID public worldId;
    MockYieldAdapter public yieldAdapter;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy mock contracts
        wldToken = new MockWLD();
        worldId = new MockWorldID();
        yieldAdapter = new MockYieldAdapter();
        
        // Deploy main contract
        poolContract = new PoolContract(
            address(wldToken),
            address(worldId),
            address(yieldAdapter)
        );
        
        vm.stopPrank();
    }
    
    function testDeposit() public {
        uint256 depositAmount = 100e18;
        
        // Setup
        vm.startPrank(user1);
        wldToken.mint(user1, depositAmount);
        wldToken.approve(address(poolContract), depositAmount);
        
        // Verify user with World ID
        poolContract.verifyUser(user1, 1, 1, [uint256(0), 0, 0, 0, 0, 0, 0, 0]);
        
        // Execute deposit
        poolContract.deposit(depositAmount);
        
        // Verify results
        assertEq(poolContract.getUserBalance(user1), depositAmount);
        assertEq(poolContract.getTotalDeposits(), depositAmount);
        
        vm.stopPrank();
    }
}
```

#### Running Tests
```bash
# Run all tests
forge test

# Run specific test file
forge test --match-path test/PoolContract.t.sol

# Run specific test function
forge test --match-test testDeposit

# Run with detailed output
forge test -vvv

# Generate coverage report
forge coverage --report lcov
```

## Frontend Development

### Component Architecture

#### React Component Structure
```typescript
// components/DepositForm.tsx
import { useState } from 'react';
import { parseEther } from 'viem';
import { useDepositMutation } from '@/hooks/useTransaction';
import { toast } from 'sonner';

interface DepositFormProps {
  onSuccess?: () => void;
}

export function DepositForm({ onSuccess }: DepositFormProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const depositMutation = useDepositMutation({
    onSuccess: () => {
      toast.success('Deposit successful!');
      setAmount('');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Deposit failed: ${error.message}`);
    },
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    try {
      setIsLoading(true);
      await depositMutation.mutateAsync(parseEther(amount));
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium">
          Deposit Amount (WLD)
        </label>
        <input
          id="amount"
          type="number"
          step="0.000001"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isLoading}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="0.0"
        />
      </div>
      
      <button
        type="submit"
        disabled={isLoading || !amount}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md disabled:opacity-50"
      >
        {isLoading ? 'Depositing...' : 'Deposit'}
      </button>
    </form>
  );
}
```

#### Custom Hooks
```typescript
// hooks/useTransaction.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { poolContractConfig } from '@/lib/contracts';

export function useDepositMutation(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  
  return useMutation({
    mutationFn: async (amount: bigint) => {
      const hash = await writeContractAsync({
        ...poolContractConfig,
        functionName: 'deposit',
        args: [amount],
      });
      
      return hash;
    },
    onSuccess: (hash) => {
      queryClient.invalidateQueries({ queryKey: ['userBalance'] });
      queryClient.invalidateQueries({ queryKey: ['poolStats'] });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
```

### State Management

#### Context Providers
```typescript
// providers/WalletProvider.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

interface WalletContextType {
  // Add wallet-specific context if needed
}

const WalletContext = createContext<WalletContextType>({});

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletContext.Provider value={{}}>
          {children}
        </WalletContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export const useWalletContext = () => useContext(WalletContext);
```

## Code Quality Standards

### TypeScript Configuration

#### Strict Type Checking
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  }
}
```

#### Type Definitions
```typescript
// types/contracts.ts
export interface PoolStats {
  totalDeposits: bigint;
  totalYieldGenerated: bigint;
  participantCount: number;
  currentAPY: number;
}

export interface UserAccount {
  balance: bigint;
  verified: boolean;
  participatingInLottery: boolean;
  lastDepositTime: number;
}

export interface DrawResult {
  drawId: string;
  winner: `0x${string}`;
  prizeAmount: bigint;
  timestamp: number;
  participantCount: number;
}
```

### Linting and Formatting

#### ESLint Configuration
```javascript
// eslint.config.mjs
export default [
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      'react-hooks/exhaustive-deps': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
];
```

#### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Git Workflow

#### Commit Message Convention
```
type(scope): description

feat(contracts): add yield adapter factory
fix(ui): resolve wallet connection issue
docs(readme): update setup instructions
test(pool): add deposit validation tests
refactor(hooks): optimize transaction handling
```

#### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.sol": ["forge fmt"]
  }
}
```

## Testing Guidelines

### Unit Testing Best Practices

#### Test Organization
- **One test file per contract/component**
- **Group related tests in describe blocks**
- **Use descriptive test names**
- **Follow AAA pattern (Arrange, Act, Assert)**

#### Example Test Structure
```typescript
describe('PoolContract', () => {
  describe('deposit functionality', () => {
    it('should allow verified users to deposit', async () => {
      // Arrange
      const depositAmount = parseEther('100');
      await setupVerifiedUser(user1);
      
      // Act
      await poolContract.connect(user1).deposit(depositAmount);
      
      // Assert
      expect(await poolContract.getUserBalance(user1)).to.equal(depositAmount);
    });
    
    it('should reject deposits from unverified users', async () => {
      // Arrange
      const depositAmount = parseEther('100');
      
      // Act & Assert
      await expect(
        poolContract.connect(user1).deposit(depositAmount)
      ).to.be.revertedWith('User not verified');
    });
  });
});
```

### Integration Testing

#### End-to-End Test Examples
```typescript
// __tests__/integration/lottery-flow.test.ts
describe('Complete Lottery Flow', () => {
  it('should execute full lottery cycle', async () => {
    // 1. Users deposit
    await depositFunds(user1, parseEther('100'));
    await depositFunds(user2, parseEther('200'));
    
    // 2. Generate yield
    await simulateYieldGeneration(parseEther('10'));
    
    // 3. Execute draw
    await executeLotteryDraw();
    
    // 4. Verify results
    const winner = await getLastDrawWinner();
    const prizeAmount = await getLastPrizeAmount();
    
    expect(winner).to.be.oneOf([user1.address, user2.address]);
    expect(prizeAmount).to.be.greaterThan(0);
  });
});
```

## Deployment Guide

### Local Development Deployment

#### Automated Setup Script
```bash
#!/bin/bash
# scripts/setup-dev.sh

echo "Setting up development environment..."

# Start Anvil in background
anvil --host 0.0.0.0 --port 8545 &
ANVIL_PID=$!

# Wait for Anvil to start
sleep 2

# Deploy contracts
echo "Deploying contracts..."
YIELD_IMPL=MOCK forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast

# Update environment variables
echo "Updating environment variables..."
node scripts/update-env.js

# Start frontend
echo "Starting frontend..."
pnpm dev

# Cleanup on exit
trap "kill $ANVIL_PID" EXIT
```

### Production Deployment Checklist

#### Pre-deployment
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Environment variables configured
- [ ] Contract verification enabled
- [ ] Monitoring systems ready

#### Deployment Steps
1. Deploy smart contracts to mainnet
2. Verify contracts on block explorer
3. Configure contract parameters
4. Deploy frontend to Vercel
5. Update DNS settings
6. Monitor deployment health

## Contributing Guidelines

### Pull Request Process

1. **Fork the repository**
2. **Create feature branch** from `main`
3. **Make changes** following code standards
4. **Add tests** for new functionality
5. **Update documentation** if needed
6. **Submit pull request** with clear description

### Code Review Guidelines

#### Reviewer Checklist
- [ ] Code follows project conventions
- [ ] Tests cover new functionality
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed

#### Common Review Comments
- "Consider extracting this logic into a separate function"
- "Add error handling for this edge case"
- "This test case is missing"
- "Consider gas optimization here"

## Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear cache and rebuild
pnpm clean
pnpm install
forge clean
forge build
```

#### Test Failures
```bash
# Run tests with detailed output
forge test -vvv

# Debug specific test
forge test --match-test testDeposit -vvv
```

#### Frontend Issues
```bash
# Clear Next.js cache
rm -rf .next
pnpm dev

# Type check issues
pnpm type-check
```

### Getting Help

- **Documentation**: Check the docs/ directory
- **Issues**: Search existing GitHub issues
- **Discord**: Join the project Discord server
- **Stack Overflow**: Tag questions with project name

This developer guide provides a comprehensive foundation for contributing to the Jackpot WLD project. Follow these guidelines to ensure high-quality, maintainable code that aligns with project standards.