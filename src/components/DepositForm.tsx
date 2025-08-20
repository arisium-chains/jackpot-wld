'use client';

import { useState } from 'react';
import { useAccount } from '../contexts/WalletContext';
import { parseEther, formatEther } from 'viem';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Alert } from './ui/alert';
import { usePoolContract } from '../hooks';

interface DepositFormProps {
  onDepositSuccess?: (amount: string) => void;
  className?: string;
}

export function DepositForm({ onDepositSuccess, className }: DepositFormProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { address, isConnected } = useAccount();
  // TODO: Implement balance fetching with MiniKit or direct contract calls
  const balance = { value: BigInt(0), formatted: '0' };

  const { deposit, approve, getAllowance } = usePoolContract();

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

    const depositAmount = parseEther(amount);
    if (balance && depositAmount > balance.value) {
      setError('Insufficient balance');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check allowance first
      const allowance = await getAllowance();
      
      if (allowance < depositAmount) {
        // Need to approve first
        setSuccess('Approving token spend...');
        approve(depositAmount);
        // Wait for approval confirmation
        // In a real app, you'd wait for the transaction to be confirmed
        await new Promise(resolve => setTimeout(resolve, 2000));
        setSuccess('Approval successful! Now depositing...');
      }

      // Perform deposit (simplified for now without World ID proof)
      // TODO: Replace with actual World ID proof when implementing production flow
      const mockNullifierHash = BigInt('0x0000000000000000000000000000000000000000000000000000000000000001');
      const mockProof: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] = [
        BigInt('0x1'), BigInt('0x2'), BigInt('0x3'), BigInt('0x4'),
        BigInt('0x5'), BigInt('0x6'), BigInt('0x7'), BigInt('0x8')
      ];
      deposit(depositAmount, mockNullifierHash, mockProof);
      setSuccess(`Successfully deposited ${amount} WLD tokens!`);
      setAmount('');
      onDepositSuccess?.(amount);
    } catch (err: unknown) {
      console.error('Deposit error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to deposit tokens';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMaxClick = () => {
    if (balance) {
      setAmount(formatEther(balance.value));
    }
  };

  if (!isConnected) {
    return (
      <Card className={`p-6 ${className}`}>
        <h2 className="text-xl font-semibold mb-4">Deposit WLD Tokens</h2>
        <Alert>
          <p>Please connect your wallet to deposit tokens.</p>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Deposit WLD Tokens</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Deposit
          </label>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              step="0.000001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="pr-16"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleMaxClick}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              disabled={isLoading || !balance}
            >
              MAX
            </button>
          </div>
          {balance && (
            <p className="text-sm text-gray-500 mt-1">
              Balance: {formatEther(balance.value)} WLD
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

        <Button
          type="submit"
          disabled={isLoading || !amount || parseFloat(amount) <= 0}
          className="w-full"
        >
          {isLoading ? 'Processing...' : 'Deposit Tokens'}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">How deposits work:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Your tokens are deposited into the prize pool</li>
          <li>• You earn yield on your deposit automatically</li>
          <li>• You&apos;re eligible for lottery prizes</li>
          <li>• You can withdraw anytime with earned yield</li>
        </ul>
      </div>
    </Card>
  );
}

export default DepositForm;