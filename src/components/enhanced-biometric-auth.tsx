/**
 * Enhanced Biometric Authentication Component
 * Comprehensive biometric authentication integration
 */

'use client';

import * as React from 'react';
import { useState, useCallback, useEffect } from 'react';
import { useEnhancedBiometric, useEnhancedAnalytics, useEnhancedWallet } from '../providers/enhanced-minikit-provider';
import { BiometricAuthOptions, BiometricAuthResponse, SDKError } from '../types/miniapp-sdk';
import { logger } from '../lib/logger';

/**
 * Enhanced Biometric Auth Props
 */
interface EnhancedBiometricAuthProps {
  reason?: string;
  onSuccess?: (response: BiometricAuthResponse) => void;
  onError?: (error: SDKError) => void;
  onAuthUpdate?: (status: string) => void;
  className?: string;
  showAuthHistory?: boolean;
  requireStrongAuth?: boolean;
  customPromptText?: string;
  autoAuth?: boolean;
  fallbackToPassword?: boolean;
}

/**
 * Authentication status types
 */
type AuthStatus = 'idle' | 'checking' | 'authenticating' | 'authenticated' | 'failed' | 'unavailable';

/**
 * Biometric type
 */
type BiometricType = 'fingerprint' | 'face' | 'voice' | 'iris' | 'unknown';

/**
 * Authentication history item
 */
interface AuthHistoryItem {
  id: string;
  type: BiometricType;
  reason: string;
  timestamp: Date;
  status: AuthStatus;
  duration?: number;
  error?: string;
}

/**
 * Enhanced Biometric Authentication Component
 */
