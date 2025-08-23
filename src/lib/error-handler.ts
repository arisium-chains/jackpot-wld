/**
 * Enhanced Error Handling System for WLD SDK Integration
 * Provides error classification, recovery strategies, and user-friendly messages
 */

import { logger } from './logger';

// Error type classification
export enum AuthErrorType {
  // Network & Connectivity
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  RPC_ERROR = 'RPC_ERROR',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  CONNECTION_FAILED = 'CONNECTION_FAILED',

  // Environment & Setup
  MINIKIT_UNAVAILABLE = 'MINIKIT_UNAVAILABLE',
  INVALID_ENVIRONMENT = 'INVALID_ENVIRONMENT',
  WORLD_APP_REQUIRED = 'WORLD_APP_REQUIRED',

  // Authentication Flow
  USER_REJECTED = 'USER_REJECTED',
  WALLET_LOCKED = 'WALLET_LOCKED',
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  ADDRESS_MISSING = 'ADDRESS_MISSING',

  // SIWE & Signature
  NONCE_EXPIRED = 'NONCE_EXPIRED',
  NONCE_INVALID = 'NONCE_INVALID',
  SIGNATURE_INVALID = 'SIGNATURE_INVALID',
  MESSAGE_MALFORMED = 'MESSAGE_MALFORMED',
  MESSAGE_EXPIRED = 'MESSAGE_EXPIRED',

  // Rate Limiting
  RATE_LIMITED = 'RATE_LIMITED',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',

