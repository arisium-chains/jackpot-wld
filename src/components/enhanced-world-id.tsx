/**
 * Enhanced World ID Verification Component
 * Comprehensive World ID integration with advanced features
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useEnhancedWorldID, useEnhancedAnalytics, useEnhancedWallet } from '../providers/enhanced-minikit-provider';
import { WorldIDVerificationOptions, WorldIDResponse, WorldIDProof, SDKError } from '../types/miniapp-sdk';
import { logger } from '../lib/logger';

/**
 * Enhanced World ID Props
 */
interface EnhancedWorldIDProps {
  action?: string;
  signal?: string;
  onSuccess?: (proof: WorldIDProof) => void;
  onError?: (error: SDKError) => void;
  onVerificationUpdate?: (status: string) => void;
  className?: string;
  showVerificationHistory?: boolean;
  requireUniqueHuman?: boolean;
  customActionText?: string;
  autoVerify?: boolean;
}

/**
 * Verification status types
 */
type VerificationStatus = 'idle' | 'verifying' | 'verified' | 'failed' | 'expired';

/**
 * Verification history item
 */
interface VerificationHistoryItem {
  id: string;
  action: string;
  timestamp: Date;
  status: VerificationStatus;
  proof?: WorldIDProof;
  error?: string;
}

/**
 * Enhanced World ID Component
 */
