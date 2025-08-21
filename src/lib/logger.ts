/**
 * Logging utility with sensitive data masking for MiniKit wallet operations
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  component?: string
  action?: string
  address?: string
  status?: string
  error?: string
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isDebugMode = process.env.NEXT_PUBLIC_DEBUG === 'true'

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
   * Format log message with context
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const component = context?.component || 'Unknown'
    const action = context?.action || ''
    
    return `[${timestamp}] [${level.toUpperCase()}] [${component}${action ? `:${action}` : ''}] ${message}`
  }

  /**
   * Log debug messages (only in development or debug mode)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.isDevelopment && !this.isDebugMode) return
    
    const maskedContext = context ? this.maskSensitiveData(context) : undefined
    const formattedMessage = this.formatMessage('debug', message, context)
    
    console.debug(formattedMessage, maskedContext)
  }

  /**
   * Log info messages
   */
  info(message: string, context?: LogContext): void {
    const maskedContext = context ? this.maskSensitiveData(context) : undefined
    const formattedMessage = this.formatMessage('info', message, context)
    
    console.info(formattedMessage, maskedContext)
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    const maskedContext = context ? this.maskSensitiveData(context) : undefined
    const formattedMessage = this.formatMessage('warn', message, context)
    
    console.warn(formattedMessage, maskedContext)
  }

  /**
   * Log error messages
   */
  error(message: string, context?: LogContext): void {
    const maskedContext = context ? this.maskSensitiveData(context) : undefined
    const formattedMessage = this.formatMessage('error', message, context)
    
    console.error(formattedMessage, maskedContext)
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
}

// Export singleton instance
export const logger = new Logger()

// Export default for convenience
export default logger