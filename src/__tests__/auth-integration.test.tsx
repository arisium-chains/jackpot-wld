import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AuthenticationManager } from '../lib/auth-manager';
import { AuthErrorHandler, AuthErrorType } from '../lib/auth-error-handler';
import '@testing-library/jest-dom';

// Mock dependencies
jest.mock('@worldcoin/minikit-js');
jest.mock('../lib/utils');
jest.mock('../app/api/siwe/verify/route');

interface MockMiniKit {
  commandsAsync: {
    walletAuth: jest.MockedFunction<() => Promise<{ finalPayload: { status: string; address?: string; message?: string; signature?: string; error_code?: string } }>>;
  };
  isWorldApp: jest.MockedFunction<() => boolean>;
}

const mockMiniKit: MockMiniKit = {
  commandsAsync: {
    walletAuth: jest.fn()
  },
  isWorldApp: jest.fn().mockReturnValue(true)
};

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Test constants
const MOCK_ADDRESS = '0x1234567890123456789012345678901234567890';
const MOCK_NONCE = 'a'.repeat(64);
const MOCK_SIGNATURE = '0x' + 'a'.repeat(130);

describe('AuthenticationManager Integration Tests', () => {
  let authManager: AuthenticationManager;
  let errorHandler: AuthErrorHandler;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup MiniKit mock
    (global as { MiniKit?: MockMiniKit }).MiniKit = mockMiniKit;
    
    // Create fresh instances
    authManager = new AuthenticationManager();
    errorHandler = authManager.errorHandler;
    
    // Reset fetch mock
    mockFetch.mockClear();
  });

  afterEach(() => {
    authManager?.destroy();
  });

  describe('Authentication Flow', () => {
    test('should complete full authentication flow successfully', async () => {
      // Mock successful nonce fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ nonce: MOCK_NONCE })
      } as Response);

      // Mock successful signature verification
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, sessionId: 'session123' })
      } as Response);

      // Mock successful wallet auth
      mockMiniKit.commandsAsync.walletAuth.mockResolvedValueOnce({
        finalPayload: {
          status: 'success',
          address: MOCK_ADDRESS,
          message: `Test message with nonce: ${MOCK_NONCE}`,
          signature: MOCK_SIGNATURE
        }
      });

      await authManager.authenticate();

      expect(authManager.isAuthenticated).toBe(true);
      expect(authManager.currentState.address).toBe(MOCK_ADDRESS);
      expect(authManager.currentState.sessionId).toBe('session123');
    });

    test('should track state changes during authentication', async () => {
      // Mock successful nonce fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ nonce: MOCK_NONCE })
      } as Response);

      // Mock successful signature verification
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, sessionId: 'session123' })
      } as Response);

      // Mock successful wallet auth
      mockMiniKit.commandsAsync.walletAuth.mockResolvedValueOnce({
        finalPayload: {
          status: 'success',
          address: MOCK_ADDRESS,
          message: `Test message with nonce: ${MOCK_NONCE}`,
          signature: MOCK_SIGNATURE
        }
      } as never);

      // Track state changes
      const stateChanges: string[] = [];
      authManager.addEventListener('stateChanged', (data: Record<string, unknown>) => {
  stateChanges.push((data as { current: { status: string } }).current.status);
});

      await authManager.authenticate();

      expect(stateChanges).toContain('connecting');
      expect(stateChanges).toContain('authenticating');
      expect(stateChanges).toContain('authenticated');
      expect(authManager.isAuthenticated).toBe(true);
      expect(authManager.currentState.address).toBe(MOCK_ADDRESS);
    });

    test('should handle user rejection gracefully', async () => {
      // Mock successful nonce fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ nonce: MOCK_NONCE })
      } as Response);

      // Mock user rejection
      mockMiniKit.commandsAsync.walletAuth.mockResolvedValueOnce({
        finalPayload: {
          status: 'error',
          error_code: 'user_rejected'
        }
      });

      const errors: unknown[] = [];
authManager.addEventListener('error', (error: unknown) => {
  errors.push(error);
});

      await authManager.authenticate();

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('user_rejected');
      expect(authManager.currentState.status).toBe('error');
    });
  });

  describe('Error Handling', () => {
    test('should classify network errors correctly', () => {
      const networkError = errorHandler.createError('Network timeout occurred');
      
      expect(networkError.type).toBe(AuthErrorType.NETWORK_TIMEOUT);
      expect(networkError.retryable).toBe(true);
      expect(networkError.recoveryAction).toBe('RETRY');
    });

    test('should classify user rejection correctly', () => {
      const userError = errorHandler.createError('User rejected the request');
      
      expect(userError.type).toBe(AuthErrorType.USER_REJECTED);
      expect(userError.retryable).toBe(true);
      expect(userError.severity).toBe('LOW');
    });
  });

  describe('Development Mode', () => {
    test('should simulate authentication in development mode', async () => {
      // Mock isWorldApp to return false (simulating non-World App environment)
      const { isWorldApp } = require('../lib/utils');
      isWorldApp.mockReturnValue(false);
      
      // Set development environment
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const devAuthManager = new AuthenticationManager();
      
      try {
        await devAuthManager.authenticate();
        expect(devAuthManager.isAuthenticated).toBe(true);
        expect(devAuthManager.currentState.address).toBeDefined();
      } finally {
        process.env.NODE_ENV = originalEnv ?? 'test';
        devAuthManager.destroy();
      }
    });
  });
});

// Helper functions for testing
export const TestHelpers = {
  createValidSIWEMessage: (address: string, nonce: string, issuedAt?: Date) => {
    const timestamp = (issuedAt || new Date()).toISOString();
    return `localhost:3000 wants you to sign in with your Ethereum account:\n${address}\n\nSign in to JackpotWLD to access your account\n\nURI: http://localhost:3000\nVersion: 1\nChain ID: 4801\nNonce: ${nonce}\nIssued At: ${timestamp}`;
  },
  
  createMockWalletAuthResponse: (address: string, includeSignature = true) => {
    const response = {
      finalPayload: {
        status: 'success',
        address
      }
    };
    
    if (includeSignature) {
      response.finalPayload.message = TestHelpers.createValidSIWEMessage(address, MOCK_NONCE);
      response.finalPayload.signature = MOCK_SIGNATURE;
    }
    
    return response;
  },
  
  waitForEvent: (eventEmitter: AuthenticationManager, eventName: string, timeout = 5000): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Event '${eventName}' not received within ${timeout}ms`));
      }, timeout);
      
      eventEmitter.addEventListener(eventName, (data: unknown) => {
        clearTimeout(timeoutId);
        resolve(data);
      });
    });
  }
};