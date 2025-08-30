import { Address } from 'viem';

// Import ABIs from centralized location
import PoolContractABI from '../abi/PoolContract.json';
import PrizePoolABI from '../abi/PrizePool.json';
import MockWLDABI from '../abi/MockWLD.json';

// Contract addresses interface
export interface ContractAddresses {
  chainId: number;
  poolContract: Address;
  prizePool: Address;
  yieldAdapter: Address;
  wldToken: Address;
  worldIdRouter: Address;
  vrfCoordinator?: Address;
  vrfAdapter: Address;
  yieldAdapterFactory: Address;
}

// Load addresses from addresses.json
async function loadDeployedAddresses(): Promise<ContractAddresses | null> {
  if (typeof window === 'undefined') return null; // Server-side
  
  try {
    const response = await fetch('/addresses.json');
    if (!response.ok) return null;
    
    const data = await response.json();
    const contracts = data.contracts || data; // Support both new and legacy format
    
    return {
      chainId: data.chainId,
      poolContract: (contracts.Pool || contracts.poolContract) as Address,
      prizePool: (contracts.Prize || contracts.prizePool) as Address,
      yieldAdapter: (contracts.YieldAdapter || contracts.yieldAdapter) as Address,
      wldToken: (contracts.WLD || contracts.wldToken) as Address,
      worldIdRouter: contracts.worldIdRouter as Address,
      vrfCoordinator: contracts.vrfCoordinator as Address,
      vrfAdapter: contracts.vrfAdapter as Address,
      yieldAdapterFactory: contracts.yieldAdapterFactory as Address,
    };
  } catch (error) {
    console.warn('Failed to load addresses.json:', error);
    return null;
  }
}

// Fallback contract addresses from environment variables
const FALLBACK_ADDRESSES = {
  // Local development addresses (Anvil)
  localhost: {
    chainId: 31337,
    poolContract: (
      process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS || '0x'
    ) as Address,
    prizePool: (
      process.env.NEXT_PUBLIC_PRIZE_POOL_CONTRACT_ADDRESS ||
      process.env.NEXT_PUBLIC_PRIZE_POOL_ADDRESS ||
      '0x'
    ) as Address,
    yieldAdapter: (process.env.NEXT_PUBLIC_YIELD_ADAPTER_ADDRESS || '0x') as Address,
    wldToken: (process.env.NEXT_PUBLIC_WLD_TOKEN_ADDRESS || '0x') as Address,
    worldIdRouter: (process.env.NEXT_PUBLIC_WORLD_ID_ROUTER_ADDRESS || '0x') as Address,
    vrfAdapter: (process.env.NEXT_PUBLIC_VRF_ADAPTER_ADDRESS || '0x') as Address,
    yieldAdapterFactory: (process.env.NEXT_PUBLIC_YIELD_ADAPTER_FACTORY_ADDRESS || '0x') as Address,
  },
  // Worldchain Sepolia testnet
  worldchainSepolia: {
    chainId: 4801,
    poolContract: (
      process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS || '0x'
    ) as Address,
    prizePool: (
      process.env.NEXT_PUBLIC_PRIZE_POOL_CONTRACT_ADDRESS ||
      process.env.NEXT_PUBLIC_PRIZE_POOL_ADDRESS ||
      '0x'
    ) as Address,
    yieldAdapter: (process.env.NEXT_PUBLIC_YIELD_ADAPTER_ADDRESS || '0x') as Address,
    wldToken: (process.env.NEXT_PUBLIC_WLD_TOKEN_ADDRESS || '0x') as Address,
    worldIdRouter: (process.env.NEXT_PUBLIC_WORLD_ID_ROUTER_ADDRESS || '0x') as Address,
    vrfAdapter: (process.env.NEXT_PUBLIC_VRF_ADAPTER_ADDRESS || '0x') as Address,
    yieldAdapterFactory: (process.env.NEXT_PUBLIC_YIELD_ADAPTER_FACTORY_ADDRESS || '0x') as Address,
  },
  // Worldchain mainnet
  worldchain: {
    chainId: 480,
    poolContract: (process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS || '0x') as Address,
    prizePool: (process.env.NEXT_PUBLIC_PRIZE_POOL_ADDRESS || '0x') as Address,
    yieldAdapter: (process.env.NEXT_PUBLIC_YIELD_ADAPTER_ADDRESS || '0x') as Address,
    wldToken: (process.env.NEXT_PUBLIC_WLD_TOKEN_ADDRESS || '0x') as Address,
    worldIdRouter: (process.env.NEXT_PUBLIC_WORLD_ID_ROUTER_ADDRESS || '0x') as Address,
    vrfAdapter: (process.env.NEXT_PUBLIC_VRF_ADAPTER_ADDRESS || '0x') as Address,
    yieldAdapterFactory: (process.env.NEXT_PUBLIC_YIELD_ADAPTER_FACTORY_ADDRESS || '0x') as Address,
  },
} as const;

// Contract ABIs - simplified versions for frontend use
// Export ABIs from centralized location
export const POOL_CONTRACT_ABI = PoolContractABI.abi;

export const PRIZE_POOL_ABI = PrizePoolABI.abi;

export const WLD_TOKEN_ABI = MockWLDABI.abi;

// Helper function to get contract addresses for current chain
export async function getContractAddresses(chainId: number): Promise<ContractAddresses> {
  // Try to load from addresses.json first
  const deployedAddresses = await loadDeployedAddresses();
  if (deployedAddresses) {
    return deployedAddresses;
  }
  
  // Fallback to environment variables
  switch (chainId) {
    case 31337:
      return FALLBACK_ADDRESSES.localhost;
    case 4801: // Worldchain Sepolia
      return FALLBACK_ADDRESSES.worldchainSepolia;
    case 480: // Worldchain Mainnet
      return FALLBACK_ADDRESSES.worldchain;
    default:
      return FALLBACK_ADDRESSES.localhost;
  }
}

// Synchronous version for cases where async is not possible
export function getContractAddressesSync(chainId: number): ContractAddresses {
  switch (chainId) {
    case 31337:
      return FALLBACK_ADDRESSES.localhost;
    case 4801: // Worldchain Sepolia
      return FALLBACK_ADDRESSES.worldchainSepolia;
    case 480: // Worldchain Mainnet
      return FALLBACK_ADDRESSES.worldchain;
    default:
      return FALLBACK_ADDRESSES.localhost;
  }
}
