'use client';

import React, { useState } from 'react';
import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit';
import { useWorldID } from '../hooks/useWorldID';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, Shield, Loader2, AlertCircle } from 'lucide-react';
import { WORLD_APP_ID, WORLD_ID_ACTION_ID, WORLDID_ENABLED } from '../constants';

interface WorldIDVerificationProps {
  onVerificationComplete?: (verified: boolean) => void;
  className?: string;
}

export function WorldIDVerification({ onVerificationComplete, className }: WorldIDVerificationProps) {
  const [signal, setSignal] = useState<string>('');
  
  const { 
    isVerifying, 
    isVerified, 
    verificationResult, 
    error, 
    verify, 
    reset, 
    showIDKit, 
    handleIDKitSuccess, 
    handleIDKitError 
  } = useWorldID();

  const handleVerify = async () => {
    await verify();
    if (onVerificationComplete) {
      onVerificationComplete(isVerified);
    }
  };

  const handleReset = () => {
    reset();
    setSignal('');
    if (onVerificationComplete) {
      onVerificationComplete(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          World ID Verification
        </CardTitle>
        <CardDescription>
          Verify your World ID to participate in the prize pool. This ensures one person, one entry.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isVerified && verificationResult?.success ? (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully verified! You can now participate in the prize pool.
              </AlertDescription>
            </Alert>
            
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p className="font-medium mb-2">Verification Details:</p>
              <div className="space-y-1 text-gray-600">
                <p>Level: {verificationResult.proof?.verification_level}</p>
                <p>Nullifier: {verificationResult.proof?.nullifier_hash.slice(0, 10)}...</p>
              </div>
            </div>

            <Button 
              onClick={handleReset} 
              variant="outline" 
              className="w-full"
            >
              Reset Verification
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {WORLDID_ENABLED && (
              <div className="space-y-2">
                <label htmlFor="signal" className="text-sm font-medium">
                  Signal (Optional)
                </label>
                <input
                  id="signal"
                  type="text"
                  value={signal}
                  onChange={(e) => setSignal(e.target.value)}
                  placeholder="Enter a custom signal for this verification"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isVerifying}
                />
                <p className="text-xs text-gray-500">
                  The signal helps prevent replay attacks and can be used to bind this verification to a specific action.
                </p>
              </div>
            )}

            <Button 
              onClick={handleVerify} 
              disabled={isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  {WORLDID_ENABLED ? 'Verify with World ID' : 'Mock Verify (Development)'}
                </>
              )}
            </Button>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• World ID verification ensures one unique human per entry</p>
              <p>• Your privacy is protected - no personal information is shared</p>
              <p>• Verification is required to deposit and participate in draws</p>
              {!WORLDID_ENABLED && (
                <p className="text-orange-600">• Development mode: Using mock verification</p>
              )}
            </div>
          </div>
        )}
        
        {/* IDKit Widget for real World ID verification */}
        {WORLDID_ENABLED && showIDKit && (
          <IDKitWidget
            app_id={WORLD_APP_ID as `app_${string}`}
            action={WORLD_ID_ACTION_ID}
            signal={signal || 'default-signal'}
            onSuccess={handleIDKitSuccess}
            onError={handleIDKitError}
            verification_level={VerificationLevel.Device}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default WorldIDVerification;