  // Server & System
  SERVER_ERROR = 'SERVER_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Recovery action types
export enum RecoveryAction {
  RETRY = 'RETRY',
  REFRESH_PAGE = 'REFRESH_PAGE',
  OPEN_WORLD_APP = 'OPEN_WORLD_APP',
  WAIT_AND_RETRY = 'WAIT_AND_RETRY',
  CONTACT_SUPPORT = 'CONTACT_SUPPORT',
  NONE = 'NONE'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',           // Minor issues, automatic recovery possible
  MEDIUM = 'MEDIUM',     // User action required
  HIGH = 'HIGH',         // Service disruption
  CRITICAL = 'CRITICAL'  // System failure
}

// Enhanced error interface
export interface EnhancedError {
  type: AuthErrorType;
  code: string;
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  retryable: boolean;
  recoveryAction: RecoveryAction;
  recoveryDelay?: number;
  details?: Record<string, unknown>;
  timestamp: Date;
  context?: string;
}

// Error configuration mapping
const ERROR_CONFIG: Record<AuthErrorType, Omit<EnhancedError, 'message' | 'details' | 'timestamp' | 'context'>> = {
  [AuthErrorType.NETWORK_TIMEOUT]: {
    type: AuthErrorType.NETWORK_TIMEOUT,
    code: 'NETWORK_001',
    userMessage: 'Connection timed out. Please check your internet connection and try again.',
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    recoveryAction: RecoveryAction.RETRY,
    recoveryDelay: 3000
  },
  
  [AuthErrorType.RPC_ERROR]: {
    type: AuthErrorType.RPC_ERROR,
    code: 'NETWORK_002',
    userMessage: 'Blockchain network error. Please try again in a moment.',
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    recoveryAction: RecoveryAction.WAIT_AND_RETRY,
    recoveryDelay: 5000
  },
  
  [AuthErrorType.API_UNAVAILABLE]: {
    type: AuthErrorType.API_UNAVAILABLE,
    code: 'NETWORK_003',
    userMessage: 'Service temporarily unavailable. Please try again later.',
    severity: ErrorSeverity.HIGH,
    retryable: true,
    recoveryAction: RecoveryAction.WAIT_AND_RETRY,
    recoveryDelay: 10000
  },

  [AuthErrorType.MINIKIT_UNAVAILABLE]: {
    type: AuthErrorType.MINIKIT_UNAVAILABLE,
    code: 'ENV_001',
    userMessage: 'Please open this app in World App to connect your wallet.',
    severity: ErrorSeverity.HIGH,
    retryable: false,
    recoveryAction: RecoveryAction.OPEN_WORLD_APP
  },

  [AuthErrorType.WORLD_APP_REQUIRED]: {
    type: AuthErrorType.WORLD_APP_REQUIRED,
    code: 'ENV_002',
    userMessage: 'This feature requires World App. Please open this link in the World App.',
    severity: ErrorSeverity.HIGH,
    retryable: false,
    recoveryAction: RecoveryAction.OPEN_WORLD_APP
  },

  [AuthErrorType.USER_REJECTED]: {
    type: AuthErrorType.USER_REJECTED,
    code: 'AUTH_001',
    userMessage: 'Connection cancelled. Please try again to connect your wallet.',
    severity: ErrorSeverity.LOW,
    retryable: true,
    recoveryAction: RecoveryAction.RETRY
  },

  [AuthErrorType.WALLET_LOCKED]: {
    type: AuthErrorType.WALLET_LOCKED,
    code: 'AUTH_002',
    userMessage: 'Please unlock your wallet and try again.',
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    recoveryAction: RecoveryAction.RETRY
  },

  [AuthErrorType.SIGNATURE_INVALID]: {
    type: AuthErrorType.SIGNATURE_INVALID,
    code: 'SIWE_001',
    userMessage: 'Signature verification failed. Please try connecting again.',
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    recoveryAction: RecoveryAction.RETRY,
    recoveryDelay: 2000
  },

  [AuthErrorType.NONCE_EXPIRED]: {
    type: AuthErrorType.NONCE_EXPIRED,
    code: 'SIWE_002',
    userMessage: 'Session expired. Please try connecting again.',
    severity: ErrorSeverity.LOW,
    retryable: true,
    recoveryAction: RecoveryAction.RETRY
  },

  [AuthErrorType.RATE_LIMITED]: {
    type: AuthErrorType.RATE_LIMITED,
    code: 'LIMIT_001',
    userMessage: 'Too many attempts. Please wait a moment before trying again.',
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    recoveryAction: RecoveryAction.WAIT_AND_RETRY,
    recoveryDelay: 60000
  },

  [AuthErrorType.SERVER_ERROR]: {
    type: AuthErrorType.SERVER_ERROR,
    code: 'SYS_001',
    userMessage: 'Service error. Please try again or contact support if the problem persists.',
    severity: ErrorSeverity.HIGH,
    retryable: true,
    recoveryAction: RecoveryAction.RETRY,
    recoveryDelay: 5000
  },

  [AuthErrorType.UNKNOWN_ERROR]: {
    type: AuthErrorType.UNKNOWN_ERROR,
    code: 'UNK_001',
    userMessage: 'An unexpected error occurred. Please try again.',
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    recoveryAction: RecoveryAction.RETRY,
    recoveryDelay: 3000
  },

  // Additional error types...
  [AuthErrorType.CONNECTION_FAILED]: {
    type: AuthErrorType.CONNECTION_FAILED,
    code: 'NETWORK_004',
    userMessage: 'Failed to connect. Please check your internet connection.',
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    recoveryAction: RecoveryAction.RETRY,
    recoveryDelay: 3000
  },

  [AuthErrorType.INVALID_ENVIRONMENT]: {
    type: AuthErrorType.INVALID_ENVIRONMENT,
    code: 'ENV_003',
    userMessage: 'Invalid environment configuration. Please refresh the page.',
    severity: ErrorSeverity.HIGH,
    retryable: true,
    recoveryAction: RecoveryAction.REFRESH_PAGE
  },

  [AuthErrorType.WALLET_NOT_FOUND]: {
    type: AuthErrorType.WALLET_NOT_FOUND,
    code: 'AUTH_003',
    userMessage: 'Wallet not found. Please ensure you have a wallet set up in World App.',
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    recoveryAction: RecoveryAction.RETRY
  },

  [AuthErrorType.ADDRESS_MISSING]: {
    type: AuthErrorType.ADDRESS_MISSING,
    code: 'AUTH_004',
    userMessage: 'Could not retrieve wallet address. Please try again.',
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    recoveryAction: RecoveryAction.RETRY
  },

  [AuthErrorType.NONCE_INVALID]: {
    type: AuthErrorType.NONCE_INVALID,
    code: 'SIWE_003',
    userMessage: 'Invalid authentication token. Please try again.',
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    recoveryAction: RecoveryAction.RETRY
  },

  [AuthErrorType.MESSAGE_MALFORMED]: {
    type: AuthErrorType.MESSAGE_MALFORMED,
    code: 'SIWE_004',
    userMessage: 'Invalid message format. Please try again.',
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    recoveryAction: RecoveryAction.RETRY
  },

  [AuthErrorType.MESSAGE_EXPIRED]: {
    type: AuthErrorType.MESSAGE_EXPIRED,
    code: 'SIWE_005',
    userMessage: 'Authentication message expired. Please try again.',
    severity: ErrorSeverity.LOW,
    retryable: true,
    recoveryAction: RecoveryAction.RETRY
  },

  [AuthErrorType.TOO_MANY_ATTEMPTS]: {
    type: AuthErrorType.TOO_MANY_ATTEMPTS,
    code: 'LIMIT_002',
    userMessage: 'Too many failed attempts. Please wait before trying again.',
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    recoveryAction: RecoveryAction.WAIT_AND_RETRY,
    recoveryDelay: 300000 // 5 minutes
  },

  [AuthErrorType.VALIDATION_ERROR]: {
    type: AuthErrorType.VALIDATION_ERROR,
    code: 'SYS_002',
    userMessage: 'Data validation error. Please try again.',
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    recoveryAction: RecoveryAction.RETRY
  },

  [AuthErrorType.SESSION_EXPIRED]: {
    type: AuthErrorType.SESSION_EXPIRED,
    code: 'AUTH_005',
    userMessage: 'Your session has expired. Please sign in again.',
    severity: ErrorSeverity.LOW,
    retryable: true,
    recoveryAction: RecoveryAction.RETRY
  }
};

/**
 * Enhanced Error Handler Class
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorHistory: EnhancedError[] = [];
  private maxHistorySize = 50;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Create enhanced error from various input types
   */
  createError(
    input: string | Error | AuthErrorType,
    context?: string,
    details?: Record<string, unknown>
  ): EnhancedError {
    let errorType: AuthErrorType;
    let message: string;

    // Determine error type and message
    if (typeof input === 'string') {
      errorType = this.classifyErrorFromString(input);
      message = input;
    } else if (input instanceof Error) {
      errorType = this.classifyErrorFromError(input);
      message = input.message;
    } else {
      errorType = input;
      message = `${errorType} occurred`;
    }

    // Get error configuration
    const config = ERROR_CONFIG[errorType] || ERROR_CONFIG[AuthErrorType.UNKNOWN_ERROR];

    // Create enhanced error
    const enhancedError: EnhancedError = {
      ...config,
      message,
      details: details || {},
      timestamp: new Date(),
      context
    };

    // Add to history
    this.addToHistory(enhancedError);

    // Log error
    this.logError(enhancedError);

    return enhancedError;
  }

