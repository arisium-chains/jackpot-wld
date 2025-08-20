'use client';

import React from 'react';
import { useWaitForTransactionReceipt } from 'wagmi';

interface TransactionStatusProps {
  hash?: `0x${string}`;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

const TransactionStatus: React.FC<TransactionStatusProps> = ({
  hash,
  onSuccess,
  onError,
  className = ''
}) => {
  const {
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error
  } = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash
    }
  });

  // Handle success callback
  React.useEffect(() => {
    if (isConfirmed && onSuccess) {
      onSuccess();
    }
  }, [isConfirmed, onSuccess]);

  // Handle error callback
  React.useEffect(() => {
    if (error && onError) {
      onError(error as Error);
    }
  }, [error, onError]);

  if (!hash) {
    return null;
  }

  return (
    <div className={`p-4 rounded-lg border ${className}`}>
      <div className="flex items-center space-x-3">
        {/* Status Icon */}
        <div className="flex-shrink-0">
          {isConfirming && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          )}
          {isConfirmed && (
            <div className="rounded-full h-5 w-5 bg-green-100 flex items-center justify-center">
              <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          {error && (
            <div className="rounded-full h-5 w-5 bg-red-100 flex items-center justify-center">
              <svg className="h-3 w-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Status Text */}
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">
            {isConfirming && 'Confirming transaction...'}
            {isConfirmed && 'Transaction confirmed!'}
            {error && 'Transaction failed'}
          </div>
          
          {/* Transaction Hash */}
          <div className="text-xs text-gray-500 mt-1">
            <span className="font-mono">
              {hash.slice(0, 10)}...{hash.slice(-8)}
            </span>
            <a
              href={`https://worldchain-mainnet.explorer.alchemy.com/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-600 hover:text-blue-800 underline"
            >
              View on Explorer
            </a>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-xs text-red-600 mt-1">
              {error.message}
            </div>
          )}

          {/* Receipt Details */}
          {isConfirmed && receipt && (
            <div className="text-xs text-gray-500 mt-1">
              Block: {receipt.blockNumber.toString()} | Gas Used: {receipt.gasUsed.toString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionStatus;