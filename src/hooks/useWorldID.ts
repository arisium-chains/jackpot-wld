'use client';

import { useState, useCallback } from 'react';
import { ISuccessResult, IErrorState } from '@worldcoin/idkit';
import { WORLD_APP_ID, WORLD_ID_ACTION_ID, WORLDID_ENABLED } from '../constants';
import { WorldIDProof, VerificationResult } from '../types';
import { logger } from '../lib/logger';

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
    const requestId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.worldIdVerification('start', {
      requestId,
      verificationLevel: 'orb'
    }, {
      component: 'useWorldID',
      action: 'verify',
      worldIdEnabled: WORLDID_ENABLED,
      appId: WORLD_APP_ID,
      actionId: WORLD_ID_ACTION_ID
    });

    if (!WORLDID_ENABLED) {
      logger.info('World ID disabled, using mock verification', {
        component: 'useWorldID',
        action: 'mockVerification',
        requestId
      });
      
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

        logger.worldIdVerification('success', {
          requestId,
          verificationLevel: 'orb',
          nullifierHash: mockProof.nullifier_hash,
          merkleRoot: mockProof.merkle_root
        }, {
          component: 'useWorldID',
          action: 'mockVerificationSuccess'
        });

        setVerificationResult(verificationData);
        setIsVerified(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown verification error';
        
        logger.worldIdVerification('error', {
          requestId,
          error: errorMessage
        }, {
          component: 'useWorldID',
          action: 'mockVerificationError',
          errorStack: err instanceof Error ? err.stack : undefined
        });
        
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
      const configError = 'World ID configuration missing';
      
      logger.worldIdVerification('error', {
        requestId,
        error: configError
      }, {
        component: 'useWorldID',
        action: 'configurationError',
        hasAppId: !!WORLD_APP_ID,
        hasActionId: !!WORLD_ID_ACTION_ID
      });
      
      setError(configError);
      return;
    }

    logger.info('Opening IDKit for World ID verification', {
      component: 'useWorldID',
      action: 'openIDKit',
      requestId,
      appId: WORLD_APP_ID,
      actionId: WORLD_ID_ACTION_ID
    });
    
    setShowIDKit(true);
  }, []);

  const handleIDKitSuccess = useCallback(async (result: ISuccessResult) => {
    const requestId = `idkit_success_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.worldIdVerification('success', {
      requestId,
      verificationLevel: result.verification_level,
      nullifierHash: result.nullifier_hash,
      merkleRoot: result.merkle_root,
      proof: result.proof.slice(0, 20) + '...' // Log only first 20 chars for security
    }, {
      component: 'useWorldID',
      action: 'idkitSuccess'
    });
    
    setIsVerifying(true);
    setShowIDKit(false);
    setError(null);

    try {
      logger.apiRequest('POST', '/api/worldid/verify', {
        hasProof: !!result.proof,
        hasNullifierHash: !!result.nullifier_hash,
        hasMerkleRoot: !!result.merkle_root,
        verificationLevel: result.verification_level,
        component: 'useWorldID',
        action: 'serverVerification',
        requestId
      });
      
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
      
      logger.apiResponse('POST', '/api/worldid/verify', response.status, {
        ...verificationData,
        component: 'useWorldID',
        action: 'serverVerificationResponse',
        requestId
      });

      if (verificationData.success) {
        logger.worldIdVerification('success', {
          requestId,
          nullifierHash: verificationData.proof?.nullifier_hash,
          merkleRoot: verificationData.proof?.merkle_root,
          verificationLevel: verificationData.proof?.verification_level
        }, {
          component: 'useWorldID',
          action: 'verificationSuccess'
        });
        
        setVerificationResult(verificationData);
        setIsVerified(true);
      } else {
        const errorMessage = verificationData.error || 'Verification failed';
        
        logger.worldIdVerification('error', {
          requestId,
          error: errorMessage
        }, {
          component: 'useWorldID',
          action: 'verificationFailed',
          errorCode: verificationData.code,
          detail: verificationData.detail
        });
        
        setError(errorMessage);
        setVerificationResult({
          success: false,
          error: verificationData.error,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification request failed';
      
      logger.worldIdVerification('error', {
        requestId,
        error: errorMessage
      }, {
        component: 'useWorldID',
        action: 'verificationRequestError',
        errorStack: err instanceof Error ? err.stack : undefined,
        isNetworkError: err instanceof TypeError && err.message.includes('fetch')
      });
      
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
    const requestId = `idkit_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.worldIdVerification('error', {
      requestId,
      error: error.message || 'IDKit verification failed'
    }, {
      component: 'useWorldID',
      action: 'idkitError',
      errorDetails: error,
      errorCode: error.code,
      errorType: 'idkit_error'
    });
    
    setShowIDKit(false);
    setError(error.message || 'Verification failed');
    setVerificationResult({
      success: false,
      error: error.message,
    });
  }, []);

  const reset = useCallback(() => {
    const requestId = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('Resetting World ID verification state', {
      component: 'useWorldID',
      action: 'reset',
      requestId,
      wasVerified: isVerified,
      hadError: !!error
    });
    
    setIsVerifying(false);
    setIsVerified(false);
    setVerificationResult(null);
    setError(null);
    setShowIDKit(false);
  }, [isVerified, error]);

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