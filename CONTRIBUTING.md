# Contributing to JackpotWLD

Thank you for your interest in contributing to JackpotWLD! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Security](#security)
- [Community](#community)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- **Be respectful**: Treat everyone with respect and kindness
- **Be inclusive**: Welcome newcomers and help them get started
- **Be collaborative**: Work together towards common goals
- **Be constructive**: Provide helpful feedback and suggestions
- **Be professional**: Maintain a professional tone in all interactions

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Foundry** (latest version)
- **Git**
- **World ID** account for testing

### Quick Start

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   git clone https://github.com/YOUR_USERNAME/worldcoin-pooltogether-miniapp.git
   cd worldcoin-pooltogether-miniapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   forge install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development**
   ```bash
   # Terminal 1: Start Anvil
   anvil
   
   # Terminal 2: Deploy contracts
   npm run deploy:testnet
   
   # Terminal 3: Start web app
   npm run dev
   ```

## Development Setup

### Project Structure

```
├── contracts/          # Smart contracts (Solidity)
├── script/            # Deployment scripts
├── test/              # Contract tests
├── src/               # Web application source
│   ├── components/    # React components
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Utility libraries
│   └── app/           # Next.js app router
├── public/            # Static assets
└── docs/              # Documentation
```

### Environment Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
# Required for development
NEXT_PUBLIC_WORLD_APP_ID=your_world_app_id
NEXT_PUBLIC_WORLD_ID_ACTION_ID=your_action_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key

# Optional for full functionality
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
PRIVATE_KEY=your_private_key_for_testing
```

## Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Submit bug fixes or new features
- **Documentation**: Improve or add documentation
- **Testing**: Add or improve test coverage
- **Security**: Report security vulnerabilities responsibly

### Before You Start

1. **Check existing issues**: Look for existing issues or discussions
2. **Create an issue**: For significant changes, create an issue first
3. **Discuss approach**: Get feedback on your proposed approach
4. **Assign yourself**: Assign the issue to yourself when ready to work

### Branch Naming

Use descriptive branch names:

- `feature/add-yield-farming`
- `fix/deposit-validation-bug`
- `docs/update-readme`
- `test/add-integration-tests`
- `security/fix-reentrancy-vulnerability`

## Pull Request Process

### 1. Preparation

```bash
# Create and switch to your feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Commit your changes
git add .
git commit -m "feat: add your feature description"

# Push to your fork
git push origin feature/your-feature-name
```

### 2. Pull Request Requirements

- **Clear title**: Use a descriptive title
- **Detailed description**: Explain what changes you made and why
- **Link issues**: Reference related issues with `Fixes #123`
- **Screenshots**: Include screenshots for UI changes
- **Testing**: Ensure all tests pass
- **Documentation**: Update documentation if needed

### 3. Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added new tests for changes
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings introduced
```

### 4. Review Process

1. **Automated checks**: CI/CD pipeline runs automatically
2. **Code review**: Team members review your code
3. **Feedback**: Address any feedback or requested changes
4. **Approval**: Get approval from maintainers
5. **Merge**: Your PR will be merged by maintainers

## Coding Standards

### TypeScript/JavaScript

- **ESLint**: Follow ESLint configuration
- **Prettier**: Use Prettier for code formatting
- **TypeScript**: Use TypeScript for type safety
- **Naming**: Use camelCase for variables, PascalCase for components

```typescript
// Good
const userBalance = await getBalance(userAddress);
const DepositForm: React.FC<Props> = ({ onSubmit }) => {
  // component code
};

// Bad
const user_balance = await getBalance(userAddress);
const depositForm = ({ onSubmit }) => {
  // component code
};
```

### Solidity

- **Style Guide**: Follow Solidity style guide
- **NatSpec**: Use NatSpec comments for documentation
- **Security**: Follow security best practices
- **Gas Optimization**: Consider gas efficiency

```solidity
// Good
/**
 * @notice Deposits tokens into the pool
 * @param amount The amount to deposit
 * @return success Whether the deposit was successful
 */
function deposit(uint256 amount) external returns (bool success) {
    require(amount > 0, "Amount must be positive");
    // implementation
}

// Bad
function deposit(uint256 amount) external returns (bool) {
    // implementation without documentation
}
```

### React Components

- **Functional Components**: Use functional components with hooks
- **Props Interface**: Define TypeScript interfaces for props
- **Error Boundaries**: Wrap components in error boundaries
- **Accessibility**: Follow accessibility best practices

```typescript
interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  disabled = false, 
  children 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn btn-primary"
      aria-label="Submit form"
    >
      {children}
    </button>
  );
};
```

## Testing

### Smart Contract Tests

```bash
# Run all tests
forge test

# Run specific test
forge test --match-test testDeposit

# Run with coverage
forge coverage

# Run with gas report
forge test --gas-report
```

### Web Application Tests

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Test Requirements

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **Contract Tests**: Test all contract functions and edge cases
- **Coverage**: Maintain >90% test coverage
- **Edge Cases**: Test error conditions and boundary cases

## Security

### Security Guidelines

- **Never commit secrets**: Use environment variables
- **Validate inputs**: Always validate and sanitize inputs
- **Follow best practices**: Use established security patterns
- **Report vulnerabilities**: Use responsible disclosure

### Security Checklist

- [ ] No hardcoded secrets or private keys
- [ ] Input validation implemented
- [ ] Access controls properly implemented
- [ ] Error handling doesn't leak sensitive information
- [ ] Dependencies are up to date
- [ ] Security tests included

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General discussions and questions
- **Discord**: Real-time chat and community support
- **Twitter**: Updates and announcements

### Getting Help

- **Documentation**: Check existing documentation first
- **Search Issues**: Look for similar issues or discussions
- **Ask Questions**: Don't hesitate to ask for help
- **Be Patient**: Maintainers are volunteers with limited time

### Recognition

We recognize contributors through:

- **Contributors List**: Listed in README and documentation
- **Release Notes**: Mentioned in release notes
- **Social Media**: Highlighted on social media
- **Swag**: Potential swag for significant contributions

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Schedule

- **Major releases**: Quarterly
- **Minor releases**: Monthly
- **Patch releases**: As needed
- **Security releases**: Immediately

---

## Questions?

If you have questions about contributing, please:

1. Check the [FAQ](docs/FAQ.md)
2. Search existing [issues](https://github.com/your-org/worldcoin-pooltogether-miniapp/issues)
3. Create a new [discussion](https://github.com/your-org/worldcoin-pooltogether-miniapp/discussions)
4. Join our [Discord](https://discord.gg/your-invite)

Thank you for contributing to JackpotWLD! 🎉