'use client';

import { useState, useCallback } from 'react';
import { ISuccessResult, IErrorState } from '@worldcoin/idkit';
import { WORLD_APP_ID, WORLD_ID_ACTION_ID, WORLDID_ENABLED } from '../constants';
import { WorldIDProof, VerificationResult } from '../types';

export interface UseWorldIDReturn {
  isVerifying: boolean;
  isVerified: boolean;
  verificationResult: VerificationResult | null;
  error: string | null;
  verify: () => Promise<void>;
  reset: () => void;
  showIDKit: boolean;
  setShowIDKit: (show: boolean) => void;
  handleIDKitSuccess: (result: ISuccessResult) => Promise<void>;
  handleIDKitError: (error: IErrorState) => void;
}

export function useWorldID(): UseWorldIDReturn {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showIDKit, setShowIDKit] = useState(false);

  const verify = useCallback(async () => {
    if (!WORLDID_ENABLED) {
      // Fallback to POC mock verification when World ID is disabled
      setIsVerifying(true);
      setError(null);

      try {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate verification delay
        
        const mockProof: WorldIDProof = {
          merkle_root: '0x' + '1'.repeat(64),
          nullifier_hash: '0x' + '2'.repeat(64),
          proof: '0x' + '3'.repeat(512),
          verification_level: 'orb',
        };

        const verificationData: VerificationResult = {
          proof: mockProof,
          success: true,
        };

        setVerificationResult(verificationData);
        setIsVerified(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown verification error';
        setError(errorMessage);
        setVerificationResult({
          success: false,
          error: errorMessage,
        });
      } finally {
        setIsVerifying(false);
      }
      return;
    }

    // Real World ID verification
    if (!WORLD_APP_ID || !WORLD_ID_ACTION_ID) {
      setError('World ID configuration missing');
      return;
    }

    setShowIDKit(true);
  }, []);

  const handleIDKitSuccess = useCallback(async (result: ISuccessResult) => {
    setIsVerifying(true);
    setShowIDKit(false);
    setError(null);

    try {
      // Verify the proof server-side
      const response = await fetch('/api/worldid/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
           proof: result.proof,
           nullifier_hash: result.nullifier_hash,
           merkle_root: result.merkle_root,
           verification_level: result.verification_level,
         }),
      });

      const verificationData = await response.json();

      if (verificationData.success) {
        setVerificationResult(verificationData);
        setIsVerified(true);
      } else {
        setError(verificationData.error || 'Verification failed');
        setVerificationResult({
          success: false,
          error: verificationData.error,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification request failed';
      setError(errorMessage);
      setVerificationResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsVerifying(false);
    }
  }, []);

  const handleIDKitError = useCallback((error: IErrorState) => {
    setShowIDKit(false);
    setError(error.message || 'Verification failed');
    setVerificationResult({
      success: false,
      error: error.message,
    });
  }, []);

  const reset = useCallback(() => {
    setIsVerifying(false);
    setIsVerified(false);
    setVerificationResult(null);
    setError(null);
    setShowIDKit(false);
  }, []);

  return {
    isVerifying,
    isVerified,
    verificationResult,
    error,
    verify,
    reset,
    showIDKit,
    setShowIDKit,
    handleIDKitSuccess,
    handleIDKitError,
  };
}

// Helper function to validate World ID proof
export function validateWorldIDProof(proof: WorldIDProof): boolean {
  return !!(
    proof.merkle_root &&
    proof.nullifier_hash &&
    proof.proof &&
    proof.verification_level
  );
}

// Helper function to check if user is verified
export function isUserVerified(verificationResult: VerificationResult | null): boolean {
  return !!(
    verificationResult &&
    verificationResult.success &&
    verificationResult.proof &&
    validateWorldIDProof(verificationResult.proof)
  );
}