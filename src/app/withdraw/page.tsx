'use client';

import { WithdrawForm, UserAccountStats } from '../../components';
import Link from 'next/link';

export default function WithdrawPage() {
  const handleWithdrawSuccess = (amount: string) => {
    console.log(`Successfully withdrew ${amount} WLD tokens`);
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
            💸 Withdraw WLD Tokens
          </h1>
          <p className="text-gray-600">
            Withdraw your deposited WLD tokens from the pool
          </p>
        </div>

        {/* User Account Stats */}
        <UserAccountStats className="mb-8" />

        {/* Withdraw Form */}
        <WithdrawForm 
          onWithdrawSuccess={handleWithdrawSuccess}
          className=""
        />
      </div>
    </div>
  );
}