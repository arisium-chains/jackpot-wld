'use client';

import { DepositForm, WorldIDVerification, UserAccountStats } from '../../components';
import Link from 'next/link';

export default function DepositPage() {
  const handleVerificationComplete = (verified: boolean) => {
    console.log('Verification completed:', verified);
  };

  const handleDepositSuccess = (amount: string) => {
    console.log('Deposit successful:', amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            💰 Deposit WLD Tokens
          </h1>
          <p className="text-gray-600">
            Deposit your WLD tokens to participate in the prize pool
          </p>
        </div>

        {/* User Account Stats */}
        <UserAccountStats className="mb-8" />

        {/* World ID Verification */}
        <WorldIDVerification 
          onVerificationComplete={handleVerificationComplete}
          className="mb-8"
        />

        {/* Deposit Form */}
        <DepositForm 
          onDepositSuccess={handleDepositSuccess}
          className=""
        />
      </div>
    </div>
  );
}