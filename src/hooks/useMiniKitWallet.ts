'use client';

import { useCallback, useEffect, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';

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
  error?: {
    message?: string;
  };
}

interface MiniKitInstance {
  walletAddress?: string;
  isInstalled: () => boolean;
  commandsAsync?: {
    walletAuth: (params: { nonce: string }) => Promise<{ finalPayload: MiniKitWalletAuthPayload }>;
  };
}

// Hook state interface
interface MiniKitWalletState {
  inWorldApp: boolean;
  status: 'idle' | 'authing' | 'ready' | 'error';
  address?: string;
  error?: string;
}

// Hook return interface
interface UseMiniKitWalletReturn extends MiniKitWalletState {
  beginAuth: () => Promise<void>;
  reset: () => void;
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
    const inWorldApp = typeof window !== 'undefined' && !!window.MiniKit;
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
    // Check environment first
    const isInWorldApp = checkEnvironment();
    if (!isInWorldApp) {
      setState(prev => ({
        ...prev,
        status: 'error',
        error: 'This app must be opened in World App to connect wallet'
      }));
      return;
    }

    setState(prev => ({ ...prev, status: 'authing', error: undefined }));

    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

      // Development mode - use mock authentication
      if (isDevelopment && isDevMode) {
        console.log('🔧 Development mode: Using mock wallet authentication');
        
        // Simulate the full SIWE authentication flow
        const nonceResponse = await fetch('/api/auth/nonce');
        if (!nonceResponse.ok) {
          throw new Error('Failed to generate nonce');
        }
        const { nonce } = await nonceResponse.json();
        
        // Mock SIWE message
        const domain = window.location.host;
        const uri = window.location.origin;
        const mockAddress = '0x1234567890123456789012345678901234567890';
        const statement = 'Sign in to JackpotWLD to access your account';
        const version = '1';
        const chainId = '480'; // Worldchain mainnet
        const issuedAt = new Date().toISOString();
        const expirationTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        
        const siweMessage = `${domain} wants you to sign in with your Ethereum account:\n${mockAddress}\n\n${statement}\n\nURI: ${uri}\nVersion: ${version}\nChain ID: ${chainId}\nNonce: ${nonce}\nIssued At: ${issuedAt}\nExpiration Time: ${expirationTime}`;
        
        // Mock signature
        const mockSignature = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234';
        
        // Verify with backend
        const verifyResponse = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: siweMessage,
            signature: mockSignature,
            address: mockAddress,
            nonce: nonce
          })
        });
        
        if (!verifyResponse.ok) {
          throw new Error('Mock signature verification failed');
        }
        
        const verifyResult = await verifyResponse.json();
        if (!verifyResult.success) {
          throw new Error(verifyResult.message || 'Mock verification failed');
        }
        
        console.log('✅ Mock wallet connected:', mockAddress);
        setState({
          inWorldApp: true,
          status: 'ready',
          address: mockAddress
        });
        return;
      }

      // Production mode - use real MiniKit
      if (!MiniKit.isInstalled()) {
        throw new Error('MiniKit is not properly installed. Please ensure you are using the latest version of World App.');
      }

      if (!MiniKit.commandsAsync?.walletAuth) {
        throw new Error('Wallet authentication is not available. Please update your World App.');
      }

      console.log('🔗 Starting MiniKit wallet authentication...');
      
      // Step 1: Generate nonce from backend
      const nonceResponse = await fetch('/api/auth/nonce');
      if (!nonceResponse.ok) {
        const errorData = await nonceResponse.json();
        throw new Error(errorData.message || 'Nonce generation failed');
      }
      const { nonce } = await nonceResponse.json();
      
      console.log('📝 Generated nonce for SIWE authentication');
      
      // Step 2: Call walletAuth with nonce (following official docs)
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({ nonce });
      
      console.log('📱 Received walletAuth response:', finalPayload);
      
      // Step 3: Check if authentication was successful
      if (finalPayload?.status === 'error') {
        throw new Error('Wallet authentication failed');
      }
      
      if (finalPayload?.status !== 'success') {
        throw new Error('Wallet authentication was not successful');
      }
      
      // Step 4: Get wallet address from MiniKit (per official docs)
      const walletAddress = window.MiniKit?.walletAddress ?? (MiniKit as MiniKitInstance).walletAddress;
      
      if (!walletAddress) {
        throw new Error('Wallet address not available after authentication');
      }
      
      console.log('✅ MiniKit wallet connected:', walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4));
      
      setState({
        inWorldApp: true,
        status: 'ready',
        address: walletAddress
      });
      
    } catch (error) {
      console.error('❌ Wallet authentication failed:', error);
      
      const errorType = getErrorType(error);
      const errorMessage = getErrorMessage(errorType, error);
      
      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }));
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