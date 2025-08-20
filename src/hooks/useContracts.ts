import { useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getContractAddressesSync, POOL_CONTRACT_ABI, PRIZE_POOL_ABI, WLD_TOKEN_ABI } from '@/lib/contracts';
import { Address } from 'viem';

// Hook for reading pool contract data
export function usePoolContract() {
  const chainId = useChainId();
  const addresses = getContractAddressesSync(chainId);
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const { data: totalDeposits } = useReadContract({
    address: addresses.poolContract,
    abi: POOL_CONTRACT_ABI,
    functionName: 'getTotalDeposits',
  });

  const { data: currentAPY } = useReadContract({
    address: addresses.poolContract,
    abi: POOL_CONTRACT_ABI,
    functionName: 'getCurrentAPY',
  });

  const { data: poolStats } = useReadContract({
    address: addresses.poolContract,
    abi: POOL_CONTRACT_ABI,
    functionName: 'getPoolStats',
  });

  const deposit = (amount: bigint, nullifierHash: bigint, proof: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]) => {
    writeContract({
      address: addresses.poolContract,
      abi: POOL_CONTRACT_ABI,
      functionName: 'deposit',
      args: [amount, nullifierHash, proof],
    });
  };

  const approve = (amount: bigint) => {
    writeContract({
      address: addresses.wldToken,
      abi: WLD_TOKEN_ABI,
      functionName: 'approve',
      args: [addresses.poolContract, amount],
    });
  };

  const getAllowance = async (): Promise<bigint> => {
    // This would typically use useReadContract, but for simplicity we'll return a mock value
    // In a real implementation, you'd want to use a separate hook or read contract call
    return BigInt(0);
  };

  const withdraw = (amount: bigint) => {
    writeContract({
      address: addresses.poolContract,
      abi: POOL_CONTRACT_ABI,
      functionName: 'withdraw',
      args: [amount],
    });
  };

  return {
    addresses,
    totalDeposits: totalDeposits as bigint | undefined,
    currentAPY: currentAPY as bigint | undefined,
    poolStats: poolStats as readonly [bigint, bigint, bigint, bigint] | undefined,
    deposit,
    withdraw,
    approve,
    getAllowance,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}

// Hook for reading user-specific data
export function useUserData(address?: Address) {
  const chainId = useChainId();
  const addresses = getContractAddressesSync(chainId);

  const { data: userBalance } = useReadContract({
    address: addresses.poolContract,
    abi: POOL_CONTRACT_ABI,
    functionName: 'getUserBalance',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: wldBalance } = useReadContract({
    address: addresses.wldToken,
    abi: WLD_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: allowance } = useReadContract({
    address: addresses.wldToken,
    abi: WLD_TOKEN_ABI,
    functionName: 'allowance',
    args: address ? [address, addresses.poolContract] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    userBalance: userBalance as bigint | undefined,
    wldBalance: wldBalance as bigint | undefined,
    allowance: allowance as bigint | undefined,
  };
}

// Hook for reading prize pool data
export function usePrizePool() {
  const chainId = useChainId();
  const addresses = getContractAddressesSync(chainId);

  const { data: currentPrizeAmount } = useReadContract({
    address: addresses.prizePool,
    abi: PRIZE_POOL_ABI,
    functionName: 'getCurrentPrizeAmount',
  });

  const { data: nextDrawTime } = useReadContract({
    address: addresses.prizePool,
    abi: PRIZE_POOL_ABI,
    functionName: 'nextDrawAt',
  });

  const { data: prizeBalance } = useReadContract({
    address: addresses.prizePool,
    abi: PRIZE_POOL_ABI,
    functionName: 'prizeBalance',
  });

  return {
    currentPrizeAmount: currentPrizeAmount as bigint | undefined,
    nextDrawTime: nextDrawTime as bigint | undefined,
    prizeBalance: prizeBalance as bigint | undefined,
  };
}

// Hook for contract write operations
export function useContractWrite() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const chainId = useChainId();
  const addresses = getContractAddressesSync(chainId);

  const deposit = (amount: bigint, nullifierHash: bigint, proof: readonly bigint[]) => {
    writeContract({
      address: addresses.poolContract,
      abi: POOL_CONTRACT_ABI,
      functionName: 'deposit',
      args: [amount, nullifierHash, proof as [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]],
    });
  };

  const withdraw = (amount: bigint) => {
    writeContract({
      address: addresses.poolContract,
      abi: POOL_CONTRACT_ABI,
      functionName: 'withdraw',
      args: [amount],
    });
  };

  const approve = (amount: bigint) => {
    writeContract({
      address: addresses.wldToken,
      abi: WLD_TOKEN_ABI,
      functionName: 'approve',
      args: [addresses.poolContract, amount],
    });
  };

  return {
    deposit,
    withdraw,
    approve,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
}