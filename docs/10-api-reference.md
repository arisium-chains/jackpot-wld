# API Reference

## Authentication API

### Overview

The Authentication API provides secure user authentication and session management for the Jackpot WLD application. It integrates with both traditional wallet-based authentication and World ID verification.

### Base URL

```
Production: https://your-domain.vercel.app/api
Development: http://localhost:3000/api
```

### Authentication Endpoints

#### Sign-In with Ethereum

**Endpoint**: `POST /api/auth/siwe`

**Description**: Authenticate users using Ethereum wallet signatures following the Sign-In with Ethereum (SIWE) standard.

**Request Body**:

```typescript
interface SiweRequest {
  message: string; // SIWE message
  signature: string; // Wallet signature
  address: string; // Ethereum address
  chainId: number; // Network chain ID
}
```

**Example Request**:

```json
{
  "message": "localhost:3000 wants you to sign in with your Ethereum account:\n0x742d35Cc6aC3B2A2ed6C9431Cc68B8c2C2D9f4Ed\n\nSign in to Jackpot WLD\n\nURI: http://localhost:3000\nVersion: 1\nChain ID: 31337\nNonce: K7dvKU3T5qJlW8nS2\nIssued At: 2024-08-24T10:30:00.000Z",
  "signature": "0x...",
  "address": "0x742d35Cc6aC3B2A2ed6C9431Cc68B8c2C2D9f4Ed",
  "chainId": 31337
}
```

**Response**:

```typescript
interface SiweResponse {
  success: boolean;
  user: {
    address: string;
    verified: boolean;
    sessionId: string;
  };
  error?: string;
}
```

**Status Codes**:

- `200 OK` - Authentication successful
- `400 Bad Request` - Invalid request format
- `401 Unauthorized` - Invalid signature or message
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

#### Session Validation

**Endpoint**: `GET /api/auth/session`

**Description**: Validate and retrieve current user session information.

**Headers**:

```
Authorization: Bearer <session_token>
```

**Response**:

```typescript
interface SessionResponse {
  success: boolean;
  user?: {
    address: string;
    verified: boolean;
    sessionId: string;
    expiresAt: string;
  };
  error?: string;
}
```

#### Logout

**Endpoint**: `POST /api/auth/logout`

**Description**: Invalidate user session and clear authentication state.

**Headers**:

```
Authorization: Bearer <session_token>
```

**Response**:

```typescript
interface LogoutResponse {
  success: boolean;
  message: string;
}
```

## World ID Verification API

### Overview

The World ID Verification API handles privacy-preserving identity verification using World ID's zero-knowledge proof system.

### Verification Endpoints

#### Verify World ID Proof

**Endpoint**: `POST /api/worldid/verify`

**Description**: Verify a World ID proof and register the user as verified in the system.

**Request Body**:

```typescript
interface WorldIdVerifyRequest {
  merkle_root: string; // Merkle root from World ID
  nullifier_hash: string; // Nullifier hash to prevent double verification
  proof: string; // Zero-knowledge proof
  verification_level: string; // Verification level (orb or device)
  action: string; // Action identifier
  signal: string; // Signal (usually user address)
}
```

**Example Request**:

```json
{
  "merkle_root": "0x1234567890abcdef...",
  "nullifier_hash": "0xabcdef1234567890...",
  "proof": "0x987654321fedcba0...",
  "verification_level": "orb",
  "action": "lottery_participation",
  "signal": "0x742d35Cc6aC3B2A2ed6C9431Cc68B8c2C2D9f4Ed"
}
```

**Response**:

```typescript
interface WorldIdVerifyResponse {
  success: boolean;
  verified: boolean;
  nullifier_hash: string;
  user_address: string;
  verification_level: string;
  timestamp: string;
  error?: string;
}
```

**Status Codes**:

- `200 OK` - Verification successful
- `400 Bad Request` - Invalid proof or request format
- `409 Conflict` - Nullifier already used
- `422 Unprocessable Entity` - Proof verification failed
- `500 Internal Server Error` - Server error

#### Check Verification Status

**Endpoint**: `GET /api/worldid/status/{address}`

