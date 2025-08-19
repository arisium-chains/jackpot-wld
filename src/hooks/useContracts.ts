import { useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getContractAddresses, POOL_CONTRACT_ABI, PRIZE_POOL_ABI, WLD_TOKEN_ABI } from '@/lib/contracts';
import { Address } from 'viem';

// Hook for reading pool contract data
export function usePoolContract() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

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

  return {
    addresses,
    totalDeposits,
    currentAPY,
    poolStats,
  };
}

// Hook for reading user-specific data
export function useUserData(userAddress?: Address) {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { data: userBalance } = useReadContract({
    address: addresses.poolContract,
    abi: POOL_CONTRACT_ABI,
    functionName: 'getUserBalance',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  const { data: wldBalance } = useReadContract({
    address: addresses.wldToken,
    abi: WLD_TOKEN_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  const { data: allowance } = useReadContract({
    address: addresses.wldToken,
    abi: WLD_TOKEN_ABI,
    functionName: 'allowance',
    args: userAddress ? [userAddress, addresses.poolContract] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  return {
    userBalance,
    wldBalance,
    allowance,
  };
}

// Hook for reading prize pool data
export function usePrizePool() {
  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const { data: currentPrizeAmount } = useReadContract({
    address: addresses.prizePool,
    abi: PRIZE_POOL_ABI,
    functionName: 'getCurrentPrizeAmount',
  });

  const { data: nextDrawTime } = useReadContract({
    address: addresses.prizePool,
    abi: PRIZE_POOL_ABI,
    functionName: 'getNextDrawTime',
  });

  const { data: currentDrawId } = useReadContract({
    address: addresses.prizePool,
    abi: PRIZE_POOL_ABI,
    functionName: 'getCurrentDrawId',
  });

  const { data: drawInfo } = useReadContract({
    address: addresses.prizePool,
    abi: PRIZE_POOL_ABI,
    functionName: 'getDrawInfo',
    args: currentDrawId ? [currentDrawId] : undefined,
    query: {
      enabled: !!currentDrawId,
    },
  });

  return {
    currentPrizeAmount,
    nextDrawTime,
    currentDrawId,
    drawInfo,
  };
}

// Hook for contract write operations
export function useContractWrite() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const chainId = useChainId();
  const addresses = getContractAddresses(chainId);

  const deposit = (amount: bigint, nullifierHash: bigint, proof: readonly bigint[]) => {
    writeContract({
      address: addresses.poolContract,
      abi: POOL_CONTRACT_ABI,
      functionName: 'deposit',
      args: [amount, nullifierHash, proof as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]],
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