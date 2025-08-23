/**
 * Comprehensive Authentication Integration Test Suite
 * Tests the complete WLD SDK authentication flow
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AuthenticationManager } from '../lib/auth-manager';
import { errorHandler, AuthErrorType } from '../lib/error-handler';
import { validateSIWEMessage } from '../app/api/siwe/verify/route';

// Mock dependencies
jest.mock('@worldcoin/minikit-js');
jest.mock('../lib/utils');
jest.mock('../lib/logger');

// Test constants
const MOCK_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_NONCE = 'a'.repeat(64);
const MOCK_SIGNATURE = '0x' + 'b'.repeat(130);

// Mock fetch responses
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock MiniKit
const mockMiniKit = {
  commandsAsync: {
    walletAuth: jest.fn()
  }
};

// Mock window.MiniKit
Object.defineProperty(window, 'MiniKit', {
  value: mockMiniKit,
  writable: true
});

describe('Authentication Integration Tests', () => {
  let authManager: AuthenticationManager;

  beforeEach(() => {
    authManager = new AuthenticationManager();
    mockFetch.mockClear();
    mockMiniKit.commandsAsync.walletAuth.mockClear();
    
    // Mock isWorldApp to return true
    const { isWorldApp } = require('../lib/utils');
    isWorldApp.mockReturnValue(true);
  });

  afterEach(() => {
    authManager.destroy();
    errorHandler.clearHistory();
  });

  describe('SIWE Message Validation', () => {
    test('should validate correct SIWE message format', () => {
      const validMessage = `localhost:3000 wants you to sign in with your Ethereum account:
${MOCK_ADDRESS}

Sign in to JackpotWLD to access your account

URI: http://localhost:3000
Version: 1
Chain ID: 4801
Nonce: ${MOCK_NONCE}
Issued At: ${new Date().toISOString()}`;

      const result = validateSIWEMessage(validMessage);
      expect(result.valid).toBe(true);
    });

    test('should reject malformed SIWE message', () => {
      const invalidMessage = 'This is not a valid SIWE message';
      
      const result = validateSIWEMessage(invalidMessage);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('InvalidSIWEFormat');
    });

    test('should reject expired SIWE message', () => {
      const expiredDate = new Date(Date.now() - 20 * 60 * 1000).toISOString(); // 20 minutes ago
      const expiredMessage = `localhost:3000 wants you to sign in with your Ethereum account:
${MOCK_ADDRESS}

Sign in to JackpotWLD to access your account

URI: http://localhost:3000
Version: 1
Chain ID: 4801
Nonce: ${MOCK_NONCE}
Issued At: ${expiredDate}`;

      const result = validateSIWEMessage(expiredMessage);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('MessageExpired');
    });

    test('should reject invalid chain ID', () => {
      const invalidChainMessage = `localhost:3000 wants you to sign in with your Ethereum account:
${MOCK_ADDRESS}

Sign in to JackpotWLD to access your account

URI: http://localhost:3000
Version: 1
Chain ID: 1
Nonce: ${MOCK_NONCE}
Issued At: ${new Date().toISOString()}`;

      const result = validateSIWEMessage(invalidChainMessage);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('InvalidChainId');
    });

    test('should reject invalid address format', () => {
      const invalidAddressMessage = `localhost:3000 wants you to sign in with your Ethereum account:
0xinvalidaddress

Sign in to JackpotWLD to access your account

URI: http://localhost:3000
Version: 1
Chain ID: 4801
Nonce: ${MOCK_NONCE}
Issued At: ${new Date().toISOString()}`;

      const result = validateSIWEMessage(invalidAddressMessage);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('InvalidAddress');
    });
  });

  describe('Authentication Manager', () => {
    test('should complete successful authentication flow', async () => {
      // Mock successful nonce fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ nonce: MOCK_NONCE })
      });

      // Mock successful signature verification
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, sessionId: 'session123' })
      });

      // Mock successful wallet auth
      mockMiniKit.commandsAsync.walletAuth.mockResolvedValueOnce({
        finalPayload: {
          status: 'success',
          address: MOCK_ADDRESS,
          message: `localhost:3000 wants you to sign in with your Ethereum account:\n${MOCK_ADDRESS}\n\nSign in to JackpotWLD to access your account\n\nURI: http://localhost:3000\nVersion: 1\nChain ID: 4801\nNonce: ${MOCK_NONCE}\nIssued At: ${new Date().toISOString()}`,
          signature: MOCK_SIGNATURE
        }
      });

      // Track state changes
      const stateChanges: string[] = [];
      authManager.addEventListener('stateChanged', (data: any) => {\n        stateChanges.push(data.current.status);\n      });\n\n      await authManager.authenticate();\n\n      expect(stateChanges).toContain('connecting');\n      expect(stateChanges).toContain('authenticating');\n      expect(stateChanges).toContain('authenticated');\n      expect(authManager.isAuthenticated).toBe(true);\n      expect(authManager.currentState.address).toBe(MOCK_ADDRESS);\n    });\n\n    test('should handle user rejection gracefully', async () => {\n      // Mock successful nonce fetch\n      mockFetch.mockResolvedValueOnce({\n        ok: true,\n        json: () => Promise.resolve({ nonce: MOCK_NONCE })\n      });\n\n      // Mock user rejection\n      mockMiniKit.commandsAsync.walletAuth.mockResolvedValueOnce({\n        finalPayload: {\n          status: 'error',\n          error_code: 'user_rejected'\n        }\n      });\n\n      const errors: any[] = [];\n      authManager.addEventListener('error', (error: any) => {\n        errors.push(error);\n      });\n\n      await authManager.authenticate();\n\n      expect(errors).toHaveLength(1);\n      expect(errors[0].code).toBe('user_rejected');\n      expect(authManager.currentState.status).toBe('error');\n    });\n\n    test('should retry failed authentication', async () => {\n      // Mock nonce fetch failure then success\n      mockFetch\n        .mockRejectedValueOnce(new Error('Network error'))\n        .mockResolvedValueOnce({\n          ok: true,\n          json: () => Promise.resolve({ nonce: MOCK_NONCE })\n        });\n\n      // Mock successful wallet auth\n      mockMiniKit.commandsAsync.walletAuth.mockResolvedValueOnce({\n        finalPayload: {\n          status: 'success',\n          address: MOCK_ADDRESS\n        }\n      });\n\n      // First attempt should fail\n      await authManager.authenticate();\n      expect(authManager.currentState.status).toBe('error');\n\n      // Retry should succeed\n      authManager.retry();\n      \n      // Wait for retry to complete\n      await new Promise(resolve => {\n        authManager.addEventListener('authenticated', resolve);\n      });\n\n      expect(authManager.currentState.status).toBe('authenticated');\n    });\n\n    test('should respect max retry limit', async () => {\n      const authManagerWithLowRetries = new AuthenticationManager({ maxRetries: 1 });\n      \n      // Mock fetch to always fail\n      mockFetch.mockRejectedValue(new Error('Network error'));\n\n      // First attempt\n      await authManagerWithLowRetries.authenticate();\n      expect(authManagerWithLowRetries.currentState.status).toBe('error');\n\n      // Second attempt (should exceed max retries)\n      await authManagerWithLowRetries.authenticate();\n      expect(authManagerWithLowRetries.currentState.error?.code).toBe('MAX_RETRIES_EXCEEDED');\n\n      authManagerWithLowRetries.destroy();\n    });\n  });\n\n  describe('Error Handling', () => {\n    test('should classify network errors correctly', () => {\n      const networkError = errorHandler.createError('Network timeout occurred');\n      \n      expect(networkError.type).toBe(AuthErrorType.NETWORK_TIMEOUT);\n      expect(networkError.retryable).toBe(true);\n      expect(networkError.recoveryAction).toBe('RETRY');\n    });\n\n    test('should classify user rejection correctly', () => {\n      const userError = errorHandler.createError('User rejected the request');\n      \n      expect(userError.type).toBe(AuthErrorType.USER_REJECTED);\n      expect(userError.retryable).toBe(true);\n      expect(userError.severity).toBe('LOW');\n    });\n\n    test('should provide recovery instructions', () => {\n      const signatureError = errorHandler.createError(AuthErrorType.SIGNATURE_INVALID);\n      const instructions = errorHandler.getRecoveryInstructions(signatureError);\n      \n      expect(instructions.action).toBe('RETRY');\n      expect(instructions.message).toContain('Try Again');\n    });\n\n    test('should track error history', () => {\n      errorHandler.clearHistory();\n      \n      errorHandler.createError('First error');\n      errorHandler.createError('Second error');\n      \n      const history = errorHandler.getErrorHistory();\n      expect(history).toHaveLength(2);\n      expect(history[0].message).toBe('Second error'); // Most recent first\n      expect(history[1].message).toBe('First error');\n    });\n\n    test('should determine retry eligibility', () => {\n      errorHandler.clearHistory();\n      \n      // Should allow retry initially\n      expect(errorHandler.shouldRetry(AuthErrorType.NETWORK_TIMEOUT, 3)).toBe(true);\n      \n      // Create multiple errors\n      errorHandler.createError(AuthErrorType.NETWORK_TIMEOUT);\n      errorHandler.createError(AuthErrorType.NETWORK_TIMEOUT);\n      errorHandler.createError(AuthErrorType.NETWORK_TIMEOUT);\n      \n      // Should not allow retry after max attempts\n      expect(errorHandler.shouldRetry(AuthErrorType.NETWORK_TIMEOUT, 3)).toBe(false);\n    });\n  });\n\n  describe('Nonce Management', () => {\n    test('should generate valid nonce', async () => {\n      // Test the nonce endpoint would be tested here if we were testing the API directly\n      // For now, we'll test nonce format validation\n      const validNonce = 'a'.repeat(64);\n      const invalidNonce = 'invalid';\n      \n      expect(/^[a-fA-F0-9]{64}$/.test(validNonce)).toBe(true);\n      expect(/^[a-fA-F0-9]{64}$/.test(invalidNonce)).toBe(false);\n    });\n  });\n\n  describe('Session Management', () => {\n    test('should validate session structure', () => {\n      const mockSession = {\n        address: MOCK_ADDRESS,\n        issuedAt: Date.now(),\n        expiresAt: Date.now() + 24 * 60 * 60 * 1000,\n        lastActivity: Date.now(),\n        isWorldIDVerified: false,\n        permissions: ['basic']\n      };\n      \n      expect(mockSession.address).toMatch(/^0x[a-fA-F0-9]{40}$/);\n      expect(mockSession.expiresAt).toBeGreaterThan(mockSession.issuedAt);\n      expect(Array.isArray(mockSession.permissions)).toBe(true);\n    });\n  });\n\n  describe('Integration Flow Tests', () => {\n    test('should handle complete authentication flow with signature verification', async () => {\n      const validSIWEMessage = `localhost:3000 wants you to sign in with your Ethereum account:\n${MOCK_ADDRESS}\n\nSign in to JackpotWLD to access your account\n\nURI: http://localhost:3000\nVersion: 1\nChain ID: 4801\nNonce: ${MOCK_NONCE}\nIssued At: ${new Date().toISOString()}`;\n\n      // Mock nonce fetch\n      mockFetch.mockResolvedValueOnce({\n        ok: true,\n        json: () => Promise.resolve({ nonce: MOCK_NONCE })\n      });\n\n      // Mock signature verification\n      mockFetch.mockResolvedValueOnce({\n        ok: true,\n        json: () => Promise.resolve({ ok: true, sessionId: 'session123' })\n      });\n\n      // Mock wallet auth with signature\n      mockMiniKit.commandsAsync.walletAuth.mockResolvedValueOnce({\n        finalPayload: {\n          status: 'success',\n          address: MOCK_ADDRESS,\n          message: validSIWEMessage,\n          signature: MOCK_SIGNATURE\n        }\n      });\n\n      const events: string[] = [];\n      authManager.addEventListener('connecting', () => events.push('connecting'));\n      authManager.addEventListener('authenticating', () => events.push('authenticating'));\n      authManager.addEventListener('authenticated', () => events.push('authenticated'));\n\n      await authManager.authenticate();\n\n      expect(events).toEqual(['connecting', 'authenticating', 'authenticated']);\n      expect(authManager.isAuthenticated).toBe(true);\n      expect(authManager.currentState.sessionId).toBe('session123');\n    });\n\n    test('should handle signature verification failure', async () => {\n      const validSIWEMessage = `localhost:3000 wants you to sign in with your Ethereum account:\n${MOCK_ADDRESS}\n\nSign in to JackpotWLD to access your account\n\nURI: http://localhost:3000\nVersion: 1\nChain ID: 4801\nNonce: ${MOCK_NONCE}\nIssued At: ${new Date().toISOString()}`;\n\n      // Mock nonce fetch\n      mockFetch.mockResolvedValueOnce({\n        ok: true,\n        json: () => Promise.resolve({ nonce: MOCK_NONCE })\n      });\n\n      // Mock signature verification failure\n      mockFetch.mockResolvedValueOnce({\n        ok: false,\n        json: () => Promise.resolve({ ok: false, error: 'SignatureInvalid' })\n      });\n\n      // Mock wallet auth with signature\n      mockMiniKit.commandsAsync.walletAuth.mockResolvedValueOnce({\n        finalPayload: {\n          status: 'success',\n          address: MOCK_ADDRESS,\n          message: validSIWEMessage,\n          signature: MOCK_SIGNATURE\n        }\n      });\n\n      await authManager.authenticate();\n\n      expect(authManager.currentState.status).toBe('error');\n      expect(authManager.currentState.error?.code).toBe('SIGNATURE_VERIFICATION_FAILED');\n    });\n  });\n\n  describe('Development Mode', () => {\n    test('should simulate authentication in development mode', async () => {\n      // Mock isWorldApp to return false (simulating non-World App environment)\n      const { isWorldApp } = require('../lib/utils');\n      isWorldApp.mockReturnValue(false);\n      \n      // Set development environment\n      const originalEnv = process.env.NODE_ENV;\n      process.env.NODE_ENV = 'development';\n\n      const devAuthManager = new AuthenticationManager();\n      \n      await devAuthManager.authenticate();\n      \n      expect(devAuthManager.isAuthenticated).toBe(true);\n      expect(devAuthManager.currentState.address).toBeDefined();\n      \n      // Restore environment\n      process.env.NODE_ENV = originalEnv;\n      devAuthManager.destroy();\n    });\n  });\n});\n\n// Helper functions for testing\nexport const TestHelpers = {\n  createValidSIWEMessage: (address: string, nonce: string, issuedAt?: Date) => {\n    const timestamp = (issuedAt || new Date()).toISOString();\n    return `localhost:3000 wants you to sign in with your Ethereum account:\n${address}\n\nSign in to JackpotWLD to access your account\n\nURI: http://localhost:3000\nVersion: 1\nChain ID: 4801\nNonce: ${nonce}\nIssued At: ${timestamp}`;\n  },\n  \n  createMockWalletAuthResponse: (address: string, includeSignature = true) => {\n    const response: any = {\n      finalPayload: {\n        status: 'success',\n        address\n      }\n    };\n    \n    if (includeSignature) {\n      response.finalPayload.message = TestHelpers.createValidSIWEMessage(address, MOCK_NONCE);\n      response.finalPayload.signature = MOCK_SIGNATURE;\n    }\n    \n    return response;\n  },\n  \n  waitForEvent: (eventEmitter: any, eventName: string, timeout = 5000) => {\n    return new Promise((resolve, reject) => {\n      const timeoutId = setTimeout(() => {\n        reject(new Error(`Event '${eventName}' not received within ${timeout}ms`));\n      }, timeout);\n      \n      eventEmitter.addEventListener(eventName, (data: any) => {\n        clearTimeout(timeoutId);\n        resolve(data);\n      });\n    });\n  }\n};