'use client';

import { Wallet, AlertCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Alert } from './ui/alert';
import { useMiniKitWallet } from '../hooks/useMiniKitWallet';
import { RecoveryAction } from '../lib/error-handler';

interface AuthButtonProps {
  onClick?: () => void;
  className?: string;
}

export function AuthButton({ onClick, className = '' }: AuthButtonProps) {
  const { 
    status, 
    error, 
    enhancedError, 
    canRetry, 
    retryCount,
    beginAuth, 
    retry, 
    getRecoveryInstructions 
  } = useMiniKitWallet();

  const isLoading = status === 'authing';
  const hasError = status === 'error';
  const recoveryInstructions = getRecoveryInstructions?.();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      beginAuth();
    }
  };

  const handleRetry = () => {
    retry();
  };

  const handleRefreshPage = () => {
    window.location.reload();
  };

  const handleOpenWorldApp = () => {
    // Try to open in World App if possible
    const currentUrl = window.location.href;
    const worldAppUrl = `https://worldcoin.org/apps?url=${encodeURIComponent(currentUrl)}`;
    window.open(worldAppUrl, '_blank');
  };

  const renderRecoveryButton = () => {
    if (!recoveryInstructions || !canRetry) return null;

    switch (recoveryInstructions.action) {
      case RecoveryAction.RETRY:
        return (
          <Button 
            onClick={handleRetry} 
            variant="outline"
            className="w-full flex items-center space-x-2"
            disabled={retryCount >= 3}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
            {retryCount > 0 && <span className="text-xs">({retryCount}/3)</span>}
          </Button>
        );
      
      case RecoveryAction.WAIT_AND_RETRY:
        return (
          <div className="w-full space-y-2">
            <Button 
              onClick={handleRetry} 
              variant="outline"
              className="w-full flex items-center space-x-2"
              disabled={true}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Please wait...</span>
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Retry available in {Math.ceil((recoveryInstructions.delay || 0) / 1000)} seconds
            </p>
          </div>
        );
      
      case RecoveryAction.REFRESH_PAGE:
        return (
          <Button 
            onClick={handleRefreshPage} 
            variant="outline"
            className="w-full flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Page</span>
          </Button>
        );
      
      case RecoveryAction.OPEN_WORLD_APP:
        return (
          <Button 
            onClick={handleOpenWorldApp} 
            variant="outline"
            className="w-full flex items-center space-x-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Open in World App</span>
          </Button>
        );
      
      default:
        return null;
    }
  };

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
        
        {hasError && enhancedError && (
          <Alert variant="destructive" className="w-full">
            <AlertCircle className="h-4 w-4" />
            <div className="space-y-2">
              <span className="font-medium">{enhancedError.userMessage}</span>
              {recoveryInstructions && (
                <p className="text-sm opacity-90">
                  {recoveryInstructions.message}
                </p>
              )}
              {enhancedError.details && process.env.NODE_ENV === 'development' && (
                <details className="text-xs mt-2">
                  <summary className="cursor-pointer">Technical Details</summary>
                  <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(enhancedError.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </Alert>
        )}
        
        {hasError && error && !enhancedError && (
          <Alert variant="destructive" className="w-full">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </Alert>
        )}
        
        {hasError && canRetry ? (
          renderRecoveryButton()
        ) : (
          <Button 
            onClick={handleClick} 
            disabled={isLoading}
            className="w-full flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4" />
                <span>Connect Wallet</span>
              </>
            )}
          </Button>
        )}
        
        <p className="text-xs text-gray-500 text-center">
          Powered by World App MiniKit
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 text-center space-y-1">
            <p>Status: {status}</p>
            {retryCount > 0 && <p>Retry Count: {retryCount}</p>}
          </div>
        )}
      </div>
    </Card>
  );
}

export default AuthButton;