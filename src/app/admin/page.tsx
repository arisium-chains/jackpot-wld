'use client';

import { PoolStatsDashboard, LotteryDrawManager, TransactionHistory } from '../../components';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { getContractAddresses, POOL_CONTRACT_ABI, PRIZE_POOL_ABI, type ContractAddresses } from '@/lib/contracts';

export default function AdminPage() {
  const [drawInterval, setDrawInterval] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState<ContractAddresses | null>(null);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    getContractAddresses(31337).then(setAddresses).catch(console.error);
  }, []);

  const handleHarvestYield = async () => {
    if (!addresses) return;
    
    try {
      setIsLoading(true);
      writeContract({
        address: addresses.poolContract,
        abi: POOL_CONTRACT_ABI,
        functionName: 'harvestAndFundPrize',
      });
    } catch (error) {
      console.error('Error harvesting yield:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDrawInterval = async () => {
    if (!drawInterval || !addresses) return;
    
    try {
      setIsLoading(true);
      const intervalInSeconds = parseInt(drawInterval) * 3600; // Convert hours to seconds
      
      writeContract({
        address: addresses.prizePool,
        abi: PRIZE_POOL_ABI,
        functionName: 'setDrawInterval',
        args: [BigInt(intervalInSeconds)],
      });
    } catch (error) {
      console.error('Error setting draw interval:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerDraw = async () => {
    if (!addresses) return;
    
    try {
      setIsLoading(true);
      writeContract({
        address: addresses.prizePool,
        abi: PRIZE_POOL_ABI,
        functionName: 'scheduleDraw',
      });
    } catch (error) {
      console.error('Error triggering draw:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ⚙️ Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Administrative functions for the prize pool
          </p>
        </div>

        {/* Pool Statistics */}
        <PoolStatsDashboard className="mb-8" />

        {/* Admin Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Controls</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Harvest Yield */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Yield Management</h3>
              <button
                onClick={handleHarvestYield}
                disabled={isLoading || isConfirming}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isLoading || isConfirming ? 'Processing...' : 'Harvest Yield & Fund Prize'}
              </button>
            </div>

            {/* Draw Interval */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Draw Settings</h3>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={drawInterval}
                  onChange={(e) => setDrawInterval(e.target.value)}
                  placeholder="Hours"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSetDrawInterval}
                  disabled={!drawInterval || isLoading || isConfirming}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Set Interval
                </button>
              </div>
            </div>

            {/* Manual Draw */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Manual Draw</h3>
              <button
                onClick={handleTriggerDraw}
                disabled={isLoading || isConfirming}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isLoading || isConfirming ? 'Processing...' : 'Trigger Draw Now'}
              </button>
            </div>
          </div>

          {/* Transaction Status */}
          {isConfirming && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">Transaction confirming...</p>
            </div>
          )}
          
          {isSuccess && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">Transaction successful!</p>
            </div>
          )}
        </div>

        {/* Lottery Draw Manager */}
        <LotteryDrawManager className="mb-8" />

        {/* Transaction History */}
        <TransactionHistory className="" />
      </div>
    </div>
  );
}