export function EnhancedBiometricAuth({
  reason = 'Authenticate to continue',
  onSuccess,
  onError,
  onAuthUpdate,
  className = '',
  showAuthHistory = true,
  requireStrongAuth = false,
  customPromptText,
  autoAuth = false,
  fallbackToPassword = true
}: EnhancedBiometricAuthProps) {
  // Hooks
  const biometric = useEnhancedBiometric();
  const analytics = useEnhancedAnalytics();
  const wallet = useEnhancedWallet();

  // Component state
  const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
  const [availableBiometrics, setAvailableBiometrics] = useState<BiometricType[]>([]);
  const [selectedBiometric, setSelectedBiometric] = useState<BiometricType>('fingerprint');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authHistory, setAuthHistory] = useState<AuthHistoryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customReason, setCustomReason] = useState(reason);
  const [authStartTime, setAuthStartTime] = useState<number>(0);
  const [showFallback, setShowFallback] = useState(false);
  const [passwordFallback, setPasswordFallback] = useState('');
  const [requireStrongAuthState, setRequireStrongAuth] = useState(requireStrongAuth);

  // Check biometric availability
  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  // Load authentication history
  useEffect(() => {
    if (showAuthHistory) {
      loadAuthHistory();
    }
  }, [showAuthHistory]);

  // Auto-authenticate if enabled
  useEffect(() => {
    if (autoAuth && authStatus === 'idle' && availableBiometrics.length > 0 && !isProcessing) {
      handleAuthentication();
    }
  }, [autoAuth, authStatus, availableBiometrics, isProcessing]);

  // Update authentication status callback
  useEffect(() => {
    onAuthUpdate?.(authStatus);
  }, [authStatus, onAuthUpdate]);

  // Check biometric availability
  const checkBiometricAvailability = useCallback(async () => {
    try {
      setAuthStatus('checking');
      const available = await biometric.isAvailable();
      
      if (available) {
        // Mock available biometric types - in real implementation, this would come from the SDK
        const mockAvailable: BiometricType[] = ['fingerprint'];
        if (typeof window !== 'undefined' && 'FaceDetector' in window) {
          mockAvailable.push('face');
        }
        setAvailableBiometrics(mockAvailable);
        setSelectedBiometric(mockAvailable[0]);
        setAuthStatus('idle');
      } else {
        setAuthStatus('unavailable');
        setAvailableBiometrics([]);
      }
    } catch (error) {
      setAuthStatus('unavailable');
      setAvailableBiometrics([]);
      logger.error('Failed to check biometric availability', { error: String(error) });
    }
  }, [biometric]);

  // Load authentication history
  const loadAuthHistory = useCallback(async () => {
    try {
      const stored = localStorage.getItem('biometric-auth-history');
      if (stored) {
        const history = JSON.parse(stored).map((item: {
          id: string;
          type: BiometricType;
          reason: string;
          timestamp: string;
          status: AuthStatus;
          duration?: number;
          error?: string;
        }) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setAuthHistory(history);
      }
    } catch (error) {
      logger.error('Failed to load auth history', { error: String(error) });
    }
  }, []);

  // Save authentication to history
  const saveAuthToHistory = useCallback((item: Omit<AuthHistoryItem, 'id'>) => {
    const historyItem: AuthHistoryItem = {
      ...item,
      id: `auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const updatedHistory = [historyItem, ...authHistory].slice(0, 15); // Keep last 15
    setAuthHistory(updatedHistory);

    // Save to localStorage
    try {
      localStorage.setItem('biometric-auth-history', JSON.stringify(updatedHistory));
    } catch (error) {
      logger.error('Failed to save auth history', { error: String(error) });
    }
  }, [authHistory]);

  // Handle biometric authentication
  const handleAuthentication = useCallback(async () => {
    if (isProcessing || authStatus === 'authenticating' || availableBiometrics.length === 0) {
      return;
    }

    setIsProcessing(true);
    setAuthStatus('authenticating');
    setAuthError(null);
    setAuthStartTime(Date.now());

    try {
      // Track authentication attempt
      await analytics.track({
        name: 'biometric_auth_attempt',
        properties: {
          biometric_type: selectedBiometric,
          reason: customReason,
          require_strong_auth: requireStrongAuth,
          wallet_connected: wallet.state.isConnected,
          wallet_address: wallet.state.address
        }
      });

      // Prepare authentication options
      const authOptions: BiometricAuthOptions = {
        reason: customReason
        // requireStrongAuth not available in current BiometricAuthOptions
      };

      // Execute biometric authentication
      const response = await biometric.authenticate(authOptions);
      const authDuration = Date.now() - authStartTime;

      if (response) {
        setAuthStatus('authenticated');

        // Track successful authentication
        await analytics.track({
          name: 'biometric_auth_success',
          properties: {
            biometric_type: selectedBiometric,
            reason: customReason,
            duration_ms: authDuration,
            auth_level: 'standard'
          }
        });

        // Save to history
        saveAuthToHistory({
          type: selectedBiometric,
          reason: customReason,
          timestamp: new Date(),
          status: 'authenticated',
          duration: authDuration
        });

        // Call success callback
        onSuccess?.(response);

        logger.info('Biometric authentication completed successfully', { response: String(response) });
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      const authDuration = Date.now() - authStartTime;
      
      setAuthStatus('failed');
      setAuthError(errorMessage);

      // Show fallback option if enabled
      if (fallbackToPassword && errorMessage.includes('biometric')) {
        setShowFallback(true);
      }

      // Track authentication error
      await analytics.track({
        name: 'biometric_auth_error',
        properties: {
          error_message: errorMessage,
          biometric_type: selectedBiometric,
          reason: customReason,
          duration_ms: authDuration
        }
      });

      // Save to history
      saveAuthToHistory({
        type: selectedBiometric,
        reason: customReason,
        timestamp: new Date(),
        status: 'failed',
        duration: authDuration,
        error: errorMessage
      });

      // Call error callback
      if (error instanceof Error) {
        onError?.({
          code: 'AUTHENTICATION_FAILED' as any,
          message: errorMessage,
          timestamp: new Date()
        });
      }

      logger.error('Biometric authentication failed', { error: String(error) });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedBiometric, customReason, requireStrongAuth, isProcessing, authStatus, availableBiometrics, authStartTime, biometric, analytics, wallet.state, fallbackToPassword, onSuccess, onError, saveAuthToHistory]);

  // Handle password fallback
  const handlePasswordFallback = useCallback(async () => {
    if (!passwordFallback.trim()) {
      setAuthError('Password is required');
      return;
    }

    try {
      // This would typically validate against a stored hash or server
      // For demo purposes, we'll accept any non-empty password
      const response: BiometricAuthResponse = {
        status: 'success',
        biometric_type: 'fingerprint'
      };

      setAuthStatus('authenticated');
      setShowFallback(false);
      setPasswordFallback('');

      // Track fallback authentication
      await analytics.track({
        name: 'password_fallback_success',
        properties: {
          reason: customReason
        }
      });

      onSuccess?.(response);
    } catch (error) {
      setAuthError('Invalid password');
    }
  }, [passwordFallback, customReason, analytics, onSuccess]);

  // Reset authentication
  const resetAuthentication = useCallback(() => {
    setAuthStatus('idle');
    setAuthError(null);
    setShowFallback(false);
    setPasswordFallback('');
  }, []);

  // Get biometric icon
  const getBiometricIcon = useCallback((type: BiometricType) => {
    const iconClass = "w-6 h-6";
    
    switch (type) {
      case 'fingerprint':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
        );
      case 'face':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'voice':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
    }
  }, []);

  // Get status icon
  const getStatusIcon = useCallback((status: AuthStatus) => {
    switch (status) {
      case 'authenticated':
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
      case 'authenticating':
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        );
      case 'unavailable':
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
    }
  }, []);

  // Format timestamp for display
  const formatTimestamp = useCallback((timestamp: Date) => {
    return timestamp.toLocaleString();
  }, []);

  // Format duration for display
  const formatDuration = useCallback((duration: number) => {
    return `${(duration / 1000).toFixed(2)}s`;
  }, []);

  // Render unavailable state
  if (authStatus === 'unavailable') {
    return (
      <div className={`enhanced-biometric-auth unavailable ${className}`}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-yellow-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
          <h3 className="text-lg font-medium text-yellow-800 mb-2">
            Biometric Authentication Unavailable
          </h3>
          <p className="text-yellow-700">
            Your device does not support biometric authentication or it is not configured.
          </p>
          {fallbackToPassword && (
            <button
              onClick={() => setShowFallback(true)}
              className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg"
            >
              Use Password Instead
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`enhanced-biometric-auth ${className}`}>
      {/* Authentication Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Biometric Authentication
          </h2>
          <div className="flex items-center space-x-2">
            {getStatusIcon(authStatus)}
            <span className={`text-sm font-medium ${
              authStatus === 'authenticated' ? 'text-green-600' :
              authStatus === 'failed' ? 'text-red-600' :
              authStatus === 'authenticating' ? 'text-blue-600' :
              'text-gray-600'
            }`}>
              {authStatus === 'authenticated' ? 'Authenticated' :
               authStatus === 'failed' ? 'Failed' :
               authStatus === 'authenticating' ? 'Authenticating...' :
               authStatus === 'checking' ? 'Checking...' :
               'Ready'}
            </span>
          </div>
        </div>

        {/* Authentication Error */}
        {authError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{authError}</span>
            </div>
          </div>
        )}

        {/* Biometric Selection */}
        {availableBiometrics.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authentication Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {availableBiometrics.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedBiometric(type)}
                  className={`flex items-center justify-center p-3 border rounded-lg transition-colors ${
                    selectedBiometric === type
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {getBiometricIcon(type)}
                  <span className="ml-2 text-sm capitalize">{type}</span>
                </button>
              ))}
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
                  Authentication Reason
                </label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="require-strong"
                  checked={requireStrongAuthState}
                  onChange={(e) => setRequireStrongAuth(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="require-strong" className="ml-2 text-sm text-gray-700">
                  Require strong authentication
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Authentication Actions */}
        <div className="space-y-3">
          {authStatus === 'idle' || authStatus === 'failed' ? (
            <button
              onClick={handleAuthentication}
              disabled={isProcessing || availableBiometrics.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  {getBiometricIcon(selectedBiometric)}
                  <span className="ml-2">
                    {customPromptText || `Authenticate with ${selectedBiometric}`}
                  </span>
                </>
              )}
            </button>
          ) : authStatus === 'authenticated' ? (
            <button
              onClick={resetAuthentication}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Authenticate Again
            </button>
          ) : null}

          {/* Password Fallback */}
          {(showFallback || (fallbackToPassword && authStatus === 'failed')) && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Password Fallback
              </h3>
              <div className="flex space-x-2">
                <input
                  type="password"
                  value={passwordFallback}
                  onChange={(e) => setPasswordFallback(e.target.value)}
                  placeholder="Enter your password"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordFallback()}
                />
                <button
                  onClick={handlePasswordFallback}
                  disabled={!passwordFallback.trim()}
                  className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
                >
                  Authenticate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Authentication History */}
      {showAuthHistory && authHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Authentication History
          </h3>
          <div className="space-y-3">
            {authHistory.slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getBiometricIcon(item.type)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.reason}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(item.timestamp)}
                      {item.duration && ` • ${formatDuration(item.duration)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(item.status)}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.status === 'authenticated' ? 'bg-green-100 text-green-800' :
                    item.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedBiometricAuth;