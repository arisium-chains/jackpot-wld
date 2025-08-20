'use client';

import { useEffect, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';

interface NetworkInfo {
  name: string;
  chainId: number;
  color: string;
}

const NETWORK_INFO: Record<number, NetworkInfo> = {
  31337: { name: 'Anvil Local', chainId: 31337, color: 'bg-gray-600' },
  4801: { name: 'Worldchain Sepolia', chainId: 4801, color: 'bg-orange-600' },
  480: { name: 'Worldchain', chainId: 480, color: 'bg-green-600' },
  11155111: { name: 'Ethereum Sepolia', chainId: 11155111, color: 'bg-blue-600' },
  1: { name: 'Ethereum Mainnet', chainId: 1, color: 'bg-blue-800' },
};

export function NetworkBanner() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const networkInfo = NETWORK_INFO[chainId] || {
    name: `Unknown Network`,
    chainId,
    color: 'bg-red-600'
  };

  return (
    <div className={`${networkInfo.color} text-white text-sm py-2 px-4 text-center`}>
      <span className="font-medium">Network: {networkInfo.name} (chainId: {chainId})</span>
      {!isConnected && (
        <span className="ml-2 text-xs opacity-90">(Not Connected)</span>
      )}
      {chainId === 31337 && (
        <span className="ml-2 text-xs opacity-90">(Local Testnet)</span>
      )}
    </div>
  );
}