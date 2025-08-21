'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useMiniKit } from '@/providers';

// Define our own types based on expected MiniKit response structure
interface WalletAuthSuccess {
  status: 'success';
  message?: string;
  siwe_message?: string;
  signature: string;
  address: string;
}

interface WalletAuthError {
  status: 'error';
  details?: string;
  error_message?: string;
}

type AuthResult = WalletAuthSuccess | WalletAuthError | null;

interface WalletState {
  isConnected: boolean;
  address: string | null;
  isLoading: boolean;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
  isInWorldApp: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    isLoading: false
  });
  const [error, setError] = useState<string | null>(null);
  
  // Check if running in World App using the MiniKitProvider state
  const miniKit = useMiniKit();
  const isInWorldApp = miniKit.isInstalled;
  
  // For development: allow bypass based on dev mode setting
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  const hasValidAppId = process.env.NEXT_PUBLIC_WORLD_APP_ID && 
    !process.env.NEXT_PUBLIC_WORLD_APP_ID.includes('__FROM_DEV_PORTAL__') &&
    !process.env.NEXT_PUBLIC_WORLD_APP_ID.includes('app_staging_123456789');
  
  // In development mode, simulate World App environment for testing
  const effectiveIsInWorldApp = (isDevelopment && isDevMode) ? true : isInWorldApp;
  
  console.log('Wallet Context Debug:', {
    isDevelopment,
    isDevMode,
    hasValidAppId,
    isInWorldApp,
    effectiveIsInWorldApp,
    appId: process.env.NEXT_PUBLIC_WORLD_APP_ID
  });

  useEffect(() => {
    // Check for existing wallet connection on mount
    if (effectiveIsInWorldApp) {
      // In a real implementation, you might want to check for stored auth state
      // For now, we'll assume user needs to authenticate each session
    }
  }, [effectiveIsInWorldApp]);

  const connect = async () => {
    if (!effectiveIsInWorldApp) {
      setError('This app must be opened in World App to connect wallet');
      return;
    }
    
    // In development mode, simulate successful connection
    if (isDevelopment && isDevMode) {
      console.log('Development mode: Using mock wallet connection');
      setWalletState({
        isConnected: true,
        address: '0x1234567890123456789012345678901234567890', // Mock address for development
        isLoading: false
      });
      return;
    }

    setWalletState(prev => ({ ...prev, isLoading: true }));
    setError(null);

    try {
      // Check if MiniKit is properly installed before attempting wallet auth
      if (!MiniKit.isInstalled()) {
        throw new Error('MiniKit is not properly installed. Please ensure you are using the latest version of World App.');
      }

      // Check if walletAuth command is available
      if (!MiniKit.commandsAsync?.walletAuth) {
        throw new Error('Wallet authentication is not available. Please update your World App.');
      }

      console.log('🔗 Attempting wallet connection...');
      
      // Step 1: Generate nonce from backend
      const nonceResponse = await fetch('/api/auth/nonce');
      if (!nonceResponse.ok) {
        const errorData = await nonceResponse.json();
        throw new Error(errorData.message || 'Nonce generation failed');
      }
      const { nonce } = await nonceResponse.json();
      
      // Step 2: Create SIWE message according to EIP-4361
      const domain = window.location.host;
      const uri = window.location.origin;
      const statement = 'Sign in to JackpotWLD with your Ethereum account';
      const version = '1';
      const chainId = '480'; // Worldchain mainnet
      const issuedAt = new Date().toISOString();
      
      // Step 3: Call walletAuth with proper SIWE parameters
      const authResult = await MiniKit.commands.walletAuth({
        nonce,
        requestId: '0',
        expirationTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        notBefore: new Date(Date.now() - 60 * 1000), // 1 minute ago
        statement: 'Sign in to JackpotWLD to access your account',
      }) as AuthResult;
      
      console.log('Wallet auth response:', authResult);
      
      if (!authResult) {
        throw new Error('Wallet authentication failed - no response');
      }
      
      if (authResult.status === 'success') {
        console.log('✅ Wallet auth successful, verifying signature...');
        
        // Verify signature with backend
        const verifyResponse = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: authResult.message || authResult.siwe_message,
            signature: authResult.signature,
            address: authResult.address,
            nonce: nonce
          }),
        });
        
        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          throw new Error(errorData.message || 'Signature verification failed');
        }
        
        const verifyResult = await verifyResponse.json();
        if (verifyResult.success) {
          console.log('✅ Signature verified successfully');
          
          setWalletState({
            isConnected: true,
            address: authResult.address,
            isLoading: false
          });
        } else {
          throw new Error(verifyResult.message || 'Signature verification failed');
        }
      } else {
        // Handle error case
        const errorMessage = authResult.details || authResult.error_message || 'Wallet authentication failed';
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('❌ Wallet connection failed:', err);
      
      let errorMessage = 'Failed to connect wallet';
      
      if (err instanceof Error) {
        // Handle specific error types
        if (err.message.includes('User rejected')) {
          errorMessage = 'Wallet connection was cancelled by user';
        } else if (err.message.includes('Signature verification failed')) {
          errorMessage = 'Unable to verify wallet signature. Please try again.';
        } else if (err.message.includes('Nonce generation failed')) {
          errorMessage = 'Authentication service temporarily unavailable. Please try again.';
        } else if (err.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setWalletState({
        isConnected: false,
        address: null,
        isLoading: false
      });
      setError(errorMessage);
    }
  };

  const disconnect = () => {
    setWalletState({
      isConnected: false,
      address: null,
      isLoading: false
    });
    setError(null);
  };

  const value: WalletContextType = {
    ...walletState,
    connect,
    disconnect,
    error,
    isInWorldApp: effectiveIsInWorldApp
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Compatibility hook for components still using wagmi's useAccount pattern
export function useAccount() {
  const { isConnected, address } = useWallet();
  return { isConnected, address };
}