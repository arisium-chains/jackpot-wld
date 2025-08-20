'use client';

import { useEffect, useState } from 'react';
import { formatEther } from 'viem';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { usePoolContract, usePrizePool } from '../hooks';

interface PoolStatsDashboardProps {
  className?: string;
}

export function PoolStatsDashboard({ className }: PoolStatsDashboardProps) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const { totalDeposits, currentAPY } = usePoolContract();
  const {
    currentPrizeAmount,
    nextDrawTime
  } = usePrizePool();

  // Set mounted state and initial time on client
  useEffect(() => {
    setMounted(true);
    setLastUpdated(new Date());
  }, []);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [mounted]);

  const formatTimeUntilDraw = (drawTime: bigint | undefined) => {
    if (!drawTime) return 'Loading...';
    
    const now = Math.floor(Date.now() / 1000);
    const timeUntil = Number(drawTime) - now;
    
    if (timeUntil <= 0) return 'Draw in progress';
    
    const hours = Math.floor(timeUntil / 3600);
    const minutes = Math.floor((timeUntil % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const calculateEstimatedYield = () => {
    if (!totalDeposits || !currentAPY) return '0';
    
    const dailyYield = (Number(formatEther(totalDeposits)) * Number(currentAPY)) / 365 / 100;
    return dailyYield.toFixed(4);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Pool Statistics</h2>
        <div className="text-sm text-gray-500">
          Last updated: {mounted && lastUpdated ? lastUpdated.toLocaleTimeString() : 'Loading...'}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value Locked */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value Locked</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalDeposits ? `${parseFloat(formatEther(totalDeposits)).toLocaleString()} WLD` : 'Loading...'}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Current APY */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current APY</p>
              <p className="text-2xl font-bold text-green-600">
                {currentAPY ? `${Number(currentAPY) / 100}%` : 'Loading...'}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Current Prize */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Prize</p>
              <p className="text-2xl font-bold text-purple-600">
                {currentPrizeAmount ? `${parseFloat(formatEther(currentPrizeAmount)).toLocaleString()} WLD` : 'Loading...'}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Next Draw */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Next Draw</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatTimeUntilDraw(nextDrawTime)}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pool Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pool Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Daily Yield Generation</span>
              <span className="font-medium">{calculateEstimatedYield()} WLD</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Current Draw ID</span>
              <span className="font-medium">1</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pool Status</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Active
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Prize Distribution</span>
              <span className="font-medium">Daily</span>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {currentPrizeAmount ? (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium">Current Draw #1</p>
                  <p className="text-xs text-gray-500">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{parseFloat(formatEther(currentPrizeAmount)).toLocaleString()} WLD</p>
                  <p className="text-xs text-gray-500">
                    Active
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No recent draws available</p>
                <p className="text-xs mt-1">Prize draws will appear here once they begin</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How Prize Pool Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-blue-600">1</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Deposit & Earn</h4>
            <p className="text-sm text-gray-600">
              Deposit WLD tokens to earn yield while maintaining your principal
            </p>
          </div>
          <div className="text-center">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-green-600">2</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Yield Accumulates</h4>
            <p className="text-sm text-gray-600">
              Your deposits generate yield through DeFi protocols automatically
            </p>
          </div>
          <div className="text-center">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-purple-600">3</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Win Prizes</h4>
            <p className="text-sm text-gray-600">
              Accumulated yield becomes prizes distributed to random winners
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default PoolStatsDashboard;