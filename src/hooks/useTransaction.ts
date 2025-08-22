import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { type Address, type Hash, type Abi } from 'viem';
import {
  estimateGasWithBuffer,
  getTransactionErrorMessage,
  waitForTransactionConfirmation,
  getTransactionStatus,
  type TransactionType,
  type TransactionConfig,
  DEV_UTILS,
} from '../lib/transaction-utils';

export interface TransactionState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  txHash: Hash | null;
  gasConfig: TransactionConfig | null;
}

export interface UseTransactionOptions {
  onSuccess?: (txHash: Hash) => void;
  onError?: (error: string) => void;
  onConfirmed?: (txHash: Hash) => void;
  transactionType?: TransactionType;
  enableGasEstimation?: boolean;
}

export interface TransactionParams {
  to: Address;
  data?: `0x${string}`;
  value?: bigint;
  abi?: Abi;
  functionName?: string;
  args?: readonly unknown[];
}

/**
 * Hook for handling transactions with optimized gas settings for World Chain Sepolia
 */
export function useTransaction(options: UseTransactionOptions = {}) {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    txHash: null,
    gasConfig: null,
  });

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      txHash: null,
      gasConfig: null,
    });
  }, []);

  const estimateGas = useCallback(async (params: TransactionParams) => {
    if (!options.enableGasEstimation) return null;
    
    try {
      const gasConfig = await estimateGasWithBuffer(
        {
          to: params.to,
          data: params.data,
          value: params.value,
          from: address,
        },
        options.transactionType || 'deposit'
      );
      
      setState(prev => ({ ...prev, gasConfig }));
      return gasConfig;
    } catch (error) {
      console.warn('Gas estimation failed:', error);
      return null;
    }
  }, [address, options.enableGasEstimation, options.transactionType]);

  const executeTransaction = useCallback(async (params: TransactionParams) => {
    if (!address) {
      const error = 'Wallet not connected';
      setState(prev => ({ ...prev, isError: true, error }));
      options.onError?.(error);
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, isError: false, error: null }));

    try {
      // Estimate gas if enabled
      const gasConfig = await estimateGas(params);
      
      // Execute transaction
      const txHash = await new Promise<Hash>((resolve, reject) => {
        const baseParams = {
          address: params.to,
          abi: params.abi!,
          functionName: params.functionName!,
          args: params.args,
          value: params.value,
          ...(gasConfig && {
            gas: gasConfig.gasLimit,
            maxFeePerGas: gasConfig.maxFeePerGas,
            maxPriorityFeePerGas: gasConfig.maxPriorityFeePerGas,
          }),
        };
        
        writeContract(baseParams, {
          onSuccess: (hash) => resolve(hash),
          onError: (error) => reject(error),
        });
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        isSuccess: true,
        txHash,
      }));

      options.onSuccess?.(txHash);

      // Wait for confirmation
      const confirmed = await waitForTransactionConfirmation(txHash);
      if (confirmed) {
        options.onConfirmed?.(txHash);
      }

      return txHash;
    } catch (error) {
      const errorMessage = getTransactionErrorMessage(error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isError: true,
        error: errorMessage,
      }));
      options.onError?.(errorMessage);
      throw error;
    }
  }, [address, estimateGas, writeContract, options]);

  const getStatus = useCallback(async (txHash: Hash) => {
    return await getTransactionStatus(txHash);
  }, []);

  return {
    ...state,
    executeTransaction,
    estimateGas,
    getStatus,
    resetState,
  };
}

/**
 * Hook for monitoring transaction receipt
 */
export function useTransactionReceipt(txHash: Hash | null) {
  const { data: receipt, isLoading, isSuccess, isError } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
  });

  return {
    receipt,
    isLoading,
    isSuccess,
    isError,
    confirmed: isSuccess && receipt?.status === 'success',
    failed: isSuccess && receipt?.status === 'reverted',
  };
}

/**
 * Development mode transaction hook with mocking capabilities
 */
export function useDevTransaction(options: UseTransactionOptions = {}) {
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    txHash: null,
    gasConfig: null,
  });

  const mockTransaction = useCallback(async (params: TransactionParams, shouldFail = false) => {
    setState(prev => ({ ...prev, isLoading: true, isError: false, error: null }));

    try {
      // Simulate network delay
      await DEV_UTILS.simulateTransactionDelay(1500);

      if (shouldFail) {
        throw new Error('Mock transaction failure');
      }

      const txHash = DEV_UTILS.generateMockTxHash();
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isSuccess: true,
        txHash,
      }));

      options.onSuccess?.(txHash);

      // Simulate confirmation delay
      setTimeout(() => {
        options.onConfirmed?.(txHash);
      }, 2000);

      return txHash;
    } catch (error) {
      const errorMessage = getTransactionErrorMessage(error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isError: true,
        error: errorMessage,
      }));
      options.onError?.(errorMessage);
      throw error;
    }
  }, [options]);

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      txHash: null,
      gasConfig: null,
    });
  }, []);

  return {
    ...state,
    executeTransaction: mockTransaction,
    resetState,
  };
}

/**
 * Utility hook to determine which transaction hook to use based on environment
 */
export function useSmartTransaction(options: UseTransactionOptions = {}) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const realTransaction = useTransaction(options);
  const devTransaction = useDevTransaction(options);

  return isDevelopment ? devTransaction : realTransaction;
}