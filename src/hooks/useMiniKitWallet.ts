'use client';

import { useCallback, useEffect, useState } from 'react';
import { AuthenticationManager, AuthState, AuthError } from '../lib/auth-manager';
import { errorHandler, EnhancedError } from '../lib/error-handler';
import { isWorldApp } from '../lib/utils';
import { logger } from '../lib/logger';

// Create singleton authentication manager instance
const authManager = new AuthenticationManager();

// Status type as specified in requirements
type Status = 'idle' | 'authing' | 'ready' | 'error';

// Hook state interface
interface MiniKitWalletState {
  inWorldApp: boolean;
  status: Status;
  address?: `0x${string}`;
  error?: string;
  sessionId?: string;
  enhancedError?: EnhancedError;
  canRetry: boolean;
  retryCount: number;
}

// Hook return interface - matches exact requirements
interface UseMiniKitWalletReturn {
  inWorldApp: boolean;
  status: Status;
  address?: `0x${string}`;
  error?: string;
  sessionId?: string;
  enhancedError?: EnhancedError;
  canRetry: boolean;
  retryCount: number;
  beginAuth(): Promise<void>;
  retry(): void;
  reset(): void;
  getRecoveryInstructions?(): { action: string; message: string; delay?: number } | null;
}

/**
 * Enhanced MiniKit wallet authentication hook
 * Integrates with the new authentication manager and error handling system
 */
export function useMiniKitWallet(): UseMiniKitWalletReturn {
  const [state, setState] = useState<MiniKitWalletState>({
    inWorldApp: false,
    status: 'idle',
    canRetry: true,
    retryCount: 0
  });

  // Environment detection - check if we're in World App
  const checkEnvironment = useCallback(() => {
    const inWorldApp = isWorldApp();
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
    
    // In development mode, simulate being in World App for testing
    const effectiveInWorldApp = inWorldApp || (isDevelopment && isDevMode);
    
    setState(prev => ({
      ...prev,
      inWorldApp: effectiveInWorldApp
    }));
    
    return effectiveInWorldApp;
  }, []);

  // Convert auth manager state to hook state
  const convertAuthState = useCallback((authState: AuthState): Partial<MiniKitWalletState> => {
    let status: Status;
    
    switch (authState.status) {
      case 'idle':
        status = 'idle';
        break;
      case 'connecting':
      case 'authenticating':
        status = 'authing';
        break;
      case 'authenticated':
        status = 'ready';
        break;
      case 'error':
        status = 'error';
        break;
      default:
        status = 'idle';
    }

    return {
      status,
      address: authState.address as `0x${string}` | undefined,
      sessionId: authState.sessionId || undefined,
      error: authState.error?.message,
      enhancedError: authState.error || undefined,
      canRetry: authState.error?.retryable ?? true,
      retryCount: authState.attempts
    };
  }, []);

  // Initialize environment check on mount
  useEffect(() => {
    checkEnvironment();
  }, [checkEnvironment]);

  // Set up authentication manager event listeners
  useEffect(() => {
    const handleStateChange = (data: { current: AuthState }) => {
      const convertedState = convertAuthState(data.current);
      setState(prev => ({ ...prev, ...convertedState }));
    };

    const handleError = (error: AuthError) => {
      logger.walletAuth('error', { 
        code: error.code, 
        message: error.message,
        retryable: error.retryable 
      });
    };

    const handleConnecting = () => {
      logger.walletAuth('connecting', {});
    };

    const handleAuthenticating = (data: { step: string }) => {
      logger.walletAuth('authenticating', { step: data.step });
    };

    const handleAuthenticated = (data: { address: string; sessionId?: string }) => {
      logger.walletAuth('authenticated', { 
        address: data.address, 
        sessionId: data.sessionId 
      });
    };

    // Register event listeners
    authManager.addEventListener('stateChanged', handleStateChange);
    authManager.addEventListener('error', handleError);
    authManager.addEventListener('connecting', handleConnecting);
    authManager.addEventListener('authenticating', handleAuthenticating);
    authManager.addEventListener('authenticated', handleAuthenticated);

    // Initial state sync
    const currentState = convertAuthState(authManager.currentState);
    setState(prev => ({ ...prev, ...currentState }));

    // Cleanup on unmount
    return () => {
      authManager.removeEventListener('stateChanged', handleStateChange);
      authManager.removeEventListener('error', handleError);
      authManager.removeEventListener('connecting', handleConnecting);
      authManager.removeEventListener('authenticating', handleAuthenticating);
      authManager.removeEventListener('authenticated', handleAuthenticated);
    };
  }, [convertAuthState]);

  // Main authentication function
  const beginAuth = useCallback(async (): Promise<void> => {
    logger.walletAuth('begin', {});
    
    try {
      await authManager.authenticate();
    } catch (error) {
      // Error handling is done by the authentication manager
      // Just log for debugging
      logger.walletAuth('auth_failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }, []);

  // Retry function
  const retry = useCallback(() => {
    logger.walletAuth('retry', { retryCount: state.retryCount });
    authManager.retry();
  }, [state.retryCount]);

  // Reset function to clear state
  const reset = useCallback(() => {
    logger.walletAuth('reset', {});
    authManager.reset();
    setState({
      inWorldApp: checkEnvironment(),
      status: 'idle',
      canRetry: true,
      retryCount: 0
    });
  }, [checkEnvironment]);

  // Get recovery instructions
  const getRecoveryInstructions = useCallback(() => {
    if (!state.enhancedError) return null;
    return errorHandler.getRecoveryInstructions(state.enhancedError);
  }, [state.enhancedError]);

  return {
    ...state,
    beginAuth,
    retry,
    reset,
    getRecoveryInstructions
  };
}

export default useMiniKitWallet;