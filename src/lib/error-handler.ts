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
};\n\n/**\n * Enhanced Error Handler Class\n */\nexport class ErrorHandler {\n  private static instance: ErrorHandler;\n  private errorHistory: EnhancedError[] = [];\n  private maxHistorySize = 50;\n\n  private constructor() {}\n\n  static getInstance(): ErrorHandler {\n    if (!ErrorHandler.instance) {\n      ErrorHandler.instance = new ErrorHandler();\n    }\n    return ErrorHandler.instance;\n  }\n\n  /**\n   * Create enhanced error from various input types\n   */\n  createError(\n    input: string | Error | AuthErrorType,\n    context?: string,\n    details?: Record<string, unknown>\n  ): EnhancedError {\n    let errorType: AuthErrorType;\n    let message: string;\n\n    // Determine error type and message\n    if (typeof input === 'string') {\n      errorType = this.classifyErrorFromString(input);\n      message = input;\n    } else if (input instanceof Error) {\n      errorType = this.classifyErrorFromError(input);\n      message = input.message;\n    } else {\n      errorType = input;\n      message = `${errorType} occurred`;\n    }\n\n    // Get error configuration\n    const config = ERROR_CONFIG[errorType] || ERROR_CONFIG[AuthErrorType.UNKNOWN_ERROR];\n\n    // Create enhanced error\n    const enhancedError: EnhancedError = {\n      ...config,\n      message,\n      details: details || {},\n      timestamp: new Date(),\n      context\n    };\n\n    // Add to history\n    this.addToHistory(enhancedError);\n\n    // Log error\n    this.logError(enhancedError);\n\n    return enhancedError;\n  }\n\n  /**\n   * Classify error from string message\n   */\n  private classifyErrorFromString(message: string): AuthErrorType {\n    const lowerMessage = message.toLowerCase();\n\n    // Network errors\n    if (lowerMessage.includes('timeout') || lowerMessage.includes('network')) {\n      return AuthErrorType.NETWORK_TIMEOUT;\n    }\n    if (lowerMessage.includes('rpc') || lowerMessage.includes('blockchain')) {\n      return AuthErrorType.RPC_ERROR;\n    }\n\n    // Environment errors\n    if (lowerMessage.includes('minikit') || lowerMessage.includes('world app')) {\n      return AuthErrorType.MINIKIT_UNAVAILABLE;\n    }\n\n    // Authentication errors\n    if (lowerMessage.includes('rejected') || lowerMessage.includes('cancelled')) {\n      return AuthErrorType.USER_REJECTED;\n    }\n    if (lowerMessage.includes('signature')) {\n      return AuthErrorType.SIGNATURE_INVALID;\n    }\n    if (lowerMessage.includes('nonce')) {\n      return AuthErrorType.NONCE_INVALID;\n    }\n\n    // Rate limiting\n    if (lowerMessage.includes('rate') || lowerMessage.includes('too many')) {\n      return AuthErrorType.RATE_LIMITED;\n    }\n\n    return AuthErrorType.UNKNOWN_ERROR;\n  }\n\n  /**\n   * Classify error from Error object\n   */\n  private classifyErrorFromError(error: Error): AuthErrorType {\n    // Check error name/constructor\n    if (error.name === 'NetworkError' || error.name === 'TimeoutError') {\n      return AuthErrorType.NETWORK_TIMEOUT;\n    }\n\n    // Check error message\n    return this.classifyErrorFromString(error.message);\n  }\n\n  /**\n   * Add error to history\n   */\n  private addToHistory(error: EnhancedError): void {\n    this.errorHistory.unshift(error);\n    if (this.errorHistory.length > this.maxHistorySize) {\n      this.errorHistory.pop();\n    }\n  }\n\n  /**\n   * Log error with appropriate level\n   */\n  private logError(error: EnhancedError): void {\n    const logData = {\n      type: error.type,\n      code: error.code,\n      message: error.message,\n      severity: error.severity,\n      retryable: error.retryable,\n      context: error.context,\n      details: error.details\n    };\n\n    switch (error.severity) {\n      case ErrorSeverity.LOW:\n        logger.info('Authentication error (low severity)', logData);\n        break;\n      case ErrorSeverity.MEDIUM:\n        logger.warn('Authentication error (medium severity)', logData);\n        break;\n      case ErrorSeverity.HIGH:\n      case ErrorSeverity.CRITICAL:\n        logger.error('Authentication error (high/critical severity)', logData);\n        break;\n    }\n  }\n\n  /**\n   * Get error history\n   */\n  getErrorHistory(): EnhancedError[] {\n    return [...this.errorHistory];\n  }\n\n  /**\n   * Get recent errors by type\n   */\n  getRecentErrorsByType(type: AuthErrorType, minutes = 5): EnhancedError[] {\n    const cutoff = new Date(Date.now() - minutes * 60 * 1000);\n    return this.errorHistory.filter(\n      error => error.type === type && error.timestamp > cutoff\n    );\n  }\n\n  /**\n   * Check if should retry based on error history\n   */\n  shouldRetry(errorType: AuthErrorType, maxRetries = 3): boolean {\n    const recentErrors = this.getRecentErrorsByType(errorType, 10);\n    return recentErrors.length < maxRetries;\n  }\n\n  /**\n   * Get recovery instructions for error\n   */\n  getRecoveryInstructions(error: EnhancedError): {\n    action: RecoveryAction;\n    message: string;\n    delay?: number;\n  } {\n    const instructions = {\n      [RecoveryAction.RETRY]: {\n        action: RecoveryAction.RETRY,\n        message: 'Click \"Try Again\" to retry the connection.'\n      },\n      [RecoveryAction.WAIT_AND_RETRY]: {\n        action: RecoveryAction.WAIT_AND_RETRY,\n        message: `Please wait ${Math.round((error.recoveryDelay || 5000) / 1000)} seconds before retrying.`,\n        delay: error.recoveryDelay\n      },\n      [RecoveryAction.REFRESH_PAGE]: {\n        action: RecoveryAction.REFRESH_PAGE,\n        message: 'Please refresh the page and try again.'\n      },\n      [RecoveryAction.OPEN_WORLD_APP]: {\n        action: RecoveryAction.OPEN_WORLD_APP,\n        message: 'Please open this app in World App to continue.'\n      },\n      [RecoveryAction.CONTACT_SUPPORT]: {\n        action: RecoveryAction.CONTACT_SUPPORT,\n        message: 'If this problem persists, please contact support.'\n      },\n      [RecoveryAction.NONE]: {\n        action: RecoveryAction.NONE,\n        message: 'No further action available.'\n      }\n    };\n\n    return instructions[error.recoveryAction] || instructions[RecoveryAction.NONE];\n  }\n\n  /**\n   * Clear error history\n   */\n  clearHistory(): void {\n    this.errorHistory = [];\n  }\n}\n\n// Export singleton instance\nexport const errorHandler = ErrorHandler.getInstance();\n\n// Utility functions for common error scenarios\nexport const AuthErrors = {\n  networkTimeout: (details?: Record<string, unknown>) =>\n    errorHandler.createError(AuthErrorType.NETWORK_TIMEOUT, 'network', details),\n\n  userRejected: (details?: Record<string, unknown>) =>\n    errorHandler.createError(AuthErrorType.USER_REJECTED, 'user_action', details),\n\n  signatureInvalid: (details?: Record<string, unknown>) =>\n    errorHandler.createError(AuthErrorType.SIGNATURE_INVALID, 'signature_verification', details),\n\n  miniKitUnavailable: (details?: Record<string, unknown>) =>\n    errorHandler.createError(AuthErrorType.MINIKIT_UNAVAILABLE, 'environment', details),\n\n  serverError: (details?: Record<string, unknown>) =>\n    errorHandler.createError(AuthErrorType.SERVER_ERROR, 'server', details),\n\n  rateLimited: (details?: Record<string, unknown>) =>\n    errorHandler.createError(AuthErrorType.RATE_LIMITED, 'rate_limit', details)\n};