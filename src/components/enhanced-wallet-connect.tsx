/**
 * Enhanced Wallet Connect Component
 * Advanced wallet integration with comprehensive features
 */

'use client';

import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { useEnhancedWallet, useEnhancedStatus, useEnhancedAnalytics } from '../providers/enhanced-minikit-provider';
import { WalletAuthOptions, SDKError } from '../types/miniapp-sdk';
import { logger } from '../lib/logger';

/**
 * Enhanced Wallet Connect Props
 */
interface EnhancedWalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  onError?: (error: SDKError) => void;
  className?: string;
  showBalance?: boolean;
  showChainInfo?: boolean;
  autoConnect?: boolean;
  customAuthOptions?: Partial<WalletAuthOptions>;
}

/**
 * Enhanced Wallet Connect Component
 */
export function EnhancedWalletConnect({
  onConnect,
  onDisconnect,
  onError,
  className = '',
  showBalance = true,
  showChainInfo = true,
  autoConnect = false,
  customAuthOptions = {}
}: EnhancedWalletConnectProps) {
  // Hooks
  const wallet = useEnhancedWallet();
  const { isReady, hasError, error } = useEnhancedStatus();
  const analytics = useEnhancedAnalytics();

  // Local state
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState<string>('0');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastConnectAttempt, setLastConnectAttempt] = useState<Date | null>(null);

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect && isReady && !wallet.state.isConnected && !isConnecting && retryCount < 3) {
      const timeSinceLastAttempt = lastConnectAttempt ? Date.now() - lastConnectAttempt.getTime() : Infinity;
      if (timeSinceLastAttempt > 5000) { // Wait 5 seconds between auto-connect attempts
        handleConnect();
      }
    }
  }, [autoConnect, isReady, wallet.state.isConnected, isConnecting, retryCount, lastConnectAttempt]);

  // Load balance when connected
  useEffect(() => {
    if (wallet.state.isConnected && showBalance) {
      loadBalance();
    }
  }, [wallet.state.isConnected, showBalance]);

  // Handle errors
  useEffect(() => {
    if (hasError && error) {
      setConnectionError(error.message);
      onError?.(error);
    }
  }, [hasError, error, onError]);

  // Load wallet balance
  const loadBalance = useCallback(async () => {
    try {
      const walletBalance = await wallet.getBalance();
      setBalance(walletBalance);
    } catch (error) {
      logger.error('Failed to load wallet balance', { error: String(error) });
      setBalance('Error');
    }
  }, [wallet]);

  // Handle wallet connection
  const handleConnect = useCallback(async () => {
    if (!isReady || isConnecting) return;

    setIsConnecting(true);
    setConnectionError(null);
    setLastConnectAttempt(new Date());

    try {
      // Track connection attempt
      await analytics.track({
        name: 'wallet_connect_attempt',
        properties: {
          is_world_app: wallet.isWorldApp,
          is_development: wallet.isDevelopment,
          retry_count: retryCount
        }
      });

      // Fetch nonce for authentication
      const nonceResponse = await fetch('/api/auth/nonce');
      if (!nonceResponse.ok) {
        throw new Error('Failed to fetch nonce');
      }
      const { nonce } = await nonceResponse.json();

      // Prepare auth options
      const authOptions: WalletAuthOptions = {
        nonce,
        statement: 'Connect to Enhanced MiniApp',
        uri: window.location.origin,
        version: '1',
        chainId: 1,
        expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        ...customAuthOptions
      };

      // Connect wallet
      const result = await wallet.connect(authOptions);
      
      if (result.status === 'success' && result.address) {
        // Track successful connection
        await analytics.track({
          name: 'wallet_connected',
          properties: {
            address: result.address,
            is_world_app: wallet.isWorldApp,
            connection_method: 'enhanced_sdk'
          }
        });

        // Reset retry count on success
        setRetryCount(0);
        
        // Call success callback
        onConnect?.(result.address);
        
        logger.info('Enhanced wallet connected successfully', { address: result.address });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setConnectionError(errorMessage);
      setRetryCount(prev => prev + 1);
      
      // Track connection error
      await analytics.track({
        name: 'wallet_connect_error',
        properties: {
          error_message: errorMessage,
          retry_count: retryCount,
          is_world_app: wallet.isWorldApp
        }
      });
      
      logger.error('Enhanced wallet connection failed', { error: String(error) });
    } finally {
      setIsConnecting(false);
    }
  }, [isReady, isConnecting, wallet, analytics, retryCount, customAuthOptions, onConnect]);

  // Handle wallet disconnection
  const handleDisconnect = useCallback(async () => {
    try {
      await wallet.disconnect();
      setBalance('0');
      setConnectionError(null);
      setRetryCount(0);
      
      // Track disconnection
      await analytics.track({
        name: 'wallet_disconnected',
        properties: {
          is_world_app: wallet.isWorldApp
        }
      });
      
      onDisconnect?.();
      logger.info('Enhanced wallet disconnected');
    } catch (error) {
      logger.error('Enhanced wallet disconnection failed', { error: String(error) });
    }
  }, [wallet, analytics, onDisconnect]);

  // Handle chain switching
  const handleSwitchChain = useCallback(async (chainId: number) => {
    try {
      await wallet.switchChain(chainId);
      
      // Track chain switch
      await analytics.track({
        name: 'wallet_chain_switched',
        properties: {
          chain_id: chainId,
          address: wallet.state.address
        }
      });
      
      // Reload balance after chain switch
      if (showBalance) {
        await loadBalance();
      }
    } catch (error) {
      logger.error('Chain switch failed', { error: String(error) });
      setConnectionError('Failed to switch chain');
    }
  }, [wallet, analytics, showBalance, loadBalance]);

  // Retry connection
  const handleRetry = useCallback(() => {
    setConnectionError(null);
    handleConnect();
  }, [handleConnect]);

  // Format address for display
  const formatAddress = useCallback((address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  // Format balance for display
  const formatBalance = useCallback((bal: string) => {
    if (bal === 'Error') return 'Error';
    const num = parseFloat(bal);
    if (isNaN(num)) return '0';
    return num.toFixed(4);
  }, []);

  // Render loading state
  if (!isReady) {
    return (
      <div className={`enhanced-wallet-connect loading ${className}`}>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Initializing wallet...</span>
        </div>
      </div>
    );
  }

  // Render World App requirement for non-World App environments
  if (!wallet.isWorldApp && !wallet.isDevelopment) {
    return (
      <div className={`enhanced-wallet-connect world-app-required ${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                World App Required
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                This application requires World App to function properly. Please open this app in World App.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render connected state
  if (wallet.state.isConnected && wallet.state.address) {
    return (
      <div className={`enhanced-wallet-connect connected ${className}`}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-3 w-3 bg-green-400 rounded-full"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Connected: {formatAddress(wallet.state.address)}
                </p>
                {showBalance && (
                  <p className="text-sm text-green-600">
                    Balance: {formatBalance(balance)} ETH
                  </p>
                )}
                {showChainInfo && (
                  <p className="text-xs text-green-500">
                    Chain: Ethereum Mainnet
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              {showBalance && (
                <button
                  onClick={loadBalance}
                  className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded transition-colors"
                >
                  Refresh
                </button>
              )}
              <button
                onClick={handleDisconnect}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
          
          {showChainInfo && (
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => handleSwitchChain(1)}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
              >
                Mainnet
              </button>
              <button
                onClick={() => handleSwitchChain(11155111)}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
              >
                Sepolia
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render connection error state
  if (connectionError) {
    return (
      <div className={`enhanced-wallet-connect error ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Connection Failed
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  {connectionError}
                </p>
                {retryCount > 0 && (
                  <p className="text-xs text-red-600">
                    Attempt {retryCount + 1} of 3
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleRetry}
              disabled={retryCount >= 3}
              className="text-sm bg-red-100 hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 text-red-800 px-3 py-1 rounded transition-colors"
            >
              {retryCount >= 3 ? 'Max Retries' : 'Retry'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render connect button
  return (
    <div className={`enhanced-wallet-connect disconnected ${className}`}>
      <button
        onClick={handleConnect}
        disabled={isConnecting || !isReady}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
      >
        {isConnecting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Connecting...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Connect Wallet
          </>
        )}
      </button>
      
      {wallet.isDevelopment && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          Development mode: Enhanced wallet features available
        </p>
      )}
    </div>
  );
}

export default EnhancedWalletConnect;