  /**
   * Classify error from string message
   */
  private classifyErrorFromString(message: string): AuthErrorType {
    const lowerMessage = message.toLowerCase();

    // Network errors
    if (lowerMessage.includes('timeout') || lowerMessage.includes('network')) {
      return AuthErrorType.NETWORK_TIMEOUT;
    }
    if (lowerMessage.includes('rpc') || lowerMessage.includes('blockchain')) {
      return AuthErrorType.RPC_ERROR;
    }

    // Environment errors
    if (lowerMessage.includes('minikit') || lowerMessage.includes('world app')) {
      return AuthErrorType.MINIKIT_UNAVAILABLE;
    }

    // Authentication errors
    if (lowerMessage.includes('rejected') || lowerMessage.includes('cancelled')) {
      return AuthErrorType.USER_REJECTED;
    }
    if (lowerMessage.includes('signature')) {
      return AuthErrorType.SIGNATURE_INVALID;
    }
    if (lowerMessage.includes('nonce')) {
      return AuthErrorType.NONCE_INVALID;
    }

    // Rate limiting
    if (lowerMessage.includes('rate') || lowerMessage.includes('too many')) {
      return AuthErrorType.RATE_LIMITED;
    }

    return AuthErrorType.UNKNOWN_ERROR;
  }

