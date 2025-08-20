'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { config } from '../lib/wagmi';
import { WalletProvider } from '../contexts/WalletContext';
import { MiniKit } from '@worldcoin/minikit-js';
import { ReactNode, useState, useEffect } from 'react';

interface ProvidersProps {
  children: ReactNode;
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

  useEffect(() => {
    // Initialize MiniKit
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_WORLD_APP_ID) {
      MiniKit.install(process.env.NEXT_PUBLIC_WORLD_APP_ID);
    }
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}