**Description**: Check if a user address has completed World ID verification.

**Parameters**:

- `address` (string): Ethereum address to check

**Response**:

```typescript
interface VerificationStatusResponse {
  success: boolean;
  address: string;
  verified: boolean;
  verification_level?: string;
  verified_at?: string;
  error?: string;
}
```

## Smart Contract Interaction API

### Contract Configuration

#### Get Contract Addresses

**Endpoint**: `GET /api/contracts/addresses`

**Description**: Retrieve current smart contract addresses for the active network.

**Response**:

```typescript
interface ContractAddressesResponse {
  success: boolean;
  network: string;
  chainId: number;
  contracts: {
    poolContract: string;
    prizePool: string;
    vrfConsumer: string;
    yieldAdapter: string;
    wldToken: string;
    worldId: string;
  };
  deployedAt: string;
}
```

#### Get Contract ABI

**Endpoint**: `GET /api/contracts/abi/{contractName}`

**Description**: Retrieve ABI for a specific contract.

**Parameters**:

- `contractName` (string): Name of the contract (poolContract, prizePool, etc.)

**Response**:

```typescript
interface ContractAbiResponse {
  success: boolean;
  contractName: string;
  abi: any[];
  error?: string;
}
```

### Pool Statistics

#### Get Pool Statistics

**Endpoint**: `GET /api/pool/stats`

**Description**: Retrieve comprehensive statistics about the lottery pool.

**Response**:

```typescript
interface PoolStatsResponse {
  success: boolean;
  stats: {
    totalDeposits: string; // Total deposits in wei
    totalYieldGenerated: string; // Total yield generated in wei
    participantCount: number; // Number of participants
    currentAPY: number; // Current APY percentage
    nextDrawTime: string; // ISO timestamp of next draw
    currentPrize: string; // Current prize amount in wei
    lastDrawTime: string; // ISO timestamp of last draw
    totalDraws: number; // Total number of draws executed
  };
  error?: string;
}
```

#### Get User Account Information

**Endpoint**: `GET /api/pool/account/{address}`

**Description**: Retrieve account information for a specific user.

**Parameters**:

- `address` (string): Ethereum address

**Response**:

```typescript
interface UserAccountResponse {
  success: boolean;
  address: string;
  account: {
    balance: string; // User balance in wei
    verified: boolean; // World ID verification status
    participatingInLottery: boolean;
    depositCount: number;
    totalDeposited: string; // Total amount deposited in wei
    totalWithdrawn: string; // Total amount withdrawn in wei
    lastActivity: string; // ISO timestamp of last activity
    joinedAt: string; // ISO timestamp when user joined
  };
  error?: string;
}
```

### Transaction History

#### Get Transaction History

**Endpoint**: `GET /api/transactions/history`

**Description**: Retrieve transaction history with pagination and filtering.

**Query Parameters**:

- `address` (string, optional): Filter by user address
- `type` (string, optional): Filter by transaction type (deposit, withdraw, draw)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `startDate` (string, optional): Start date filter (ISO format)
- `endDate` (string, optional): End date filter (ISO format)

**Response**:

```typescript
interface TransactionHistoryResponse {
  success: boolean;
  transactions: Array<{
    id: string;
    hash: string;
    type: "deposit" | "withdraw" | "draw" | "harvest";
    user: string;
    amount: string;
    timestamp: string;
    status: "pending" | "confirmed" | "failed";
    blockNumber: number;
    gasUsed: string;
    metadata?: any;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: string;
}
```

### Lottery Draws

#### Get Draw History

**Endpoint**: `GET /api/draws/history`

**Description**: Retrieve lottery draw history.

**Query Parameters**:

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 50)

**Response**:

```typescript
interface DrawHistoryResponse {
  success: boolean;
  draws: Array<{
    id: string;
    drawNumber: number;
    winner: string;
    prizeAmount: string;
    participantCount: number;
    vrfRequestId: string;
    randomSeed: string;
    timestamp: string;
    blockNumber: number;
    transactionHash: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}
```

#### Get Current Draw Status

**Endpoint**: `GET /api/draws/current`

