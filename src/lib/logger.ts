/**
 * Enhanced logging utility with World App debugging support and sensitive data masking
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  component?: string
  action?: string
  address?: string
  status?: string
  error?: string
  requestId?: string
  userId?: string
  sessionId?: string
  worldAppVersion?: string
  miniKitVersion?: string
  [key: string]: unknown
}

export interface WorldAppError {
  code: string
  message: string
  details?: unknown
  timestamp: Date
  userAgent?: string
  url?: string
  stack?: string
}

export interface LogEntry {
  level: LogLevel
  message: string
  context?: LogContext
  timestamp: Date
  sessionId: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isDebugMode = process.env.NEXT_PUBLIC_DEBUG === 'true'
  private sessionId = this.generateSessionId()
  private logBuffer: LogEntry[] = []
  private maxBufferSize = 100
  private isWorldApp = false
  private worldAppVersion = ''
  private miniKitVersion = ''

  constructor() {
    this.detectWorldApp()
    this.setupErrorHandlers()
  }

  /**
   * Generate unique session ID for tracking
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Detect if running in World App environment
   */
  private detectWorldApp(): void {
    if (typeof window !== 'undefined') {
      const globalWindow = window as typeof window & {
        MiniKit?: { version?: string }
        WorldApp?: { version?: string }
      }
      this.isWorldApp = !!globalWindow.MiniKit || !!globalWindow.WorldApp
      this.worldAppVersion = globalWindow.WorldApp?.version || 'unknown'
      this.miniKitVersion = globalWindow.MiniKit?.version || 'unknown'
    }
  }

  /**
   * Setup global error handlers for World App debugging
   */
  private setupErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      // Capture unhandled errors
      window.addEventListener('error', (event) => {
        this.worldAppError('UNHANDLED_ERROR', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        })
      })

      // Capture unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.worldAppError('UNHANDLED_REJECTION', {
          message: event.reason?.message || 'Unhandled promise rejection',
          reason: event.reason,
          stack: event.reason?.stack
        })
      })
    }
  }

  /**
   * Add log entry to buffer for debugging
   */
  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry)
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift()
    }
  }

  /**
   * Get current log buffer for debugging
   */
  getLogBuffer(): LogEntry[] {
    return [...this.logBuffer]
  }

  /**
   * Clear log buffer
   */
  clearLogBuffer(): void {
    this.logBuffer = []
  }

  /**
   * Get session information
   */
  getSessionInfo(): { sessionId: string; isWorldApp: boolean; worldAppVersion: string; miniKitVersion: string } {
    return {
      sessionId: this.sessionId,
      isWorldApp: this.isWorldApp,
      worldAppVersion: this.worldAppVersion,
      miniKitVersion: this.miniKitVersion
    }
  }

  /**
   * Mask sensitive data in log messages
   */
  private maskSensitiveData(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const masked = { ...data } as Record<string, unknown>

    // Mask signatures - show only first 6 and last 4 characters
    if (masked.signature && typeof masked.signature === 'string') {
      const sig = masked.signature
      if (sig.length > 10) {
        masked.signature = `${sig.slice(0, 6)}...${sig.slice(-4)}`
      }
    }

    // Mask private keys completely
    if (masked.privateKey) {
      masked.privateKey = '[REDACTED]'
    }

    // Mask nonces - show only first 8 characters
    if (masked.nonce && typeof masked.nonce === 'string') {
      const nonce = masked.nonce
      if (nonce.length > 8) {
        masked.nonce = `${nonce.slice(0, 8)}...`
      }
    }

    // Recursively mask nested objects
    Object.keys(masked).forEach(key => {
      if (typeof masked[key] === 'object' && masked[key] !== null) {
        masked[key] = this.maskSensitiveData(masked[key])
      }
    })

    return masked
  }

  /**
   * Format log message with context and World App info
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const component = context?.component || 'Unknown'
    const action = context?.action || ''
    const worldAppInfo = this.isWorldApp ? '[WorldApp]' : '[Web]'
    const sessionInfo = `[${this.sessionId.slice(-8)}]`
    
    return `${worldAppInfo}${sessionInfo} [${timestamp}] [${level.toUpperCase()}] [${component}${action ? `:${action}` : ''}] ${message}`
  }

  /**
   * Create enhanced context with session and World App info
   */
  private enhanceContext(context?: LogContext): LogContext {
    return {
      ...context,
      sessionId: this.sessionId,
      isWorldApp: this.isWorldApp,
      worldAppVersion: this.worldAppVersion,
      miniKitVersion: this.miniKitVersion,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    }
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: LogContext): void {
    const enhancedContext = this.enhanceContext(context)
    const formattedMessage = this.formatMessage('debug', message, enhancedContext)
    
    if (this.isDevelopment || this.isDebugMode) {
      console.log(formattedMessage)
    }
    
    this.addToBuffer({
      level: 'debug',
      message,
      context: enhancedContext,
      timestamp: new Date(),
      sessionId: this.sessionId
    })
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    const enhancedContext = this.enhanceContext(context)
    const formattedMessage = this.formatMessage('info', message, enhancedContext)
    console.info(formattedMessage)
    
    this.addToBuffer({
      level: 'info',
      message,
      context: enhancedContext,
      timestamp: new Date(),
      sessionId: this.sessionId
    })
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    const enhancedContext = this.enhanceContext(context)
    const formattedMessage = this.formatMessage('warn', message, enhancedContext)
    console.warn(formattedMessage)
    
    this.addToBuffer({
      level: 'warn',
      message,
      context: enhancedContext,
      timestamp: new Date(),
      sessionId: this.sessionId
    })
  }

  /**
   * Error level logging
   */
  error(message: string, context?: LogContext): void {
    const enhancedContext = this.enhanceContext(context)
    const formattedMessage = this.formatMessage('error', message, enhancedContext)
    console.error(formattedMessage)
    
    this.addToBuffer({
      level: 'error',
      message,
      context: enhancedContext,
      timestamp: new Date(),
      sessionId: this.sessionId
    })
  }

  /**
   * Log wallet authentication events
   */
  walletAuth(action: string, data: {
    address?: string
    status?: string
    error?: string
    signature?: string
    nonce?: string
    [key: string]: unknown
  }): void {
    const context: LogContext = {
      component: 'MiniKitWallet',
      action,
      ...data
    }

    if (data.error) {
      this.error(`Wallet authentication ${action} failed`, context)
    } else {
      this.info(`Wallet authentication ${action} completed`, context)
    }
  }

  /**
   * Log API requests with masked sensitive data
   */
  apiRequest(method: string, url: string, data?: unknown): void {
    const context: LogContext = {
      component: 'API',
      action: 'request',
      method,
      url,
      data: data ? this.maskSensitiveData(data) : undefined
    }

    this.debug(`API ${method} request to ${url}`, context)
  }

  /**
   * Log API responses with masked sensitive data
   */
  apiResponse(method: string, url: string, status: number, data?: unknown): void {
    const context: LogContext = {
      component: 'API',
      action: 'response',
      method,
      url,
      status: status.toString(),
      data: data ? this.maskSensitiveData(data) : undefined
    }

    if (status >= 400) {
      this.error(`API ${method} response from ${url} failed`, context)
    } else {
      this.debug(`API ${method} response from ${url} success`, context)
    }
  }

  /**
   * Log World App specific errors with detailed context
   */
  worldAppError(errorType: string, errorData: WorldAppError, context?: LogContext): void {
    const worldAppContext = {
      ...context,
      component: 'WorldApp',
      action: 'Error',
      errorType,
      errorCode: errorData.code,
      errorMessage: errorData.message,
      errorStack: errorData.stack,
      worldAppVersion: this.worldAppVersion,
      miniKitVersion: this.miniKitVersion,
      isWorldApp: this.isWorldApp
    }

    this.error(`World App Error [${errorType}]: ${errorData.message}`, worldAppContext)
  }

  /**
   * Log World ID verification attempts and results
   */
  worldIdVerification(action: 'start' | 'success' | 'error', data: {
    proof?: string
    merkleRoot?: string
    nullifierHash?: string
    verificationLevel?: string
    error?: string
    requestId?: string
  }, context?: LogContext): void {
    const verificationContext = {
      ...context,
      component: 'WorldID',
      action: `Verification_${action}`,
      verificationLevel: data.verificationLevel,
      requestId: data.requestId,
      hasProof: !!data.proof,
      hasMerkleRoot: !!data.merkleRoot,
      hasNullifierHash: !!data.nullifierHash
    }

    const message = action === 'error' 
      ? `World ID Verification Failed: ${data.error}`
      : `World ID Verification ${action.charAt(0).toUpperCase() + action.slice(1)}`

    if (action === 'error') {
      this.error(message, verificationContext)
    } else {
      this.info(message, verificationContext)
    }
  }

  /**
   * Log MiniKit SDK operations
   */
  miniKitOperation(operation: string, status: 'start' | 'success' | 'error', data?: unknown, context?: LogContext): void {
    const miniKitContext = {
      ...context,
      component: 'MiniKit',
      action: operation,
      status,
      miniKitVersion: this.miniKitVersion,
      operationData: data
    }

    const message = `MiniKit ${operation} ${status}`

    if (status === 'error') {
      this.error(message, miniKitContext)
    } else {
      this.info(message, miniKitContext)
    }
  }

  /**
   * Log wallet connection events
   */
  walletConnection(event: 'connect' | 'disconnect' | 'error', data?: {
    address?: string
    chainId?: number
    error?: string
    walletType?: string
  }, context?: LogContext): void {
    const walletContext = {
      ...context,
      component: 'Wallet',
      action: `Connection_${event}`,
      walletAddress: data?.address,
      chainId: data?.chainId,
      walletType: data?.walletType,
      error: data?.error
    }

    const message = event === 'error'
      ? `Wallet Connection Error: ${data?.error}`
      : `Wallet ${event.charAt(0).toUpperCase() + event.slice(1)}`

    if (event === 'error') {
      this.error(message, walletContext)
    } else {
      this.info(message, walletContext)
    }
  }

  /**
   * Log transaction events
   */
  transaction(event: 'start' | 'success' | 'error', data: {
    hash?: string
    to?: string
    value?: string
    gasUsed?: string
    error?: string
    type?: string
  }, context?: LogContext): void {
    const txContext = {
      ...context,
      component: 'Transaction',
      action: `TX_${event}`,
      transactionHash: data.hash,
      transactionTo: data.to,
      transactionValue: data.value,
      gasUsed: data.gasUsed,
      transactionType: data.type
    }

    const message = event === 'error'
      ? `Transaction Error: ${data.error}`
      : `Transaction ${event.charAt(0).toUpperCase() + event.slice(1)} ${data.hash ? `(${data.hash.slice(0, 10)}...)` : ''}`

    if (event === 'error') {
      this.error(message, txContext)
    } else {
      this.info(message, txContext)
    }
  }

  /**
   * Export logs for debugging (useful for World App support)
   */
  exportLogs(): string {
    const sessionInfo = this.getSessionInfo()
    const logs = this.getLogBuffer()
    
    const exportData = {
      sessionInfo,
      timestamp: new Date().toISOString(),
      totalLogs: logs.length,
      logs: logs.map(log => ({
        ...log,
        context: log.context ? this.maskSensitiveData(log.context) : undefined
      }))
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Send logs to remote endpoint (for production debugging)
   */
  async sendLogsToRemote(endpoint: string, apiKey?: string): Promise<void> {
    try {
      const logs = this.exportLogs()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: logs
      })

      if (!response.ok) {
        throw new Error(`Failed to send logs: ${response.status} ${response.statusText}`)
      }

      this.info('Logs sent to remote endpoint successfully', {
        component: 'Logger',
        action: 'RemoteLogging',
        endpoint,
        status: response.status
      })
    } catch (error) {
      this.error('Failed to send logs to remote endpoint', {
        component: 'Logger',
        action: 'RemoteLogging',
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint
      })
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Export default for convenience
export default logger