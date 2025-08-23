/**
 * Enhanced Authentication Manager for WLD SDK Integration
 * Handles wallet connection, SIWE authentication, and error recovery
 */

import { MiniKit } from '@worldcoin/minikit-js';
import { logger } from './logger';
import { isWorldApp } from './utils';

// Types for authentication flow
export interface AuthState {
  status: 'idle' | 'connecting' | 'authenticating' | 'authenticated' | 'error';
  address: string | null;
  sessionId: string | null;
  error: AuthError | null;
  attempts: number;
  lastAttemptTime: number | null;
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

export interface SIWEMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
}

export interface AuthenticationOptions {
  maxRetries: number;
  retryDelay: number;
  statement: string;
  domain: string;
  chainId: number;
}

// Default configuration
const DEFAULT_AUTH_OPTIONS: AuthenticationOptions = {
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
  statement: 'Sign in to JackpotWLD to access your account',
  domain: typeof window !== 'undefined' ? window.location.host : 'localhost:3000',
  chainId: 4801, // World Chain Sepolia
};

/**
 * Enhanced Authentication Manager Class
 */
export class AuthenticationManager {
  private state: AuthState;
  private options: AuthenticationOptions;
  private retryTimeoutId: NodeJS.Timeout | null = null;
  private eventListeners = new Map<string, Function[]>();

  constructor(options: Partial<AuthenticationOptions> = {}) {
    this.options = { ...DEFAULT_AUTH_OPTIONS, ...options };
    this.state = {
      status: 'idle',
      address: null,
      sessionId: null,
      error: null,
      attempts: 0,
      lastAttemptTime: null,
    };
  }

  // Getters
  get currentState(): AuthState {
    return { ...this.state };
  }

  get isAuthenticated(): boolean {
    return this.state.status === 'authenticated' && !!this.state.sessionId;
  }

  get isConnecting(): boolean {
    return this.state.status === 'connecting' || this.state.status === 'authenticating';
  }

