'use client';

import { useState, useEffect } from 'react';
import { useAccount } from '../contexts/WalletContext';
import { formatEther, Address } from 'viem';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useUserData } from '../hooks';

interface UserAccountStatsProps {
  className?: string;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'prize';
  amount: string;
  timestamp: Date;
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export function UserAccountStats({ className }: UserAccountStatsProps) {
  const { address, isConnected } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // TODO: Implement balance fetching with MiniKit or direct contract calls
  const wldBalance = { value: BigInt(0), formatted: '0' };
  
  // Commented out wagmi balance calls
  // const { data: wldBalance } = useBalance({
  //   address,
  //   token: addresses.wldToken,
  // });

  // Get user's pool data
  const { userBalance } = useUserData(address as Address | undefined);

  // Mock transaction history - in a real app, this would come from an API or indexer
  useEffect(() => {
    if (isConnected && address) {
      setIsLoading(true);
      // Simulate loading transaction history
      setTimeout(() => {
        const mockTransactions: Transaction[] = [
          {
            id: '1',
            type: 'deposit',
            amount: '100.0',
            timestamp: new Date(Date.now() - 86400000), // 1 day ago
            hash: '0x1234...5678',
            status: 'confirmed'
          },
          {
            id: '2',
            type: 'prize',
            amount: '5.25',
            timestamp: new Date(Date.now() - 43200000), // 12 hours ago
            hash: '0x2345...6789',
            status: 'confirmed'
          },
          {
            id: '3',
            type: 'deposit',
            amount: '50.0',
            timestamp: new Date(Date.now() - 21600000), // 6 hours ago
            hash: '0x3456...7890',
            status: 'confirmed'
          }
        ];
        setTransactions(mockTransactions);
        setIsLoading(false);
      }, 1000);
    }
  }, [isConnected, address]);

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return (
          <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        );
      case 'withdraw':
        return (
          <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
        );
      case 'prize':
        return (
          <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        );
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
    }
  };

  const calculateTotalEarnings = () => {
    // Mock calculation - in a real app, this would track actual earnings
    const mockEarnings = BigInt('5250000000000000000'); // 5.25 WLD
    return formatEther(mockEarnings);
  };

  if (!isConnected) {
    return (
      <Card className={`p-6 ${className}`}>
        <h2 className="text-xl font-semibold mb-4">Account Statistics</h2>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">Connect your wallet to view account statistics</p>
          <Button variant="outline">Connect Wallet</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Account Overview */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Account Overview</h2>
          <div className="text-sm text-gray-500">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Wallet Balance */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Wallet Balance</p>
            <p className="text-lg font-semibold text-blue-600">
              {wldBalance ? `${parseFloat(formatEther(wldBalance.value)).toFixed(4)} WLD` : '0 WLD'}
            </p>
          </div>

          {/* Pool Balance */}
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Pool Balance</p>
            <p className="text-lg font-semibold text-green-600">
              {userBalance ? `${parseFloat(formatEther(userBalance)).toFixed(4)} WLD` : '0 WLD'}
            </p>
          </div>

          {/* Total Deposited */}
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Deposited</p>
            <p className="text-lg font-semibold text-purple-600">
              150.0 WLD
            </p>
          </div>

          {/* Total Earnings */}
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
            <p className="text-lg font-semibold text-yellow-600">
              {calculateTotalEarnings()} WLD
            </p>
          </div>
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Transaction History</h3>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading transactions...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  {getTransactionIcon(tx.type)}
                  <div>
                    <p className="font-medium capitalize">
                      {tx.type === 'prize' ? 'Prize Won' : tx.type}
                    </p>
                    <p className="text-sm text-gray-500">
                      {tx.timestamp.toLocaleDateString()} at {tx.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${
                    tx.type === 'withdraw' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {tx.type === 'withdraw' ? '-' : '+'}{tx.amount} WLD
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusBadge(tx.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No transactions found</p>
            <p className="text-sm mt-1">Your transaction history will appear here</p>
          </div>
        )}
      </Card>

      {/* Account Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Account Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Pool Participation</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Days Active</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Transactions</span>
                <span className="font-medium">{transactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Prizes Won</span>
                <span className="font-medium">
                  {transactions.filter(tx => tx.type === 'prize').length}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Performance</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Win Rate</span>
                <span className="font-medium">8.3%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Deposit</span>
                <span className="font-medium">75.0 WLD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Yield Earned</span>
                <span className="font-medium text-green-600">
                  +{calculateTotalEarnings()} WLD
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default UserAccountStats;