'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';

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
  
  // Check if running in World App
  const isInWorldApp = typeof window !== 'undefined' && MiniKit.isInstalled();

  useEffect(() => {
    // Check for existing wallet connection on mount
    if (isInWorldApp) {
      // In a real implementation, you might want to check for stored auth state
      // For now, we'll assume user needs to authenticate each session
    }
  }, [isInWorldApp]);

  const connect = async () => {
    if (!isInWorldApp) {
      setError('This app must be opened in World App to connect wallet');
      return;
    }

    setWalletState(prev => ({ ...prev, isLoading: true }));
    setError(null);

    try {
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce: Math.floor(Math.random() * 1000000).toString(),
        requestId: 'wallet-auth-' + Date.now(),
        expirationTime: new Date(Date.now() + 5 * 60 * 1000),
        notBefore: new Date(),
        statement: 'Connect your wallet to PoolTogether'
      });
      
      if (finalPayload.status === 'success') {
        setWalletState({
          isConnected: true,
          address: finalPayload.address,
          isLoading: false
        });
      } else {
        throw new Error('Wallet authentication failed');
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError('Failed to connect wallet. Please try again.');
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
    isInWorldApp
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