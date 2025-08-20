'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from '../lib/wagmi';
import { WalletProvider } from '../contexts/WalletContext';
import { MiniKit } from '@worldcoin/minikit-js';
import { ReactNode, useState, useEffect, createContext, useContext } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

interface MiniKitContextType {
  wallet: (() => void) | undefined;
  pay: ((params: unknown) => Promise<unknown>) | undefined;
  siwe: ((params: unknown) => Promise<unknown>) | undefined;
  openURL: ((url: string) => void) | undefined;
  isInstalled: boolean;
}

const MiniKitContext = createContext<MiniKitContextType | null>(null);

export function useMiniKit() {
  const context = useContext(MiniKitContext);
  if (!context) {
    throw new Error('useMiniKit must be used within a MiniKitProvider');
  }
  return context;
}

function MiniKitProvider({ children }: { children: ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Initialize MiniKit
    if (typeof window !== 'undefined') {
      const appId = process.env.NEXT_PUBLIC_MINIAPP_ID || process.env.NEXT_PUBLIC_WORLD_APP_ID;
      if (appId) {
        try {
          MiniKit.install(appId);
          setIsInstalled(true);
        } catch (error) {
          console.warn('MiniKit installation failed:', error);
          setIsInstalled(false);
        }
      }
    }
  }, []);

  const contextValue: MiniKitContextType = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    wallet: (MiniKit as any).wallet as (() => void) | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pay: (MiniKit as any).pay as ((params: unknown) => Promise<unknown>) | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    siwe: (MiniKit as any).siwe as ((params: unknown) => Promise<unknown>) | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    openURL: (MiniKit as any).openURL as ((url: string) => void) | undefined,
    isInstalled,
  };

  return (
    <MiniKitContext.Provider value={contextValue}>
      {children}
    </MiniKitContext.Provider>
  );
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <MiniKitProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <WalletProvider>
            {children}
          </WalletProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </MiniKitProvider>
  );
}