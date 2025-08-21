'use client';

import { Wallet, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Alert } from './ui/alert';

interface AuthButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

export function AuthButton({ onClick, isLoading = false, error, className = '' }: AuthButtonProps) {
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
          <Alert variant="destructive" className="w-full">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </Alert>
        )}
        
        <Button 
          onClick={onClick} 
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
        
        <p className="text-xs text-gray-500 text-center">
          Powered by World App MiniKit
        </p>
      </div>
    </Card>
  );
}

export default AuthButton;