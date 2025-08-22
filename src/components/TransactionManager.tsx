'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { type Address, type Hash, type Abi, parseEther, formatEther } from 'viem';
import { useAccount, useBalance } from 'wagmi';
import { useTransaction, useTransactionReceipt } from '../hooks/useTransaction';
import { type TransactionType } from '../lib/transaction-utils';
import {
  formatGasPrice,
  calculateTransactionCost,
  isReasonableGasPrice,
  type TransactionConfig,
} from '../lib/transaction-utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Loader2, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

interface TransactionManagerProps {
  title?: string;
  description?: string;
  contractAddress?: Address;
  contractAbi?: Abi;
  functionName?: string;
  transactionType?: TransactionType;
  onSuccess?: (txHash: Hash) => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function TransactionManager({
  title = 'Transaction Manager',
  description = 'Execute blockchain transactions with optimized gas settings',
  contractAddress,
  contractAbi,
  functionName,
  transactionType = 'deposit',
  onSuccess,
  onError,
  className,
  children,
}: TransactionManagerProps) {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [gasConfig, setGasConfig] = useState<TransactionConfig | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const {
    isLoading,
    isSuccess,
    isError,
    error,
    txHash,
    executeTransaction,
    estimateGas,
    resetState,
  } = useTransaction({
    transactionType,
    enableGasEstimation: true,
    onSuccess: (hash) => {
      console.log('Transaction successful:', hash);
      onSuccess?.(hash);
    },
    onError: (errorMsg) => {
      console.error('Transaction failed:', errorMsg);
      onError?.(errorMsg);
    },
    onConfirmed: (hash) => {
      console.log('Transaction confirmed:', hash);
    },
  });

  const { receipt, confirmed, failed } = useTransactionReceipt(txHash);

  // Validate form inputs
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!recipient) {
      errors.recipient = 'Recipient address is required';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      errors.recipient = 'Invalid Ethereum address';
    }

    if (!amount) {
      errors.amount = 'Amount is required';
    } else {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        errors.amount = 'Amount must be a positive number';
      } else if (balance && parseEther(amount) > balance.value) {
        errors.amount = 'Insufficient balance';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [recipient, amount, balance]);

  // Estimate gas when form changes
  useEffect(() => {
    if (validateForm() && contractAddress && contractAbi && functionName) {
      const estimateGasForTransaction = async () => {
        try {
          const config = await estimateGas({
            to: contractAddress,
            value: amount ? parseEther(amount) : undefined,
          });
          setGasConfig(config);
        } catch (error) {
          console.warn('Gas estimation failed:', error);
        }
      };
      
      estimateGasForTransaction();
    }
  }, [recipient, amount, contractAddress, contractAbi, functionName, estimateGas, validateForm]);

  // Handle transaction execution
  const handleExecuteTransaction = useCallback(async () => {
    if (!validateForm() || !isConnected || !contractAddress) {
      return;
    }

    try {
      await executeTransaction({
        to: contractAddress,
        abi: contractAbi,
        functionName: functionName!,
        args: [recipient, parseEther(amount)],
        value: amount ? parseEther(amount) : undefined,
      });
    } catch (error) {
      console.error('Transaction execution failed:', error);
    }
  }, [validateForm, isConnected, contractAddress, contractAbi, functionName, recipient, amount, executeTransaction]);

  // Reset form
  const handleReset = useCallback(() => {
    setRecipient('');
    setAmount('');
    setGasConfig(null);
    setValidationErrors({});
    resetState();
  }, [resetState]);

  // Get transaction status
  const getTransactionStatus = () => {
    if (isLoading) return { status: 'pending', color: 'yellow', icon: Loader2 };
    if (failed) return { status: 'failed', color: 'red', icon: AlertTriangle };
    if (confirmed) return { status: 'confirmed', color: 'green', icon: CheckCircle };
    if (isSuccess) return { status: 'success', color: 'blue', icon: CheckCircle };
    if (isError) return { status: 'error', color: 'red', icon: AlertTriangle };
    return { status: 'idle', color: 'gray', icon: null };
  };

  const transactionStatus = getTransactionStatus();
  const StatusIcon = transactionStatus.icon;

  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          {StatusIcon && (
            <StatusIcon 
              className={cn(
                'h-5 w-5',
                transactionStatus.status === 'pending' && 'animate-spin',
                transactionStatus.color === 'green' && 'text-green-500',
                transactionStatus.color === 'red' && 'text-red-500',
                transactionStatus.color === 'blue' && 'text-blue-500',
                transactionStatus.color === 'yellow' && 'text-yellow-500'
              )}
            />
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Connection Status */}
        {!isConnected && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to continue.
            </AlertDescription>
          </Alert>
        )}

        {/* Balance Display */}
        {isConnected && balance && (
          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Wallet Balance:</span>
            <span className="text-sm">
              {formatEther(balance.value)} {balance.symbol}
            </span>
          </div>
        )}

        {/* Transaction Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className={validationErrors.recipient ? 'border-red-500' : ''}
            />
            {validationErrors.recipient && (
              <p className="text-sm text-red-500">{validationErrors.recipient}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (ETH)</Label>
            <Input
              id="amount"
              type="number"
              step="0.001"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={validationErrors.amount ? 'border-red-500' : ''}
            />
            {validationErrors.amount && (
              <p className="text-sm text-red-500">{validationErrors.amount}</p>
            )}
          </div>
        </div>

        {/* Gas Configuration */}
        {gasConfig && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Gas Estimation</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide' : 'Show'} Details
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Estimated Cost</p>
                <p className="text-sm font-medium">
                  {calculateTransactionCost(gasConfig.gasLimit, gasConfig.maxFeePerGas)} ETH
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gas Price</p>
                <p className="text-sm font-medium">
                  {formatGasPrice(gasConfig.maxFeePerGas)}
                </p>
              </div>
            </div>

            {showAdvanced && (
              <div className="space-y-2 p-3 border rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Gas Limit:</span>
                  <span>{gasConfig.gasLimit.toString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Max Fee Per Gas:</span>
                  <span>{formatGasPrice(gasConfig.maxFeePerGas)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Max Priority Fee:</span>
                  <span>{formatGasPrice(gasConfig.maxPriorityFeePerGas)}</span>
                </div>
                {!isReasonableGasPrice(gasConfig.maxFeePerGas) && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Gas price seems unusually high. Please verify before proceeding.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        )}

        {/* Transaction Status */}
        {txHash && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Transaction Status</span>
              <Badge variant={transactionStatus.color === 'green' ? 'default' : 'secondary'}>
                {transactionStatus.status}
              </Badge>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Transaction Hash</span>
                <Button variant="ghost" size="sm" asChild>
                  <a
                    href={`https://sepolia.worldscan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View
                  </a>
                </Button>
              </div>
              <p className="text-sm font-mono break-all">{txHash}</p>
            </div>

            {receipt && (
              <div className="grid grid-cols-2 gap-4 p-3 border rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Gas Used</p>
                  <p className="text-sm">{receipt.gasUsed?.toString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Block Number</p>
                  <p className="text-sm">{receipt.blockNumber?.toString()}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {isError && error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Custom Content */}
        {children}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleExecuteTransaction}
            disabled={!isConnected || isLoading || !validateForm() || !contractAddress}
            className="flex-1"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Processing...' : 'Execute Transaction'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default TransactionManager;