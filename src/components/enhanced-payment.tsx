/**
 * Enhanced Payment Component
 * Comprehensive payment integration with advanced features
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useEnhancedPayment, useEnhancedWallet, useEnhancedAnalytics } from '../providers/enhanced-minikit-provider';
import { PaymentOptions, PaymentResponse, PaymentTransaction, SDKError } from '../types/miniapp-sdk';
import { logger } from '../lib/logger';

/**
 * Enhanced Payment Props
 */
interface EnhancedPaymentProps {
  recipient?: string;
  amount?: string;
  token?: string;
  memo?: string;
  onSuccess?: (response: PaymentResponse) => void;
  onError?: (error: SDKError) => void;
  onTransactionUpdate?: (transaction: PaymentTransaction) => void;
  className?: string;
  showHistory?: boolean;
  allowTokenSelection?: boolean;
  maxAmount?: string;
  minAmount?: string;
}

/**
 * Supported tokens
 */
const SUPPORTED_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  { symbol: 'DAI', name: 'Dai Stablecoin', decimals: 18 },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 }
];

/**
 * Enhanced Payment Component
 */
export function EnhancedPayment({
  recipient = '',
  amount = '',
  token = 'ETH',
  memo = '',
  onSuccess,
  onError,
  onTransactionUpdate,
  className = '',
  showHistory = true,
  allowTokenSelection = true,
  maxAmount,
  minAmount
}: EnhancedPaymentProps) {
  // Hooks
  const payment = useEnhancedPayment();
  const wallet = useEnhancedWallet();
  const analytics = useEnhancedAnalytics();

  // Form state
  const [formData, setFormData] = useState({
    recipient,
    amount,
    token,
    memo
  });
  
  // Component state
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentTransaction[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [estimatedGas, setEstimatedGas] = useState<string>('0');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load payment history
  useEffect(() => {
    if (showHistory && wallet.state.isConnected) {
      loadPaymentHistory();
    }
  }, [showHistory, wallet.state.isConnected]);

  // Validate form on changes
  useEffect(() => {
    validateForm();
  }, [formData, maxAmount, minAmount]);

  // Load payment history
  const loadPaymentHistory = useCallback(async () => {
    try {
      const history = await payment.getHistory();
      setPaymentHistory(history);
    } catch (error) {
      logger.error('Failed to load payment history', error);
    }
  }, [payment]);

  // Validate form
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};

    // Validate recipient
    if (!formData.recipient) {
      errors.recipient = 'Recipient address is required';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.recipient)) {
      errors.recipient = 'Invalid Ethereum address';
    }

    // Validate amount
    if (!formData.amount) {
      errors.amount = 'Amount is required';
    } else {
      const amountNum = parseFloat(formData.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        errors.amount = 'Amount must be a positive number';
      } else {
        if (minAmount && amountNum < parseFloat(minAmount)) {
          errors.amount = `Amount must be at least ${minAmount}`;
        }
        if (maxAmount && amountNum > parseFloat(maxAmount)) {
          errors.amount = `Amount cannot exceed ${maxAmount}`;
        }
      }
    }

    // Validate token
    if (!SUPPORTED_TOKENS.find(t => t.symbol === formData.token)) {
      errors.token = 'Unsupported token';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, maxAmount, minAmount]);

  // Estimate gas fees
  const estimateGas = useCallback(async () => {
    try {
      // This would typically call a gas estimation API
      // For now, we'll use a placeholder
      const gasEstimate = '0.002'; // ETH
      setEstimatedGas(gasEstimate);
    } catch (error) {
      logger.error('Failed to estimate gas', error);
      setEstimatedGas('Unknown');
    }
  }, [formData]);

  // Handle form input changes
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setPaymentError(null);
  }, []);

  // Handle payment submission
  const handlePayment = useCallback(async () => {
    if (!validateForm() || !wallet.state.isConnected || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Track payment attempt
      await analytics.track({
        name: 'payment_attempt',
        properties: {
          recipient: formData.recipient,
          amount: formData.amount,
          token: formData.token,
          has_memo: !!formData.memo,
          wallet_address: wallet.state.address
        }
      });

      // Prepare payment options
      const paymentOptions: PaymentOptions = {
        recipient: formData.recipient,
        amount: formData.amount,
        token: formData.token,
        memo: formData.memo || undefined
      };

      // Execute payment
      const response = await payment.send(paymentOptions);

      if (response.status === 'success') {
        // Track successful payment
        await analytics.track({
          name: 'payment_success',
          properties: {
            transaction_hash: response.transaction_hash,
            recipient: formData.recipient,
            amount: formData.amount,
            token: formData.token
          }
        });

        // Reset form
        setFormData({
          recipient: '',
          amount: '',
          token: 'ETH',
          memo: ''
        });

        // Reload payment history
        await loadPaymentHistory();

        // Call success callback
        onSuccess?.(response);

        logger.info('Payment completed successfully', response);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      setPaymentError(errorMessage);

      // Track payment error
      await analytics.track({
        name: 'payment_error',
        properties: {
          error_message: errorMessage,
          recipient: formData.recipient,
          amount: formData.amount,
          token: formData.token
        }
      });

      // Call error callback
      if (error instanceof Error) {
        onError?.({
          code: 'PAYMENT_FAILED',
          message: errorMessage,
          timestamp: new Date()
        });
      }

      logger.error('Payment failed', error);
    } finally {
      setIsProcessing(false);
    }
  }, [formData, wallet.state, isProcessing, validateForm, payment, analytics, onSuccess, onError, loadPaymentHistory]);

  // Format transaction hash for display
  const formatTxHash = useCallback((hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  }, []);

  // Format amount for display
  const formatAmount = useCallback((amount: string, tokenSymbol: string) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return `0 ${tokenSymbol}`;
    return `${num.toFixed(6)} ${tokenSymbol}`;
  }, []);

  // Render wallet connection requirement
  if (!wallet.state.isConnected) {
    return (
      <div className={`enhanced-payment wallet-required ${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-yellow-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Wallet Connection Required
          </h3>
          <p className="text-yellow-700">
            Please connect your wallet to make payments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`enhanced-payment ${className}`}>
      {/* Payment Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Send Payment
        </h2>

        {/* Payment Error */}
        {paymentError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{paymentError}</span>
            </div>
          </div>
        )}

        {/* Recipient Address */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={formData.recipient}
            onChange={(e) => handleInputChange('recipient', e.target.value)}
            placeholder="0x..."
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.recipient ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {validationErrors.recipient && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.recipient}</p>
          )}
        </div>

        {/* Amount and Token */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="0.0"
              step="0.000001"
              min={minAmount}
              max={maxAmount}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.amount ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.amount && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.amount}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token
            </label>
            <select
              value={formData.token}
              onChange={(e) => handleInputChange('token', e.target.value)}
              disabled={!allowTokenSelection}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {SUPPORTED_TOKENS.map((token) => (
                <option key={token.symbol} value={token.symbol}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Memo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Memo (Optional)
          </label>
          <input
            type="text"
            value={formData.memo}
            onChange={(e) => handleInputChange('memo', e.target.value)}
            placeholder="Payment description..."
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Advanced Options */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <span>Advanced Options</span>
            <svg className={`ml-1 h-4 w-4 transform transition-transform ${
              showAdvanced ? 'rotate-180' : ''
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <p>Estimated Gas Fee: {estimatedGas} ETH</p>
                <p>Network: Ethereum Mainnet</p>
                <p>Transaction Type: Standard Transfer</p>
              </div>
              <button
                onClick={estimateGas}
                className="mt-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded"
              >
                Refresh Gas Estimate
              </button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handlePayment}
          disabled={isProcessing || Object.keys(validationErrors).length > 0 || payment.status === 'processing'}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          {isProcessing || payment.status === 'processing' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing Payment...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send Payment
            </>
          )}
        </button>
      </div>

      {/* Payment History */}
      {showHistory && paymentHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Payments
          </h3>
          <div className="space-y-3">
            {paymentHistory.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {formatTxHash(tx.hash)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      tx.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-600">
                      To: {formatTxHash(tx.to)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatAmount(tx.amount, tx.token || 'ETH')}
                    </span>
                  </div>
                  {tx.memo && (
                    <p className="text-xs text-gray-500 mt-1">{tx.memo}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedPayment;