'use client';

import { useCallback, useEffect, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { isWorldApp } from '../lib/utils';
import { logger } from '../lib/logger';

// Global type declaration for MiniKit
declare global {
  interface Window {
    MiniKit?: {
      walletAddress?: string;
      [key: string]: unknown;
    };
  }
}

// MiniKit types based on official documentation
interface MiniKitWalletAuthPayload {
  status: 'success' | 'error';
  error?: string;
  message?: string;
  signature?: string;
}

interface MiniKitInstance {
  walletAddress?: string;
  isInstalled: () => boolean;
  commandsAsync?: {
    walletAuth: (params: { nonce: string }) => Promise<{ finalPayload: MiniKitWalletAuthPayload }>;
  };
}

// Status type as specified in requirements
type Status = 'idle' | 'authing' | 'ready' | 'error';

// Hook state interface
interface MiniKitWalletState {
  inWorldApp: boolean;
  status: Status;
  address?: `0x${string}`;
  error?: string;
}

// Hook return interface - matches exact requirements
interface UseMiniKitWalletReturn {
  inWorldApp: boolean;
  status: Status;
  address?: `0x${string}`;
  error?: string;
  beginAuth(): Promise<void>;
  reset(): void;
}

// Error types for better error handling
type MiniKitError = 
  | 'MiniKitUnavailable'
  | 'WalletAuthDeclined' 
  | 'NetworkError'
  | 'Unexpected';

/**
 * Custom hook for handling MiniKit wallet authentication
 * Follows the official World App MiniKit documentation for walletAuth flow
 */
export function useMiniKitWallet(): UseMiniKitWalletReturn {
  const [state, setState] = useState<MiniKitWalletState>({
    inWorldApp: false,
    status: 'idle'
  });

  // Environment detection - check if we're in World App
  const checkEnvironment = useCallback(() => {
    const inWorldApp = isWorldApp();
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
    
    // In development mode, simulate being in World App for testing
    const effectiveInWorldApp = inWorldApp || (isDevelopment && isDevMode);
    
    setState(prev => ({
      ...prev,
      inWorldApp: effectiveInWorldApp
    }));
    
    return effectiveInWorldApp;
  }, []);

  // Initialize environment check on mount
  useEffect(() => {
    checkEnvironment();
  }, [checkEnvironment]);

  // Helper function to get error type from error message
  const getErrorType = (error: unknown): MiniKitError => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('cancelled') || message.includes('declined') || message.includes('rejected')) {
        return 'WalletAuthDeclined';
      }
      if (message.includes('network') || message.includes('fetch')) {
        return 'NetworkError';
      }
      if (message.includes('minikit') || message.includes('not available') || message.includes('not installed')) {
        return 'MiniKitUnavailable';
      }
    }
    return 'Unexpected';
  };

  // Helper function to get user-friendly error message
  const getErrorMessage = (errorType: MiniKitError, originalError?: unknown): string => {
    switch (errorType) {
      case 'MiniKitUnavailable':
        return 'MiniKit is not available. Please ensure you are using the latest version of World App.';
      case 'WalletAuthDeclined':
        return 'Wallet connection was cancelled. Please try again.';
      case 'NetworkError':
        return 'Network error occurred. Please check your connection and try again.';
      case 'Unexpected':
      default:
        return originalError instanceof Error ? originalError.message : 'An unexpected error occurred. Please try again.';
    }
  };

  // Main authentication function
  const beginAuth = useCallback(async (): Promise<void> => {
    logger.walletAuth('begin', {});
    
    if (!isWorldApp()) {
      logger.walletAuth('environment_check_failed', { error: 'MiniKitUnavailable' });
      throw new Error('MiniKitUnavailable');
    }
    
    logger.walletAuth('authing', {});
    setState(prev => ({ ...prev, status: 'authing', error: undefined }));

    try {
      logger.walletAuth('fetching_nonce', {});
      const { nonce } = await (await fetch('/api/siwe/nonce')).json()
      
      logger.walletAuth('wallet_auth_request', { nonce });
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({ nonce })
      
      if (finalPayload?.status === 'error') {
        logger.walletAuth('wallet_auth_error', { error: finalPayload?.error_code });
        throw new Error(finalPayload?.error_code ?? 'WalletAuthError');
      }

      // Extract wallet address from finalPayload or fallback to MiniKit instance
      const addr = (finalPayload as { address?: string }).address || window.MiniKit?.walletAddress;
      
      if (!addr) {
        logger.walletAuth('wallet_address_missing', {});
        throw new Error('WalletAddressMissing');
      }
      
      logger.walletAuth('wallet_address_obtained', { address: addr });

      // Optional: SIWE-like verify; MiniKit returns message/signature via finalPayload if configured
      const { message, signature } = finalPayload
      if (message && signature) {
        logger.walletAuth('verifying_signature', { address: addr });
        const r = await fetch('/api/siwe/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: addr, message, signature }) })
        const v = await r.json()
        if (!v.ok) {
          logger.walletAuth('verification_failed', { address: addr });
          throw new Error('ServerVerifyFailed');
        }
        logger.walletAuth('verification_success', { address: addr });
      }

      logger.walletAuth('auth_complete', { address: addr });
      setState(prev => ({ ...prev, address: addr as `0x${string}`, status: 'ready' }));
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unexpected'
      logger.walletAuth('auth_error', { error: errorMessage, originalError: err });
      setState(prev => ({ ...prev, error: errorMessage, status: 'error' }))
    }
  }, [checkEnvironment]);

  // Reset function to clear state
  const reset = useCallback(() => {
    setState({
      inWorldApp: checkEnvironment(),
      status: 'idle'
    });
  }, [checkEnvironment]);

  return {
    ...state,
    beginAuth,
    reset
  };
}

export default useMiniKitWallet;