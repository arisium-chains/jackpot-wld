import { Address } from "viem";

export interface User {
  address: Address;
  worldIdVerified: boolean;
  depositBalance: bigint;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  lotteryEligible: boolean;
  joinedAt: number;
}

export interface PoolState {
  totalDeposits: bigint;
  totalYieldGenerated: bigint;
  currentPrizePool: bigint;
  nextDrawTime: number;
  currentAPY: number;
  totalParticipants: number;
}

export interface Transaction {
  hash: string;
  type: "deposit" | "withdraw" | "prize_won";
  amount: bigint;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
  blockNumber?: number;
}

export interface LotteryDraw {
  drawId: number;
  prizeAmount: bigint;
  winner: Address;
  participants: number;
  drawTime: number;
  randomSeed: string;
}

export interface ContractAddresses {
  poolContract: Address;
  prizePoolContract: Address;
  yieldAdapter: Address;
  wldToken: Address;
}
