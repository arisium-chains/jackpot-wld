// App Configuration
export const APP_NAME = 'JackpotWLD';
export const APP_DESCRIPTION = 'Earn yield and win prizes with World ID verification on Worldchain';

// World ID Configuration
export const WORLD_APP_ID = process.env.NEXT_PUBLIC_WORLD_APP_ID || '';
export const WORLD_ID_ACTION_ID = process.env.NEXT_PUBLIC_WORLD_ID_ACTION_ID || '';
export const WORLDID_ENABLED = process.env.NEXT_PUBLIC_WORLDID_ENABLED === 'true';

// Chain IDs
export const CHAIN_IDS = {
  LOCALHOST: 31337,
  WORLDCHAIN_SEPOLIA: 4801,
  WORLDCHAIN_MAINNET: 480,
} as const;

// Token Configuration
export const WLD_DECIMALS = 18;
export const MIN_DEPOSIT_AMOUNT = BigInt(1e18); // 1 WLD
export const MAX_DEPOSIT_AMOUNT = BigInt(1000e18); // 1000 WLD

// Contract Addresses are now loaded dynamically from addresses.json
// Use getContractAddresses() or getContractAddressesSync() from @/lib/contracts

// UI Constants
export const REFRESH_INTERVAL = 30000; // 30 seconds
export const TRANSACTION_TIMEOUT = 300000; // 5 minutes

// Prize Pool Constants
export const DRAW_INTERVAL_HOURS = 24;
export const MIN_PARTICIPANTS_FOR_DRAW = 2;

// Format helpers
export const formatWLD = (amount: bigint): string => {
  return (Number(amount) / 1e18).toFixed(4);
};

export const formatAPY = (apy: bigint): string => {
  return (Number(apy) / 100).toFixed(2) + '%';
};

export const formatTimeRemaining = (timestamp: number): string => {
  const now = Date.now() / 1000;
  const remaining = timestamp - now;
  
  if (remaining <= 0) return 'Draw ready!';
  
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