**Description**: Get information about the current or next lottery draw.

**Response**:

```typescript
interface CurrentDrawResponse {
  success: boolean;
  draw: {
    status: "pending" | "in_progress" | "completed";
    nextDrawTime: string;
    currentPrize: string;
    participantCount: number;
    estimatedDrawTime: string;
    vrfRequestId?: string;
    canDraw: boolean;
    drawConditions: {
      minimumPrize: boolean;
      minimumParticipants: boolean;
      timeInterval: boolean;
    };
  };
  error?: string;
}
```

## WebSocket API

### Real-time Events

#### Connection

```javascript
const ws = new WebSocket("wss://your-domain.vercel.app/api/ws");

ws.on("open", () => {
  console.log("Connected to WebSocket");
});

ws.on("message", (data) => {
  const event = JSON.parse(data);
  handleEvent(event);
});
```

#### Event Types

**New Deposit Event**:

```typescript
interface DepositEvent {
  type: "deposit";
  data: {
    user: string;
    amount: string;
    newBalance: string;
    totalDeposits: string;
    timestamp: string;
  };
}
```

**New Withdrawal Event**:

```typescript
interface WithdrawEvent {
  type: "withdraw";
  data: {
    user: string;
    amount: string;
    newBalance: string;
    totalDeposits: string;
    timestamp: string;
  };
}
```

**Draw Initiated Event**:

```typescript
interface DrawInitiatedEvent {
  type: "draw_initiated";
  data: {
    drawId: string;
    vrfRequestId: string;
    participantCount: number;
    prizeAmount: string;
    timestamp: string;
  };
}
```

**Draw Completed Event**:

```typescript
interface DrawCompletedEvent {
  type: "draw_completed";
  data: {
    drawId: string;
    winner: string;
    prizeAmount: string;
    participantCount: number;
    randomSeed: string;
    timestamp: string;
  };
}
```

## Error Handling

### Standard Error Response

All API endpoints return errors in a consistent format:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}
```

### Common Error Codes

#### Authentication Errors

- `AUTH_INVALID_SIGNATURE` - Invalid wallet signature
- `AUTH_EXPIRED_SESSION` - Session has expired
- `AUTH_RATE_LIMITED` - Too many authentication attempts

#### World ID Errors

- `WORLDID_INVALID_PROOF` - Invalid World ID proof
- `WORLDID_NULLIFIER_USED` - Nullifier already used
- `WORLDID_VERIFICATION_FAILED` - Proof verification failed

#### Contract Errors

- `CONTRACT_PAUSED` - Contract is paused
- `CONTRACT_INSUFFICIENT_BALANCE` - Insufficient user balance
- `CONTRACT_USER_NOT_VERIFIED` - User not verified with World ID

#### General Errors

- `INVALID_REQUEST` - Invalid request format
- `RATE_LIMITED` - Rate limit exceeded
- `INTERNAL_ERROR` - Internal server error
- `NETWORK_ERROR` - Blockchain network error

### Rate Limiting

All API endpoints are subject to rate limiting:

- **Authentication endpoints**: 10 requests per minute per IP
- **Verification endpoints**: 5 requests per minute per IP
- **Data endpoints**: 100 requests per minute per IP
- **WebSocket connections**: 1 connection per IP

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1692876000
```

## SDK Integration

### JavaScript/TypeScript SDK

#### Installation

```bash
npm install @jackpot-wld/sdk
```

#### Basic Usage

```typescript
import { JackpotWLDSDK } from "@jackpot-wld/sdk";

const sdk = new JackpotWLDSDK({
  apiUrl: "https://your-domain.vercel.app/api",
  chainId: 1,
  worldIdAppId: "your_app_id",
});

// Authenticate user
const session = await sdk.auth.signInWithEthereum(wallet);

// Verify with World ID
const verification = await sdk.worldId.verify(proof);

// Get pool stats
const stats = await sdk.pool.getStats();

// Get user account
const account = await sdk.pool.getAccount(address);
```

This API reference provides comprehensive documentation for all available endpoints and integration methods for the Jackpot WLD system.
