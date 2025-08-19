import { Address } from 'viem';

// Contract addresses - these should be updated after deployment
export const CONTRACT_ADDRESSES = {
  // Local development addresses (Anvil)
  localhost: {
    poolContract: '0x' as Address,
    prizePool: '0x' as Address,
    yieldAdapter: '0x' as Address,
    wldToken: '0x' as Address,
    worldId: '0x' as Address,
  },
  // Worldchain Sepolia testnet
  worldchainSepolia: {
    poolContract: '0x' as Address,
    prizePool: '0x' as Address,
    yieldAdapter: '0x' as Address,
    wldToken: '0x' as Address,
    worldId: '0x' as Address,
  },
  // Worldchain mainnet
  worldchain: {
    poolContract: '0x' as Address,
    prizePool: '0x' as Address,
    yieldAdapter: '0x' as Address,
    wldToken: '0x' as Address,
    worldId: '0x' as Address,
  },
} as const;

// Contract ABIs - simplified versions for frontend use
export const POOL_CONTRACT_ABI = [
  {
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'nullifierHash', type: 'uint256' },
      { name: 'proof', type: 'uint256[8]' },
    ],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTotalDeposits',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurrentAPY',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getPoolStats',
    outputs: [
      { name: 'totalDeposits', type: 'uint256' },
      { name: 'totalYield', type: 'uint256' },
      { name: 'participantCount', type: 'uint256' },
      { name: 'currentAPY', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const PRIZE_POOL_ABI = [
  {
    inputs: [],
    name: 'getCurrentPrizeAmount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getNextDrawTime',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurrentDrawId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'drawId', type: 'uint256' }],
    name: 'getDrawInfo',
    outputs: [
      { name: 'prizeAmount', type: 'uint256' },
      { name: 'winner', type: 'address' },
      { name: 'drawTime', type: 'uint256' },
      { name: 'completed', type: 'bool' },
      { name: 'participants', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const WLD_TOKEN_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Helper function to get contract addresses for current chain
export function getContractAddresses(chainId: number) {
  switch (chainId) {
    case 31337:
      return CONTRACT_ADDRESSES.localhost;
    case 4801: // Worldchain Sepolia
      return CONTRACT_ADDRESSES.worldchainSepolia;
    case 480: // Worldchain Mainnet
      return CONTRACT_ADDRESSES.worldchain;
    default:
      return CONTRACT_ADDRESSES.localhost;
  }
}