  /**
   * Classify error from Error object
   */
  private classifyErrorFromError(error: Error): AuthErrorType {
    // Check error name/constructor
    if (error.name === 'NetworkError' || error.name === 'TimeoutError') {
      return AuthErrorType.NETWORK_TIMEOUT;
    }

    // Check error message
    return this.classifyErrorFromString(error.message);
  }

  /**
   * Add error to history
   */
  private addToHistory(error: EnhancedError): void {
    this.errorHistory.unshift(error);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.pop();
    }
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: EnhancedError): void {
    const logData = {
      type: error.type,
      code: error.code,
      message: error.message,
      severity: error.severity,
      retryable: error.retryable,
      context: error.context,
      details: error.details
    };

    switch (error.severity) {
      case ErrorSeverity.LOW:
        logger.info('Authentication error (low severity)', logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('Authentication error (medium severity)', logData);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        logger.error('Authentication error (high/critical severity)', logData);
        break;
    }
  }

  /**
   * Get error history
   */
  getErrorHistory(): EnhancedError[] {
    return [...this.errorHistory];
  }

  /**
   * Get recent errors by type
   */
  getRecentErrorsByType(type: AuthErrorType, minutes = 5): EnhancedError[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.errorHistory.filter(
      error => error.type === type && error.timestamp > cutoff
    );
  }

  /**
   * Check if should retry based on error history
   */
  shouldRetry(errorType: AuthErrorType, maxRetries = 3): boolean {
    const recentErrors = this.getRecentErrorsByType(errorType, 10);
    return recentErrors.length < maxRetries;
  }

  /**
   * Get recovery instructions for error
   */
  getRecoveryInstructions(error: EnhancedError): {
    action: RecoveryAction;
    message: string;
    delay?: number;
  } {
    const instructions = {
      [RecoveryAction.RETRY]: {
        action: RecoveryAction.RETRY,
        message: 'Click "Try Again" to retry the connection.'
      },
      [RecoveryAction.WAIT_AND_RETRY]: {
        action: RecoveryAction.WAIT_AND_RETRY,
        message: `Please wait ${Math.round((error.recoveryDelay || 5000) / 1000)} seconds before retrying.`,
        delay: error.recoveryDelay
      },
      [RecoveryAction.REFRESH_PAGE]: {
        action: RecoveryAction.REFRESH_PAGE,
        message: 'Please refresh the page and try again.'
      },
      [RecoveryAction.OPEN_WORLD_APP]: {
        action: RecoveryAction.OPEN_WORLD_APP,
        message: 'Please open this app in World App to continue.'
      },
      [RecoveryAction.CONTACT_SUPPORT]: {
        action: RecoveryAction.CONTACT_SUPPORT,
        message: 'If this problem persists, please contact support.'
      },
      [RecoveryAction.NONE]: {
        action: RecoveryAction.NONE,
        message: 'No further action available.'
      }
    };

    return instructions[error.recoveryAction] || instructions[RecoveryAction.NONE];
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = [];
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common error scenarios
export const AuthErrors = {
  networkTimeout: (details?: Record<string, unknown>) =>
    errorHandler.createError(AuthErrorType.NETWORK_TIMEOUT, 'network', details),

  userRejected: (details?: Record<string, unknown>) =>
    errorHandler.createError(AuthErrorType.USER_REJECTED, 'user_action', details),

  signatureInvalid: (details?: Record<string, unknown>) =>
    errorHandler.createError(AuthErrorType.SIGNATURE_INVALID, 'signature_verification', details),

  miniKitUnavailable: (details?: Record<string, unknown>) =>
    errorHandler.createError(AuthErrorType.MINIKIT_UNAVAILABLE, 'environment', details),

  serverError: (details?: Record<string, unknown>) =>
    errorHandler.createError(AuthErrorType.SERVER_ERROR, 'server', details),

  rateLimited: (details?: Record<string, unknown>) =>
    errorHandler.createError(AuthErrorType.RATE_LIMITED, 'rate_limit', details)
};