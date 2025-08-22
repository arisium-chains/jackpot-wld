import { parseGwei, type Address, type Hash } from 'viem';
import { worldchainSepolia } from 'wagmi/chains';
import { config } from './wagmi';
import { getPublicClient } from '@wagmi/core';

/**
 * Gas configuration for World Chain Sepolia testnet
 * These values are optimized for testnet usage with reasonable safety margins
 */
export const TESTNET_GAS_CONFIG = {
  // Base gas prices for World Chain Sepolia (in gwei)
  maxFeePerGas: parseGwei('2.5'), // Higher ceiling for testnet
  maxPriorityFeePerGas: parseGwei('1.5'), // Priority fee for faster inclusion
  
  // Gas limits for common operations
  gasLimits: {
    deposit: BigInt(150_000), // ERC20 transfer + contract interaction
    withdraw: BigInt(200_000), // More complex withdrawal logic
    approval: BigInt(50_000), // Standard ERC20 approval
    worldIdVerification: BigInt(100_000), // World ID verification overhead
    lottery: BigInt(250_000), // Lottery operations (drawing, claiming)
  },
  
  // Safety multipliers
  gasLimitMultiplier: 1.2, // 20% buffer for gas limit estimation
  gasPriceMultiplier: 1.1, // 10% buffer for gas price fluctuations
} as const;

/**
 * Transaction configuration for different operation types
 */
export type TransactionType = 'deposit' | 'withdraw' | 'approval' | 'worldIdVerification' | 'lottery';

export interface TransactionConfig {
  gasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

export interface EstimateGasParams {
  to: Address;
  data?: `0x${string}`;
  value?: bigint;
  from?: Address;
}

/**
 * Get optimized transaction configuration for World Chain Sepolia
 */
export function getTransactionConfig(type: TransactionType): TransactionConfig {
  const baseConfig = TESTNET_GAS_CONFIG;
  
  return {
    gasLimit: baseConfig.gasLimits[type],
    maxFeePerGas: baseConfig.maxFeePerGas,
    maxPriorityFeePerGas: baseConfig.maxPriorityFeePerGas,
  };
}

/**
 * Estimate gas for a transaction with safety buffers
 */
export async function estimateGasWithBuffer(
  params: EstimateGasParams,
  type: TransactionType = 'deposit'
): Promise<TransactionConfig> {
  try {
    const publicClient = getPublicClient(config, { chainId: worldchainSepolia.id });
    
    if (!publicClient) {
      throw new Error('Public client not available');
    }

    // Estimate gas limit
    const estimatedGas = await publicClient.estimateGas({
      account: params.from,
      to: params.to,
      data: params.data,
      value: params.value,
    });

    // Apply safety buffer to estimated gas
    const gasLimit = BigInt(
      Math.ceil(Number(estimatedGas) * TESTNET_GAS_CONFIG.gasLimitMultiplier)
    );

    // Get current gas price from network
    const gasPrice = await publicClient.getGasPrice();
    
    // Apply buffer to gas price
    const bufferedGasPrice = BigInt(
      Math.ceil(Number(gasPrice) * TESTNET_GAS_CONFIG.gasPriceMultiplier)
    );

    return {
      gasLimit,
      maxFeePerGas: bufferedGasPrice,
      maxPriorityFeePerGas: TESTNET_GAS_CONFIG.maxPriorityFeePerGas,
    };
  } catch (error) {
    console.warn('Gas estimation failed, using fallback config:', error);
    
    // Fallback to predefined configuration
    return getTransactionConfig(type);
  }
}

/**
 * Format gas price for display (in gwei)
 */
export function formatGasPrice(gasPrice: bigint): string {
  const gwei = Number(gasPrice) / 1e9;
  return `${gwei.toFixed(2)} gwei`;
}

/**
 * Calculate estimated transaction cost in ETH
 */
export function calculateTransactionCost(gasLimit: bigint, gasPrice: bigint): string {
  const costWei = gasLimit * gasPrice;
  const costEth = Number(costWei) / 1e18;
  return costEth.toFixed(6);
}

/**
 * Check if gas price is reasonable for testnet
 */
export function isReasonableGasPrice(gasPrice: bigint): boolean {
  const maxReasonablePrice = parseGwei('10'); // 10 gwei max for testnet
  return gasPrice <= maxReasonablePrice;
}

/**
 * Wait for transaction confirmation with timeout
 */
export async function waitForTransactionConfirmation(
  hash: Hash,
  confirmations: number = 1,
  timeout: number = 60000 // 60 seconds
): Promise<boolean> {
  const publicClient = getPublicClient(config, { chainId: worldchainSepolia.id });
  
  if (!publicClient) {
    throw new Error('Public client not available');
  }

  try {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations,
      timeout,
    });
    
    return receipt.status === 'success';
  } catch (error) {
    console.error('Transaction confirmation failed:', error);
    return false;
  }
}

/**
 * Get transaction status and details
 */
export async function getTransactionStatus(hash: Hash) {
  const publicClient = getPublicClient(config, { chainId: worldchainSepolia.id });
  
  if (!publicClient) {
    throw new Error('Public client not available');
  }

  try {
    const [transaction, receipt] = await Promise.all([
      publicClient.getTransaction({ hash }),
      publicClient.getTransactionReceipt({ hash }).catch(() => null),
    ]);

    return {
      transaction,
      receipt,
      status: receipt ? (receipt.status === 'success' ? 'confirmed' : 'failed') : 'pending',
      gasUsed: receipt?.gasUsed,
      effectiveGasPrice: receipt?.effectiveGasPrice,
    };
  } catch (error) {
    console.error('Failed to get transaction status:', error);
    return null;
  }
}

/**
 * Error handling for common transaction failures
 */
export function getTransactionErrorMessage(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes('insufficient funds')) {
    return 'Insufficient funds for transaction. Please ensure you have enough ETH for gas fees.';
  }
  
  if (errorMessage.includes('gas too low')) {
    return 'Gas limit too low. Please try again with a higher gas limit.';
  }
  
  if (errorMessage.includes('nonce too low')) {
    return 'Transaction nonce error. Please refresh and try again.';
  }
  
  if (errorMessage.includes('replacement transaction underpriced')) {
    return 'Transaction replacement failed. Please wait for the current transaction to complete.';
  }
  
  if (errorMessage.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  return 'Transaction failed. Please try again.';
}

/**
 * Development mode transaction utilities
 */
export const DEV_UTILS = {
  /**
   * Mock transaction hash for development
   */
  generateMockTxHash(): Hash {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return `0x${Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('')}` as Hash;
  },
  
  /**
   * Simulate transaction delay for development
   */
  async simulateTransactionDelay(ms: number = 2000): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  },
  
  /**
   * Mock transaction receipt
   */
  createMockReceipt(hash: Hash, success: boolean = true) {
    return {
      transactionHash: hash,
      status: success ? 'success' as const : 'reverted' as const,
      blockNumber: BigInt(Math.floor(Math.random() * 1000000) + 1000000),
      gasUsed: BigInt(Math.floor(Math.random() * 100000) + 50000),
      effectiveGasPrice: parseGwei('2'),
    };
  },
};