  // Event management
  addEventListener(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error('Event listener error', { event, error: String(error) });
        }
      });
    }
  }

  // State management
  private updateState(updates: Partial<AuthState>): void {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    logger.debug('Auth state updated', {
      previous: previousState.status,
      current: this.state.status,
      address: this.state.address,
      attempts: this.state.attempts
    });

    this.emit('stateChanged', { previous: previousState, current: this.state });
  }

  // Error handling
  private createError(code: string, message: string, retryable = true, details?: Record<string, unknown>): AuthError {
    return {
      code,
      message,
      details,
      retryable
    };
  }

  private handleError(error: AuthError): void {
    this.updateState({
      status: 'error',
      error,
      lastAttemptTime: Date.now()
    });

    logger.error('Authentication error', {
      code: error.code,
      message: error.message,
      details: error.details,
      retryable: error.retryable,
      attempts: this.state.attempts
    });

    this.emit('error', error);
  }

  // SIWE message generation
  private async generateSIWEMessage(address: string, nonce: string): Promise<string> {
    const now = new Date();
    const expirationTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    const message = [
      `${this.options.domain} wants you to sign in with your Ethereum account:`,
      address,
      '',
      this.options.statement,
      '',
      `URI: ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}`,
      `Version: 1`,
      `Chain ID: ${this.options.chainId}`,
      `Nonce: ${nonce}`,
      `Issued At: ${now.toISOString()}`,
      `Expiration Time: ${expirationTime.toISOString()}`
    ].join('\n');

    return message;
  }

  // Nonce fetching with retry
  private async fetchNonce(): Promise<string> {
    const maxAttempts = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logger.debug('Fetching nonce', { attempt, maxAttempts });

        const response = await fetch('/api/siwe/nonce', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Nonce fetch failed: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        if (!data.nonce) {
          throw new Error('Invalid nonce response: missing nonce field');
        }

        logger.debug('Nonce fetched successfully', { 
          nonce: data.nonce.substring(0, 8) + '...',
          expirationTime: data.expirationTime 
        });

        return data.nonce;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn('Nonce fetch attempt failed', { 
          attempt, 
          maxAttempts, 
          error: lastError.message 
        });

        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Failed to fetch nonce after all attempts');
  }

  // Signature verification with retry
  private async verifySignature(address: string, message: string, signature: string): Promise<{ ok: boolean; sessionId?: string; error?: string }> {
    const maxAttempts = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logger.debug('Verifying signature', { attempt, maxAttempts, address });

        const response = await fetch('/api/siwe/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address,
            message,
            signature
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMsg = data.details || data.error || `Verification failed: ${response.status}`;
          throw new Error(errorMsg);
        }

        if (!data.ok) {
          throw new Error(data.error || 'Signature verification failed');
        }

        logger.info('Signature verified successfully', { 
          address, 
          sessionId: data.sessionId 
        });

        return { ok: true, sessionId: data.sessionId };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn('Signature verification attempt failed', { 
          attempt, 
          maxAttempts, 
          error: lastError.message 
        });

        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1500)); // Brief delay before retry
        }
      }
    }

    return { ok: false, error: lastError?.message || 'Verification failed' };
  }

  // Main authentication flow
  async authenticate(): Promise<void> {
    // Clear any existing retry timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    // Check if already authenticated
    if (this.state.status === 'authenticated') {
      logger.info('Already authenticated', { address: this.state.address });
      return;
    }

    // Check retry limits
    if (this.state.attempts >= this.options.maxRetries) {
      const error = this.createError(
        'MAX_RETRIES_EXCEEDED',
        `Authentication failed after ${this.options.maxRetries} attempts`,
        false
      );
      this.handleError(error);
      return;
    }

    // Environment check
    if (!isWorldApp()) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      if (!isDevelopment) {
        const error = this.createError(
          'MINIKIT_UNAVAILABLE',
          'This application must be opened in World App',
          false
        );
        this.handleError(error);
        return;
      }
      
      // Development mode simulation
      return this.simulateDevelopmentAuth();
    }

    this.updateState({
      status: 'connecting',
      attempts: this.state.attempts + 1,
      error: null,
      lastAttemptTime: Date.now()
    });

    this.emit('connecting', { attempts: this.state.attempts });

    try {
      // Step 1: Fetch nonce
      logger.info('Starting authentication flow', { attempts: this.state.attempts });
      const nonce = await this.fetchNonce();

      // Step 2: Generate SIWE message
      this.updateState({ status: 'authenticating' });
      this.emit('authenticating', { step: 'generating_message' });

      // Step 3: Request wallet authentication
      logger.debug('Requesting wallet authentication', { nonce: nonce.substring(0, 8) + '...' });
      
      const authResult = await MiniKit.commandsAsync.walletAuth({
        nonce,
        requestId: crypto.randomUUID(),
        expirationTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        notBefore: new Date(Date.now() - 60 * 1000), // 1 minute ago
        statement: this.options.statement,
      });

      if (authResult.finalPayload.status === 'error') {
        const errorCode = authResult.finalPayload.error_code || 'WALLET_AUTH_ERROR';
        const error = this.createError(
          errorCode,
          `Wallet authentication failed: ${errorCode}`,
          errorCode !== 'user_rejected' // Don't retry user rejections
        );
        this.handleError(error);
        return;
      }

      // Step 4: Extract address and signature
      const payload = authResult.finalPayload as any;
      const address = payload.address || window.MiniKit?.walletAddress;
      
      if (!address) {
        const error = this.createError(
          'ADDRESS_MISSING',
          'Wallet address not available in authentication response'
        );
        this.handleError(error);
        return;
      }

      // Step 5: Verify signature if present
      if (payload.message && payload.signature) {
        this.emit('authenticating', { step: 'verifying_signature' });
        
        const verificationResult = await this.verifySignature(
          address,
          payload.message,
          payload.signature
        );

        if (!verificationResult.ok) {
          const error = this.createError(
            'SIGNATURE_VERIFICATION_FAILED',
            verificationResult.error || 'Signature verification failed'
          );
          this.handleError(error);
          return;
        }

        // Success!
        this.updateState({
          status: 'authenticated',
          address,
          sessionId: verificationResult.sessionId || null,
          error: null,
          attempts: 0 // Reset attempts on success
        });

        logger.info('Authentication completed successfully', { 
          address, 
          sessionId: verificationResult.sessionId 
        });

        this.emit('authenticated', {
          address,
          sessionId: verificationResult.sessionId
        });
      } else {
        // No signature to verify, just update with connected state
        this.updateState({
          status: 'authenticated',
          address,
          sessionId: null,
          error: null,
          attempts: 0
        });

        logger.info('Wallet connected without signature verification', { address });
        this.emit('authenticated', { address });
      }

    } catch (error) {
      const authError = this.createError(
        'AUTHENTICATION_ERROR',
        error instanceof Error ? error.message : 'Unknown authentication error',
        true,
        { originalError: String(error) }
      );
      
      this.handleError(authError);
      
      // Schedule retry if retryable and under retry limit
      if (authError.retryable && this.state.attempts < this.options.maxRetries) {
        this.scheduleRetry();
      }
    }
  }

  // Development mode simulation
  private async simulateDevelopmentAuth(): Promise<void> {
    logger.info('Simulating authentication in development mode');
    
    this.updateState({ status: 'connecting' });
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    
    this.updateState({ status: 'authenticating' });
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    
    const mockAddress = '0x1234567890123456789012345678901234567890';
    const mockSessionId = crypto.randomUUID();
    
    this.updateState({
      status: 'authenticated',
      address: mockAddress,
      sessionId: mockSessionId,
      error: null,
      attempts: 0
    });

    this.emit('authenticated', { address: mockAddress, sessionId: mockSessionId });
  }

  // Retry scheduling
  private scheduleRetry(): void {
    const delay = this.options.retryDelay * Math.pow(2, this.state.attempts - 1); // Exponential backoff
    
    logger.info('Scheduling authentication retry', { 
      delay, 
      attempts: this.state.attempts, 
      maxRetries: this.options.maxRetries 
    });

    this.retryTimeoutId = setTimeout(() => {
      this.authenticate();
    }, delay);

    this.emit('retryScheduled', { delay, attempts: this.state.attempts });
  }

  // Manual retry
  retry(): void {
    if (this.state.attempts >= this.options.maxRetries) {
      logger.warn('Cannot retry: max attempts exceeded');
      return;
    }

    if (this.isConnecting) {
      logger.warn('Cannot retry: authentication in progress');
      return;
    }

    logger.info('Manual retry triggered');
    this.authenticate();
  }

  // Reset authentication state
  reset(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }

    this.updateState({
      status: 'idle',
      address: null,
      sessionId: null,
      error: null,
      attempts: 0,
      lastAttemptTime: null
    });

    logger.info('Authentication state reset');
    this.emit('reset', {});
  }

  // Disconnect
  disconnect(): void {
    this.reset();
    logger.info('Disconnected');
    this.emit('disconnected', {});
  }

  // Cleanup
  destroy(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
    
    this.eventListeners.clear();
    logger.info('Authentication manager destroyed');
  }
}

// Export singleton instance for easy use
export const authManager = new AuthenticationManager();