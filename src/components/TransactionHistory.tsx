'use client';

import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface Transaction {
  id: string;
  hash: `0x${string}`;
  type: 'deposit' | 'withdraw' | 'approval';
  amount: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
  blockNumber?: bigint;
  gasUsed?: bigint;
}

interface TransactionHistoryProps {
  className?: string;
  maxTransactions?: number;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  className = '',
  maxTransactions = 10
}) => {
  const { address } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock transaction data - in a real app, this would come from an indexer or API
  useEffect(() => {
    if (address) {
      setIsLoading(true);
      // Simulate API call delay
      setTimeout(() => {
        // TODO: Replace with actual transaction data from blockchain
        const mockTransactions: Transaction[] = [
          {
            id: '1',
            hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
            type: 'deposit',
            amount: '50.0',
            status: 'confirmed',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            blockNumber: BigInt(12345678),
            gasUsed: BigInt(21000)
          },
          {
            id: '2',
            hash: '0x0000000000000000000000000000000000000000000000000000000000000002',
            type: 'approval',
            amount: '100.0',
            status: 'confirmed',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 - 5 * 60 * 1000), // 2h 5m ago
            blockNumber: BigInt(12345677),
            gasUsed: BigInt(45000)
          },
          {
            id: '3',
            hash: '0x0000000000000000000000000000000000000000000000000000000000000003',
            type: 'withdraw',
            amount: '25.0',
            status: 'confirmed',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            blockNumber: BigInt(12340000),
            gasUsed: BigInt(35000)
          },
          {
            id: '4',
            hash: '0x0000000000000000000000000000000000000000000000000000000000000004',
            type: 'deposit',
            amount: '75.0',
            status: 'confirmed',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            blockNumber: BigInt(12320000),
            gasUsed: BigInt(21000)
          }
        ];
        setTransactions(mockTransactions.slice(0, maxTransactions));
        setIsLoading(false);
      }, 1000);
    }
  }, [address, maxTransactions]);

  const getTransactionTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'deposit':
        return 'text-green-600 bg-green-100';
      case 'withdraw':
        return 'text-red-600 bg-red-100';
      case 'approval':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
  };

  if (!address) {
    return (
      <div className={`p-6 bg-white rounded-lg shadow-sm border ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h3>
        <p className="text-gray-500 text-center py-8">Connect your wallet to view transaction history</p>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading transactions...</span>
        </div>
      ) : transactions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No transactions found</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {/* Transaction Type Badge */}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(tx.type)}`}>
                  {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                </span>

                {/* Transaction Details */}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {tx.type === 'approval' ? 'Token Approval' : `${tx.amount} WLD`}
                    </span>
                    <span className={`text-xs font-medium ${getStatusColor(tx.status)}`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTimestamp(tx.timestamp)}
                  </div>
                </div>
              </div>

              {/* Transaction Hash and Link */}
              <div className="text-right">
                <div className="text-xs font-mono text-gray-500">
                  {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                </div>
                <a
                  href={`https://worldchain-mainnet.explorer.alchemy.com/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  View
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {transactions.length >= maxTransactions && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 underline">
            View All Transactions
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;