export function EnhancedWorldID({
  action = 'verify-human',
  signal = '',
  onSuccess,
  onError,
  onVerificationUpdate,
  className = '',
  showVerificationHistory = true,
  requireUniqueHuman = true,
  customActionText,
  autoVerify = false
}: EnhancedWorldIDProps) {
  // Hooks
  const worldID = useEnhancedWorldID();
  const analytics = useEnhancedAnalytics();
  const wallet = useEnhancedWallet();

  // Component state
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [currentProof, setCurrentProof] = useState<WorldIDProof | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistoryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customSignal, setCustomSignal] = useState(signal);
  const [customAction, setCustomAction] = useState(action);
  const [requireUniqueHumanState, setRequireUniqueHuman] = useState(requireUniqueHuman);

  // Load verification history
  useEffect(() => {
    if (showVerificationHistory) {
      loadVerificationHistory();
    }
  }, [showVerificationHistory]);

  // Auto-verify if enabled
  useEffect(() => {
    if (autoVerify && verificationStatus === 'idle' && !isProcessing) {
      handleVerification();
    }
  }, [autoVerify, verificationStatus, isProcessing]);

  // Update verification status callback
  useEffect(() => {
    onVerificationUpdate?.(verificationStatus);
  }, [verificationStatus, onVerificationUpdate]);

  // Load verification history
  const loadVerificationHistory = useCallback(async () => {
    try {
      // This would typically load from local storage or API
      const stored = localStorage.getItem('worldid-verification-history');
      if (stored) {
        const history = JSON.parse(stored).map((item: {
          id: string;
          action: string;
          timestamp: string;
          status: VerificationStatus;
          proof?: WorldIDProof;
          error?: string;
        }) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setVerificationHistory(history);
      }
    } catch (error) {
      logger.error('Failed to load verification history', { error: String(error) });
    }
  }, []);

  // Save verification to history
  const saveVerificationToHistory = useCallback((item: Omit<VerificationHistoryItem, 'id'>) => {
    const historyItem: VerificationHistoryItem = {
      ...item,
      id: `verification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const updatedHistory = [historyItem, ...verificationHistory].slice(0, 10); // Keep last 10
    setVerificationHistory(updatedHistory);

    // Save to localStorage
    try {
      localStorage.setItem('worldid-verification-history', JSON.stringify(updatedHistory));
    } catch (error) {
      logger.error('Failed to save verification history', { error: String(error) });
    }
  }, [verificationHistory]);

  // Handle verification
  const handleVerification = useCallback(async () => {
    if (isProcessing || verificationStatus === 'verifying') {
      return;
    }

    setIsProcessing(true);
    setVerificationStatus('verifying');
    setVerificationError(null);
    setCurrentProof(null);

    try {
      // Track verification attempt
      await analytics.track({
        name: 'worldid_verification_attempt',
        properties: {
          action: customAction,
          has_signal: !!customSignal,
          require_unique_human: requireUniqueHuman,
          wallet_connected: wallet.state.isConnected,
          wallet_address: wallet.state.address
        }
      });

      // Prepare verification options
      const verificationOptions: WorldIDVerificationOptions = {
        action: customAction,
        signal: customSignal || undefined
      };

      // Execute verification
      const response = await worldID.verify(verificationOptions);

      if (response && response.proof) {
        setVerificationStatus('verified');
        setCurrentProof(response.proof);

        // Track successful verification
        await analytics.track({
          name: 'worldid_verification_success',
          properties: {
            action: customAction,
            nullifier_hash: response.proof.nullifier_hash,
            verification_level: response.proof.verification_level || 'orb'
          }
        });

        // Save to history
        saveVerificationToHistory({
          action: customAction,
          timestamp: new Date(),
          status: 'verified',
          proof: response.proof
        });

        // Call success callback
        onSuccess?.(response.proof);

        logger.info('World ID verification completed successfully', { proof: response.proof });
      } else {
        throw new Error('Verification failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed';
      setVerificationStatus('failed');
      setVerificationError(errorMessage);

      // Track verification error
      await analytics.track({
        name: 'worldid_verification_error',
        properties: {
          error_message: errorMessage,
          action: customAction,
          has_signal: !!customSignal
        }
      });

      // Save to history
      saveVerificationToHistory({
        action: customAction,
        timestamp: new Date(),
        status: 'failed',
        error: errorMessage
      });

      // Call error callback
      if (error instanceof Error) {
        onError?.({
          code: 'VERIFICATION_FAILED',
          message: errorMessage,
          timestamp: new Date()
        });
      }

      logger.error('World ID verification failed', { error: String(error) });
    } finally {
      setIsProcessing(false);
    }
  }, [customAction, customSignal, requireUniqueHuman, isProcessing, verificationStatus, worldID, analytics, wallet.state, onSuccess, onError, saveVerificationToHistory]);

  // Reset verification
  const resetVerification = useCallback(() => {
    setVerificationStatus('idle');
    setCurrentProof(null);
    setVerificationError(null);
  }, []);

  // Format nullifier hash for display
  const formatNullifierHash = useCallback((hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  }, []);

  // Format timestamp for display
  const formatTimestamp = useCallback((timestamp: Date) => {
    return timestamp.toLocaleString();
  }, []);

  // Get status icon
  const getStatusIcon = useCallback((status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return (
          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'verifying':
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
    }
  }, []);

  return (
    <div className={`enhanced-world-id ${className}`}>
      {/* Verification Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            World ID Verification
          </h2>
          <div className="flex items-center space-x-2">
            {getStatusIcon(verificationStatus)}
            <span className={`text-sm font-medium ${
              verificationStatus === 'verified' ? 'text-green-600' :
              verificationStatus === 'failed' ? 'text-red-600' :
              verificationStatus === 'verifying' ? 'text-blue-600' :
              'text-gray-600'
            }`}>
              {verificationStatus === 'verified' ? 'Verified' :
               verificationStatus === 'failed' ? 'Failed' :
               verificationStatus === 'verifying' ? 'Verifying...' :
               'Not Verified'}
            </span>
          </div>
        </div>

        {/* Verification Error */}
        {verificationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{verificationError}</span>
            </div>
          </div>
        )}

        {/* Current Proof Display */}
        {currentProof && verificationStatus === 'verified' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-green-800 mb-2">
              Verification Proof
            </h3>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Nullifier:</strong> {formatNullifierHash(currentProof.nullifier_hash)}</p>
              <p><strong>Merkle Root:</strong> {formatNullifierHash(currentProof.merkle_root)}</p>
              <p><strong>Verification Level:</strong> {currentProof.verification_level || 'orb'}</p>
              <p><strong>Action:</strong> {customAction}</p>
            </div>
          </div>
        )}

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
            <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Action
                </label>
                <input
                  type="text"
                  value={customAction}
                  onChange={(e) => setCustomAction(e.target.value)}
                  placeholder="verify-human"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Signal
                </label>
                <input
                  type="text"
                  value={customSignal}
                  onChange={(e) => setCustomSignal(e.target.value)}
                  placeholder="Optional signal data"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="require-unique"
                  checked={requireUniqueHumanState}
                  onChange={(e) => setRequireUniqueHuman(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="require-unique" className="ml-2 text-sm text-gray-700">
                  Require unique human verification
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {verificationStatus === 'idle' || verificationStatus === 'failed' ? (
            <button
              onClick={handleVerification}
              disabled={isProcessing || worldID.status === 'verifying'}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isProcessing || worldID.status === 'verifying' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Verifying...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {customActionText || 'Verify with World ID'}
                </>
              )}
            </button>
          ) : verificationStatus === 'verified' ? (
            <button
              onClick={resetVerification}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Verify Again
            </button>
          ) : null}
        </div>
      </div>

      {/* Verification History */}
      {showVerificationHistory && verificationHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Verification History
          </h3>
          <div className="space-y-3">
            {verificationHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {item.action}
                    </span>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.status)}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.status === 'verified' ? 'bg-green-100 text-green-800' :
                        item.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(item.timestamp)}
                    </span>
                    {item.proof && (
                      <span className="text-xs text-gray-600">
                        {formatNullifierHash(item.proof.nullifier_hash)}
                      </span>
                    )}
                  </div>
                  {item.error && (
                    <p className="text-xs text-red-600 mt-1">{item.error}</p>
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

export default EnhancedWorldID;