'use client';

import { useState } from 'react';
import { DepositForm, WorldIDVerification, UserAccountStats, OpenInWorldAppBanner, AuthButton } from '@/components';
import { Card } from '@/components/ui/card';
import { useMiniKitWallet } from '@/hooks/useMiniKitWallet';

interface VerificationProof {
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  verification_level: string;
}

export default function DepositPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [verificationProof, setVerificationProof] = useState<VerificationProof | null>(null);
  const { inWorldApp, status, address, error, beginAuth } = useMiniKitWallet();

  const handleVerificationComplete = (verified: boolean) => {
    setIsVerified(verified);
    console.log('Verification completed:', verified);
  };

  const handleDepositSuccess = (amount: string) => {
    // Handle successful deposit
    console.log('Deposit successful:', amount);
  };

  // Show banner if not in World App
  if (!inWorldApp) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <OpenInWorldAppBanner />
        </div>
      </div>
    );
  }

  // Show auth button if wallet not connected
  if (status !== 'ready') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Deposit Funds
            </h1>
            <p className="text-gray-600">
              Connect your wallet to start depositing and earning prizes
            </p>
          </div>
          
          <AuthButton 
            onClick={beginAuth}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Deposit Funds
          </h1>
          <p className="text-gray-600">
            Deposit your tokens to start earning prizes in the lottery pool
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Connected: {address}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {!isVerified ? (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Verify Your Identity</h2>
                <WorldIDVerification onVerificationComplete={handleVerificationComplete} />
              </Card>
            ) : (
              <DepositForm 
                 onDepositSuccess={handleDepositSuccess}
               />
            )}
          </div>
          
          <div className="space-y-6">
            <UserAccountStats />
          </div>
        </div>
      </div>
    </div>
  );
}