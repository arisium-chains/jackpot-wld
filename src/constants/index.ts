import { Address } from "viem";

// Contract addresses (will be updated after deployment)
export const CONTRACT_ADDRESSES = {
  POOL_CONTRACT: "0x0000000000000000000000000000000000000000" as Address,
  PRIZE_POOL_CONTRACT: "0x0000000000000000000000000000000000000000" as Address,
  YIELD_ADAPTER: "0x0000000000000000000000000000000000000000" as Address,
  WLD_TOKEN: "0x163f8C2467924be0ae7B5347228CABF260318753" as Address, // WLD token on Worldchain
};

// Chain configurations
export const SUPPORTED_CHAINS = {
  WORLDCHAIN: {
    id: 480,
    name: "World Chain",
    rpcUrl: "https://worldchain-mainnet.g.alchemy.com/v2/",
    blockExplorer: "https://worldchain.blockscout.com",
  },
  WORLDCHAIN_SEPOLIA: {
    id: 4801,
    name: "World Chain Sepolia",
    rpcUrl: "https://worldchain-sepolia.g.alchemy.com/v2/",
    blockExplorer: "https://worldchain-sepolia.blockscout.com",
  },
  LOCAL: {
    id: 31337,
    name: "Local Anvil",
    rpcUrl: "http://localhost:8545",
    blockExplorer: "http://localhost:8545",
  },
};

// World App configuration
export const WORLD_APP_CONFIG = {
  APP_ID: process.env.NEXT_PUBLIC_WORLD_APP_ID || "",
  ACTION_ID: process.env.NEXT_PUBLIC_WORLD_ID_ACTION_ID || "",
  ENABLE_TELEMETRY: true,
};

// Application constants
export const APP_CONSTANTS = {
  LOTTERY_DRAW_INTERVAL: 24 * 60 * 60, // 24 hours in seconds
  MIN_DEPOSIT_AMOUNT: BigInt("1000000000000000000"), // 1 WLD
  MAX_DEPOSIT_AMOUNT: BigInt("1000000000000000000000"), // 1000 WLD
  DECIMALS: 18,
  REFRESH_INTERVAL: 30000, // 30 seconds
};

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "Please connect your wallet",
  WORLD_ID_NOT_VERIFIED: "Please verify your World ID first",
  INSUFFICIENT_BALANCE: "Insufficient WLD balance",
  AMOUNT_TOO_LOW: "Amount must be greater than minimum deposit",
  AMOUNT_TOO_HIGH: "Amount exceeds maximum deposit limit",
  TRANSACTION_FAILED: "Transaction failed. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
};
