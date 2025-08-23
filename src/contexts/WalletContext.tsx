'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { useMiniKit } from '@/providers';
import { logger } from '../lib/logger';

// Define our own types based on expected MiniKit response structure
interface WalletAuthSuccess {
  status: 'success';
  message?: string;
  siwe_message?: string;
  signature: string;
  address: string;
}

interface WalletAuthError {
  status: 'error';
  details?: string;
  error_message?: string;
}

type AuthResult = WalletAuthSuccess | WalletAuthError | null;

interface WalletState {
  isConnected: boolean;
  address: string | null;
  isLoading: boolean;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
  isInWorldApp: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    isLoading: false
  });
  const [error, setError] = useState<string | null>(null);
  
  // Check if running in World App using the MiniKitProvider state
  const miniKit = useMiniKit();
  const isInWorldApp = miniKit.isInstalled;
  
  // For development: allow bypass based on dev mode setting
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  const hasValidAppId = process.env.NEXT_PUBLIC_WORLD_APP_ID && 
    !process.env.NEXT_PUBLIC_WORLD_APP_ID.includes('__FROM_DEV_PORTAL__') &&
    !process.env.NEXT_PUBLIC_WORLD_APP_ID.includes('app_staging_123456789');
  
  // In development mode, simulate World App environment for testing
  const effectiveIsInWorldApp = (isDevelopment && isDevMode) ? true : isInWorldApp;
  
  console.log('Wallet Context Debug:', {
    isDevelopment,
    isDevMode,
    hasValidAppId,
    isInWorldApp,
    effectiveIsInWorldApp,
    appId: process.env.NEXT_PUBLIC_WORLD_APP_ID
  });

  useEffect(() => {
    // Check for existing wallet connection on mount
    if (effectiveIsInWorldApp) {
      // In a real implementation, you might want to check for stored auth state
      // For now, we'll assume user needs to authenticate each session
    }
  }, [effectiveIsInWorldApp]);

  const connect = async () => {
    const requestId = `wallet_connect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('Wallet connection attempt', {
      component: 'WalletContext',
      action: 'connectAttempt',
      requestId,
      isInWorldApp,
      effectiveIsInWorldApp,
      isDevelopment,
      isDevMode,
      hasValidAppId
    });
    
    if (!effectiveIsInWorldApp) {
      const errorMessage = 'This app must be opened in World App to connect wallet';
      
      logger.walletConnection('error', {
        error: errorMessage,
        walletType: 'world_app'
      }, {
        component: 'WalletContext',
        action: 'connectionError',
        requestId
      });
      
      setError(errorMessage);
      return;
    }
    
    // In development mode, simulate the full SIWE authentication flow
    if (isDevelopment && isDevMode) {
      logger.info('Development mode: Testing full SIWE authentication flow', {
        component: 'WalletContext',
        action: 'devModeAuth',
        requestId
      });
      
      try {
        // Step 1: Generate nonce from backend
        logger.apiRequest('GET', '/api/auth/nonce', {
          component: 'WalletContext',
          action: 'nonceGeneration',
          requestId
        });
        
        const nonceResponse = await fetch('/api/auth/nonce');
        if (!nonceResponse.ok) {
          const errorData = await nonceResponse.json();
          
          logger.apiResponse('GET', '/api/auth/nonce', nonceResponse.status, {
            ...errorData,
            component: 'WalletContext',
            action: 'nonceGenerationError',
            requestId
          });
          
          throw new Error(errorData.message || 'Nonce generation failed');
        }
        const { nonce } = await nonceResponse.json();
        
        logger.apiResponse('GET', '/api/auth/nonce', nonceResponse.status, {
          nonce: nonce.slice(0, 8) + '...',
          component: 'WalletContext',
          action: 'nonceGenerationSuccess',
          requestId
        });
        
        // Step 2: Create a mock SIWE message that matches EIP-4361 format
        const domain = window.location.host;
        const uri = window.location.origin;
        const address = '0x1234567890123456789012345678901234567890';
        const statement = 'Sign in to JackpotWLD to access your account';
        const version = '1';
        const chainId = '480'; // Worldchain mainnet
        const issuedAt = new Date().toISOString();
        const expirationTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
        
        const siweMessage = `${domain} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${uri}
Version: ${version}
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}
Expiration Time: ${expirationTime}`;
        
        logger.info('Mock SIWE message created', {
          component: 'WalletContext',
          action: 'siweMessageCreation',
          requestId,
          address,
          domain,
          chainId,
          messageLength: siweMessage.length
        });
        
        // Step 3: Mock signature (in real app, this comes from World App)
        const mockSignature = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234';
        
        logger.info('Mock signature generated', {
          component: 'WalletContext',
          action: 'mockSignature',
          requestId,
          signatureLength: mockSignature.length
        });
        
        // Step 4: Verify with backend
        logger.apiRequest('POST', '/api/auth/verify', {
          hasMessage: !!siweMessage,
          hasSignature: !!mockSignature,
          hasAddress: !!address,
          hasNonce: !!nonce,
          component: 'WalletContext',
          action: 'signatureVerification',
          requestId
        });
        
        const verifyResponse = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: siweMessage,
            signature: mockSignature,
            address: address,
            nonce: nonce
          }),
        });
        
        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          
          logger.apiResponse('POST', '/api/auth/verify', verifyResponse.status, {
            ...errorData,
            component: 'WalletContext',
            action: 'signatureVerificationError',
            requestId
          });
          
          throw new Error(errorData.message || 'Signature verification failed');
        }
        
        const verifyResult = await verifyResponse.json();
        
        logger.apiResponse('POST', '/api/auth/verify', verifyResponse.status, {
          ...verifyResult,
          component: 'WalletContext',
          action: 'signatureVerificationResponse',
          requestId
        });
        
        if (verifyResult.success) {
          logger.walletConnection('connect', {
            address: address,
            chainId: parseInt(chainId),
            walletType: 'world_app_mock'
          }, {
            component: 'WalletContext',
            action: 'mockAuthSuccess',
            requestId
          });
          
          setWalletState({
            isConnected: true,
            address: address,
            isLoading: false
          });
        } else {
          const errorMessage = verifyResult.message || 'Signature verification failed';
          
          logger.walletConnection('error', {
            error: errorMessage,
            walletType: 'world_app_mock'
          }, {
            component: 'WalletContext',
            action: 'mockAuthFailed',
            requestId
          });
          
          throw new Error(errorMessage);
        }
        return;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Mock authentication failed';
        
        logger.walletConnection('error', {
          error: errorMessage,
          walletType: 'world_app_mock'
        }, {
          component: 'WalletContext',
          action: 'mockAuthError',
          requestId,
          errorStack: err instanceof Error ? err.stack : undefined
        });
        
        throw err;
      }
    }

    setWalletState(prev => ({ ...prev, isLoading: true }));
    setError(null);

    try {
      // Check if MiniKit is properly installed before attempting wallet auth
      if (!MiniKit.isInstalled()) {
        const errorMessage = 'MiniKit is not properly installed. Please ensure you are using the latest version of World App.';
        
        logger.miniKitOperation('walletAuth', 'error', {
          error: errorMessage,
          isInstalled: false
        }, {
          component: 'WalletContext',
          action: 'miniKitNotInstalled',
          requestId
        });
        
        throw new Error(errorMessage);
      }

      // Check if walletAuth command is available
      if (!MiniKit.commandsAsync?.walletAuth) {
        const errorMessage = 'Wallet authentication is not available. Please update your World App.';
        
        logger.miniKitOperation('walletAuth', 'error', {
          error: errorMessage,
          hasWalletAuth: false
        }, {
          component: 'WalletContext',
          action: 'walletAuthUnavailable',
          requestId
        });
        
        throw new Error(errorMessage);
      }

      logger.miniKitOperation('walletAuth', 'start', {
        isInstalled: true,
        hasWalletAuth: true
      }, {
        component: 'WalletContext',
        action: 'walletConnectionStart',
        requestId
      });
      
      // Step 1: Generate nonce from backend
      logger.apiRequest('GET', '/api/auth/nonce', {
        component: 'WalletContext',
        action: 'realNonceGeneration',
        requestId
      });
      
      const nonceResponse = await fetch('/api/auth/nonce');
      if (!nonceResponse.ok) {
        const errorData = await nonceResponse.json();
        
        logger.apiResponse('GET', '/api/auth/nonce', nonceResponse.status, {
          ...errorData,
          component: 'WalletContext',
          action: 'realNonceGenerationError',
          requestId
        });
        
        throw new Error(errorData.message || 'Nonce generation failed');
      }
      const { nonce } = await nonceResponse.json();
      
      logger.apiResponse('GET', '/api/auth/nonce', nonceResponse.status, {
        nonce: nonce.slice(0, 8) + '...',
        component: 'WalletContext',
        action: 'realNonceGenerationSuccess',
        requestId
      });
      
      // Step 2: Create SIWE message according to EIP-4361
      const domain = window.location.host;
      const chainId = '480'; // Worldchain mainnet
      
      logger.info('Calling MiniKit walletAuth', {
        component: 'WalletContext',
        action: 'miniKitWalletAuth',
        requestId,
        domain,
        chainId,
        hasNonce: !!nonce
      });
      
      // Step 3: Call walletAuth with proper SIWE parameters
      const authResult = await MiniKit.commands.walletAuth({
        nonce,
        requestId: '0',
        expirationTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        notBefore: new Date(Date.now() - 60 * 1000), // 1 minute ago
        statement: 'Sign in to JackpotWLD to access your account',
      }) as AuthResult;
      
      logger.info('MiniKit walletAuth response received', {
        component: 'WalletContext',
        action: 'miniKitWalletAuthResponse',
        requestId,
        status: authResult?.status,
        hasAddress: !!(authResult as WalletAuthSuccess)?.address,
        hasSignature: !!(authResult as WalletAuthSuccess)?.signature
      });
      
      if (!authResult) {
        const errorMessage = 'Wallet authentication failed - no response';
        
        logger.miniKitOperation('walletAuth', 'error', {
          error: errorMessage,
          hasResult: false
        }, {
          component: 'WalletContext',
          action: 'noAuthResult',
          requestId
        });
        
        throw new Error(errorMessage);
      }
      
      if (authResult.status === 'success') {
        logger.miniKitOperation('walletAuth', 'success', {
          hasMessage: !!(authResult.message || authResult.siwe_message),
          hasSignature: !!authResult.signature,
          hasAddress: !!authResult.address
        }, {
          component: 'WalletContext',
          action: 'walletAuthSuccess',
          requestId
        });
        
        const siweMessage = authResult.message || authResult.siwe_message;
        if (!siweMessage) {
          const errorMessage = 'No SIWE message received from World App';
          
          logger.walletConnection('error', {
            error: errorMessage,
            walletType: 'world_app'
          }, {
            component: 'WalletContext',
            action: 'noSiweMessage',
            requestId
          });
          
          throw new Error(errorMessage);
        }
        
        logger.info('SIWE message received from World App', {
          component: 'WalletContext',
          action: 'siweMessageReceived',
          requestId,
          messageLength: siweMessage.length,
          address: authResult.address
        });
        
        // Verify signature with backend
        logger.apiRequest('POST', '/api/auth/verify', {
          hasMessage: !!siweMessage,
          hasSignature: !!authResult.signature,
          hasAddress: !!authResult.address,
          hasNonce: !!nonce,
          component: 'WalletContext',
          action: 'realWorldAppVerification',
          requestId
        });
        
        const verifyResponse = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: siweMessage,
            signature: authResult.signature,
            address: authResult.address,
            nonce: nonce
          }),
        });
        
        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          
          logger.apiResponse('POST', '/api/auth/verify', verifyResponse.status, {
            ...errorData,
            component: 'WalletContext',
            action: 'realWorldAppVerificationError',
            requestId
          });
          
          throw new Error(errorData.message || 'Signature verification failed');
        }
        
        const verifyResult = await verifyResponse.json();
        
        logger.apiResponse('POST', '/api/auth/verify', verifyResponse.status, {
          ...verifyResult,
          component: 'WalletContext',
          action: 'realWorldAppVerificationResponse',
          requestId
        });
        
        if (verifyResult.success) {
          logger.walletConnection('connect', {
            address: authResult.address,
            chainId: parseInt(chainId),
            walletType: 'world_app'
          }, {
            component: 'WalletContext',
            action: 'realWorldAppAuthSuccess',
            requestId
          });
          
          setWalletState({
            isConnected: true,
            address: authResult.address,
            isLoading: false
          });
        } else {
          const errorMessage = verifyResult.message || 'Signature verification failed';
          
          logger.walletConnection('error', {
            error: errorMessage,
            walletType: 'world_app'
          }, {
            component: 'WalletContext',
            action: 'realWorldAppVerificationFailed',
            requestId
          });
          
          throw new Error(errorMessage);
        }
      } else {
        // Handle error case
        const errorMessage = authResult.details || authResult.error_message || 'Wallet authentication failed';
        
        logger.miniKitOperation('walletAuth', 'error', {
          error: errorMessage,
          details: authResult.details,
          errorMessage: authResult.error_message
        }, {
          component: 'WalletContext',
          action: 'walletAuthError',
          requestId
        });
        
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      
      logger.walletConnection('error', {
        error: errorMessage,
        walletType: isInWorldApp ? 'world_app' : 'unknown'
      }, {
        component: 'WalletContext',
        action: 'walletConnectionError',
        requestId,
        errorStack: err instanceof Error ? err.stack : undefined
      });
      
      let userFriendlyMessage = 'Failed to connect wallet';
      
      if (err instanceof Error) {
        // Handle specific error types
        if (err.message.includes('User rejected')) {
          userFriendlyMessage = 'Wallet connection was cancelled by user';
        } else if (err.message.includes('Signature verification failed')) {
          userFriendlyMessage = 'Unable to verify wallet signature. Please try again.';
        } else if (err.message.includes('Nonce generation failed')) {
          userFriendlyMessage = 'Authentication service temporarily unavailable. Please try again.';
        } else if (err.message.includes('Network')) {
          userFriendlyMessage = 'Network error. Please check your connection and try again.';
        } else {
          userFriendlyMessage = err.message;
        }
      }
      
      setWalletState({
        isConnected: false,
        address: null,
        isLoading: false
      });
      setError(userFriendlyMessage);
    }
  };

  const disconnect = () => {
    const requestId = crypto.randomUUID();
    
    logger.walletConnection('disconnect', {
      address: walletState.address || undefined,
      walletType: isInWorldApp ? 'world_app' : 'unknown'
    }, {
      component: 'WalletContext',
      action: 'disconnect',
      requestId
    });
    
    setWalletState({
      isConnected: false,
      address: null,
      isLoading: false
    });
    setError(null);
  };

  const value: WalletContextType = {
    ...walletState,
    connect,
    disconnect,
    error,
    isInWorldApp: effectiveIsInWorldApp
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Compatibility hook for components still using wagmi's useAccount pattern
export function useAccount() {
  const { isConnected, address } = useWallet();
  return { isConnected, address };
}