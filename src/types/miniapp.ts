/**
 * Simplified MiniApp SDK Types
 * Focused on WLD wallet integration and core functionality
 */

import { ISuccessResult } from "@worldcoin/idkit";

// Core SDK Status
export type SDKStatus = "idle" | "initializing" | "ready" | "error";

// Environment Information
export interface EnvironmentInfo {
  isWorldApp: boolean;
  isDevelopment: boolean;
  isDevMode: boolean;
  hasValidAppId: boolean;
  userAgent: string;
  version: string;
}

// Wallet State
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string;
  chainId: number;
  isConnecting: boolean;
}

// World ID State
export interface WorldIDState {
  isVerified: boolean;
  proof: ISuccessResult | null;
  verificationLevel: "orb" | "device" | null;
  isVerifying: boolean;
}

// Payment State
export interface PaymentState {
  isProcessing: boolean;
  lastTransaction: string | null;
  history: PaymentTransaction[];
}

// Lottery State
export interface LotteryState {
  userDeposits: string;
  totalPool: string;
  nextDraw: Date | null;
  isEligible: boolean;
  currentOdds: string;
}

// Unified MiniApp State
export interface MiniAppState {
  // SDK Status
  isInitialized: boolean;
  isWorldApp: boolean;
  error: string | null;

  // Wallet State
  wallet: WalletState;

  // World ID State
  worldId: WorldIDState;

  // Payment State
  payment: PaymentState;

  // Lottery State
  lottery: LotteryState;

  // Environment
  environment: EnvironmentInfo;
}

// Wallet Actions
export interface WalletActions {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getBalance: () => Promise<string>;
  switchChain: (chainId: number) => Promise<void>;
}

// World ID Actions
export interface WorldIDActions {
  verify: (action: string, signal?: string) => Promise<ISuccessResult>;
  reset: () => void;
}

// Payment Actions
export interface PaymentActions {
  sendWLD: (to: string, amount: string) => Promise<string>;
  deposit: (amount: string) => Promise<string>;
  withdraw: (amount: string) => Promise<string>;
  getHistory: () => Promise<PaymentTransaction[]>;
}

// Lottery Actions
export interface LotteryActions {
  getPoolStats: () => Promise<PoolStats>;
  getUserStats: () => Promise<UserStats>;
  checkEligibility: () => Promise<boolean>;
  claimPrize: () => Promise<string>;
}

// Payment Transaction
export interface PaymentTransaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: Date;
  confirmations: number;
  memo?: string;
}

// Pool Statistics
export interface PoolStats {
  totalDeposits: string;
  totalParticipants: number;
  currentPrize: string;
  nextDrawTime: Date | null;
  lastWinner: string | null;
  totalPrizesWon: string;
}

// User Statistics
export interface UserStats {
  totalDeposited: string;
  currentBalance: string;
  prizesWon: string;
  participantSince: Date | null;
  eligibleForDraw: boolean;
  winningOdds: string;
}

// Configuration
export interface MiniAppConfig {
  appId: string;
  environment: "development" | "production";
  enableNotifications?: boolean;
  enableAnalytics?: boolean;
  autoConnect?: boolean;
}

// Event Types
export type MiniAppEvent =
  | "sdk:ready"
  | "sdk:error"
  | "wallet:connected"
  | "wallet:disconnected"
  | "wallet:chainChanged"
  | "worldid:verified"
  | "worldid:reset"
  | "payment:sent"
  | "payment:completed"
  | "payment:failed"
  | "lottery:eligibilityChanged"
  | "lottery:prizeWon";

// Event Listener
export type EventListener<T = any> = (data: T) => void;

// Error Types
export interface MiniAppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Hook Return Types
export interface UseWalletReturn extends WalletState, WalletActions {
  error: string | null;
}

export interface UseWorldIDReturn extends WorldIDState, WorldIDActions {
  error: string | null;
}

export interface UsePaymentReturn extends PaymentState, PaymentActions {
  error: string | null;
}

export interface UseLotteryReturn extends LotteryState, LotteryActions {
  error: string | null;
}

// Context Types
export interface MiniAppContextType {
  state: MiniAppState;
  actions: {
    wallet: WalletActions;
    worldId: WorldIDActions;
    payment: PaymentActions;
    lottery: LotteryActions;
  };
  addEventListener: (event: MiniAppEvent, listener: EventListener) => void;
  removeEventListener: (event: MiniAppEvent, listener: EventListener) => void;
  initialize: () => Promise<void>;
}
