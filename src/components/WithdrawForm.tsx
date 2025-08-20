'use client';

import { useState } from 'react';
import { useAccount } from '../contexts/WalletContext';
import { parseEther, formatEther, Address } from 'viem';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Alert } from './ui/alert';
import { usePoolContract, useUserData } from '../hooks';

interface WithdrawFormProps {
  onWithdrawSuccess?: (amount: string) => void;
  className?: string;
}

export function WithdrawForm({ onWithdrawSuccess, className }: WithdrawFormProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { address, isConnected } = useAccount();
  const { userBalance } = useUserData(address as Address | undefined);
  const { withdraw, isPending, isConfirming, isConfirmed, error: contractError } = usePoolContract();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !address) {
      setError('Please connect your wallet');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const withdrawAmount = parseEther(amount);
    if (userBalance && withdrawAmount > userBalance) {
      setError('Insufficient balance in pool');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Perform withdrawal
      withdraw(withdrawAmount);
      setSuccess(`Withdrawal of ${amount} WLD tokens initiated!`);
      setAmount('');
      onWithdrawSuccess?.(amount);
    } catch (err: unknown) {
      console.error('Withdrawal error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to withdraw tokens';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxClick = () => {
    if (userBalance) {
      setAmount(formatEther(userBalance));
    }
  };

  // Show transaction status
  const getTransactionStatus = () => {
    if (isPending) return 'Transaction pending...';
    if (isConfirming) return 'Confirming transaction...';
    if (isConfirmed) return 'Transaction confirmed!';
    if (contractError) return `Error: ${contractError.message}`;
    return null;
  };

  const transactionStatus = getTransactionStatus();

  if (!isConnected) {
    return (
      <Card className={`p-6 ${className}`}>
        <h2 className="text-xl font-semibold mb-4">Withdraw Tokens</h2>
        <Alert>
          <p>Please connect your wallet to withdraw tokens.</p>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Withdraw Tokens</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="withdraw-amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Withdraw
          </label>
          <div className="relative">
            <Input
              id="withdraw-amount"
              type="number"
              step="0.000001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="pr-16"
              disabled={isLoading || isPending || isConfirming}
            />
            <button
              type="button"
              onClick={handleMaxClick}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              disabled={isLoading || isPending || isConfirming || !userBalance}
            >
              MAX
            </button>
          </div>
          {userBalance && (
            <p className="text-sm text-gray-500 mt-1">
              Pool Balance: {formatEther(userBalance)} WLD
            </p>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <p>{error}</p>
          </Alert>
        )}

        {success && (
          <Alert>
            <p className="text-green-600">{success}</p>
          </Alert>
        )}

        {transactionStatus && (
          <Alert>
            <p className={isConfirmed ? 'text-green-600' : contractError ? 'text-red-600' : 'text-blue-600'}>
              {transactionStatus}
            </p>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={isLoading || isPending || isConfirming || !amount || parseFloat(amount) <= 0}
          className="w-full"
        >
          {isPending || isConfirming ? 'Processing...' : 'Withdraw Tokens'}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-medium text-yellow-900 mb-2">Withdrawal Information:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• You can withdraw your deposited tokens anytime</li>
          <li>• Withdrawals include any earned yield</li>
          <li>• Partial withdrawals are supported</li>
          <li>• No withdrawal fees or penalties</li>
        </ul>
      </div>

      {userBalance && userBalance > BigInt(0) && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">Your Pool Position:</h3>
          <div className="text-sm text-green-700">
            <p>Total Balance: {formatEther(userBalance)} WLD</p>
            <p className="text-xs text-green-600 mt-1">
              This includes your original deposit plus any earned yield
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

export default WithdrawForm;