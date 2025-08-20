'use client';

import { PoolStatsDashboard, UserAccountStats, LotteryDrawManager, WalletConnect } from '../components';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎰 Jackpot WLD
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Decentralized Prize Pool powered by World ID
          </p>
          <p className="text-gray-500">
            Deposit WLD tokens, earn yield, and win prizes!
          </p>
        </div>

        {/* Wallet Connection */}
        <WalletConnect className="mb-8" />

        {/* Navigation Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/deposit" className="block">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200">
              <div className="text-center">
                <div className="text-3xl mb-3">💰</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Deposit</h3>
                <p className="text-gray-600">Add WLD tokens to the prize pool</p>
              </div>
            </div>
          </Link>
          
          <Link href="/withdraw" className="block">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200">
              <div className="text-center">
                <div className="text-3xl mb-3">💸</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Withdraw</h3>
                <p className="text-gray-600">Withdraw your deposited tokens</p>
              </div>
            </div>
          </Link>
          
          <Link href="/admin" className="block">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200">
              <div className="text-center">
                <div className="text-3xl mb-3">⚙️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Admin</h3>
                <p className="text-gray-600">Manage pool and draws</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Pool Statistics Dashboard */}
        <PoolStatsDashboard className="mb-8" />

        {/* User Account Statistics */}
        <UserAccountStats className="mb-8" />

        {/* Lottery Draw Manager */}
        <LotteryDrawManager className="mb-8" />

        {/* App Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">How it works</h2>
            <div className="space-y-3 text-gray-600">
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mt-0.5">1</span>
                <p>Verify your World ID to ensure one person, one entry</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mt-0.5">2</span>
                <p>Deposit WLD tokens into the prize pool</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mt-0.5">3</span>
                <p>Earn yield on your deposits automatically</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mt-0.5">4</span>
                <p>Win prizes in regular lottery draws</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Features</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>World ID Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Yield Generation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Fair Lottery</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>Decentralized</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
