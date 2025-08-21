'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useMiniKit } from '@/providers';

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

      console.log('Attempting wallet authentication...');
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce: Math.floor(Math.random() * 1000000).toString(),
        requestId: 'wallet-auth-' + Date.now(),
        expirationTime: new Date(Date.now() + 5 * 60 * 1000),
        notBefore: new Date(),
        statement: 'Connect your wallet to PoolTogether'
      });
      
      console.log('Wallet auth response:', finalPayload);
      
      if (finalPayload.status === 'success') {
        setWalletState({
          isConnected: true,
          address: finalPayload.address,
          isLoading: false
        });
        console.log('Wallet connected successfully:', finalPayload.address);
      } else {
        throw new Error(`Wallet authentication failed: ${finalPayload.status}`);
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet. Please try again.';
      setError(errorMessage);
      setWalletState(prev => ({ ...prev, isLoading: false }));
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