import { Address } from 'viem';

// User types
export interface User {
  address: Address;
  isVerified: boolean;
  balance: bigint;
  wldBalance: bigint;
  allowance: bigint;
}

// Pool types
export interface PoolStats {
  totalDeposits: bigint;
  totalYield: bigint;
  participantCount: bigint;
  currentAPY: bigint;
}

// Prize Pool types
export interface DrawInfo {
  prizeAmount: bigint;
  winner: Address;
  drawTime: bigint;
  completed: boolean;
  participants: bigint;
}

export interface PrizePoolData {
  currentPrizeAmount: bigint;
  nextDrawTime: bigint;
  currentDrawId: bigint;
  drawInfo?: DrawInfo;
}

// Transaction types
export interface TransactionState {
  hash?: `0x${string}`;
  isPending: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  error?: Error | null;
}

// World ID types
export interface WorldIDProof {
  nullifier_hash: string;
  merkle_root: string;
  proof: string;
  verification_level: 'orb' | 'device';
}

export interface VerificationResult {
  success: boolean;
  proof?: WorldIDProof;
  error?: string;
}

// Component props types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface DepositFormData {
  amount: string;
  isVerified: boolean;
}

export interface WithdrawFormData {
  amount: string;
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Chain configuration
export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
}

// Contract addresses by chain
export interface ContractAddresses {
  poolContract: Address;
  prizePool: Address;
  yieldAdapter: Address;
  wldToken: Address;
  worldId: Address;
}
