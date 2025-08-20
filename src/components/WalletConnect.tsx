'use client';

import { useWallet } from '../contexts/WalletContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Wallet, LogOut, CheckCircle, AlertCircle } from 'lucide-react';

interface WalletConnectProps {
  className?: string;
}

export function WalletConnect({ className = '' }: WalletConnectProps) {
  const { isConnected, address, isLoading, connect, disconnect, error, isInWorldApp } = useWallet();



  // Show error state if not in World App
  if (!isInWorldApp) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const hasValidAppId = process.env.NEXT_PUBLIC_WORLD_APP_ID && 
      !process.env.NEXT_PUBLIC_WORLD_APP_ID.includes('__FROM_DEV_PORTAL__') &&
      !process.env.NEXT_PUBLIC_WORLD_APP_ID.includes('app_staging_123456789');
    
    // In development with invalid app ID, this shouldn't show due to effectiveIsInWorldApp logic
    // But if it does show, provide helpful development message
    if (isDevelopment && !hasValidAppId) {
      return (
        <Card className={`p-6 ${className}`}>
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold">Development Mode</h3>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Configure World App ID in .env.local or use mock wallet for development
            </p>
            <Button onClick={connect} disabled={isLoading} className="w-full">
              {isLoading ? 'Connecting...' : 'Use Mock Wallet'}
            </Button>
          </div>
        </Card>
      );
    }
    
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-6 w-6 text-orange-600" />
            <h3 className="text-lg font-semibold">World App Required</h3>
          </div>
          <p className="text-sm text-gray-600 text-center">
            This mini app must be opened in World App to connect your wallet
          </p>
          <Button disabled className="w-full">
            Open in World App
          </Button>
        </div>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2">
            <Wallet className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
          </div>
          <p className="text-sm text-gray-600 text-center">
            Connect your World App wallet to start depositing and earning prizes
          </p>
          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          <Button 
            onClick={connect} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Powered by World App MiniKit
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-600">Wallet Connected</p>
            <p className="text-xs text-gray-600">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
            </p>
          </div>
        </div>
        <Button 
          onClick={disconnect}
          variant="outline"
          size="sm"
          className="flex items-center space-x-1"
        >
          <LogOut className="h-4 w-4" />
          <span>Disconnect</span>
        </Button>
      </div>
    </Card>
  );
}