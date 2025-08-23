'use client'

import React, { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Copy, Download } from 'lucide-react'

interface WorldAppError {
  code?: string
  message: string
  stack?: string
  timestamp?: string
  context?: Record<string, unknown>
}

interface WorldAppErrorHandlerProps {
  error?: WorldAppError | null
  onRetry?: () => void
  onDismiss?: () => void
  showDebugInfo?: boolean
}

const ERROR_MESSAGES: Record<string, { title: string; description: string; action?: string }> = {
  WORLD_ID_VERIFICATION_FAILED: {
    title: 'World ID Verification Failed',
    description: 'Unable to verify your World ID. Please try again or contact support if the issue persists.',
    action: 'Retry Verification'
  },
  WALLET_CONNECTION_FAILED: {
    title: 'Wallet Connection Failed',
    description: 'Unable to connect to your wallet. Please ensure World App is properly installed and try again.',
    action: 'Retry Connection'
  },
  MINIKIT_NOT_AVAILABLE: {
    title: 'MiniKit Not Available',
    description: 'This feature requires the World App. Please open this application in World App to continue.',
    action: 'Open in World App'
  },
  TRANSACTION_FAILED: {
    title: 'Transaction Failed',
    description: 'Your transaction could not be completed. Please check your balance and try again.',
    action: 'Retry Transaction'
  },
  NETWORK_ERROR: {
    title: 'Network Error',
    description: 'Unable to connect to the network. Please check your internet connection and try again.',
    action: 'Retry'
  },
  SIGNATURE_VERIFICATION_FAILED: {
    title: 'Signature Verification Failed',
    description: 'Unable to verify your signature. This may be due to network issues or an invalid signature.',
    action: 'Try Again'
  },
  DEFAULT: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again or contact support if the issue persists.',
    action: 'Retry'
  }
}

export function WorldAppErrorHandler({
  error,
  onRetry,
  onDismiss,
  showDebugInfo = false
}: WorldAppErrorHandlerProps) {
  const [isDebugExpanded, setIsDebugExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (error) {
      // Log the error with enhanced context
      logger.worldAppError('USER_FACING_ERROR', {
        code: error.code || 'UNKNOWN',
        message: error.message,
        stack: error.stack,
        timestamp: error.timestamp ? new Date(error.timestamp) : new Date()
      }, {
        component: 'WorldAppErrorHandler',
        action: 'DisplayError',
        timestamp: error.timestamp || new Date().toISOString(),
        ...error.context
      })
    }
  }, [error])

  if (!error) return null

  const errorInfo = ERROR_MESSAGES[error.code || 'DEFAULT'] || ERROR_MESSAGES.DEFAULT
  const sessionInfo = logger.getSessionInfo()

  const handleCopyDebugInfo = async () => {
    const debugInfo = {
      error: {
        code: error.code,
        message: error.message,
        stack: error.stack,
        timestamp: error.timestamp
      },
      session: sessionInfo,
      logs: logger.getLogBuffer().slice(-10) // Last 10 logs
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy debug info:', err)
    }
  }

  const handleDownloadLogs = () => {
    const logs = logger.exportLogs()
    const blob = new Blob([logs], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `worldapp-logs-${sessionInfo.sessionId.slice(-8)}-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg">{errorInfo.title}</CardTitle>
          </div>
          <CardDescription>{errorInfo.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Error Details */}
          {error.code && (
            <div className="text-sm text-muted-foreground">
              Error Code: <code className="bg-muted px-1 py-0.5 rounded">{error.code}</code>
            </div>
          )}

          {/* Session Info for World App */}
          {sessionInfo.isWorldApp && (
            <div className="text-sm text-muted-foreground space-y-1">
              <div>World App: {sessionInfo.worldAppVersion}</div>
              <div>MiniKit: {sessionInfo.miniKitVersion}</div>
              <div>Session: {sessionInfo.sessionId.slice(-8)}</div>
            </div>
          )}

          {/* Debug Information */}
          {showDebugInfo && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDebugExpanded(!isDebugExpanded)}
                className="w-full"
              >
                {isDebugExpanded ? 'Hide' : 'Show'} Debug Info
              </Button>
              
              {isDebugExpanded && (
                <div className="space-y-2">
                  <div className="bg-muted p-3 rounded-md text-sm font-mono max-h-32 overflow-y-auto">
                    <div><strong>Message:</strong> {error.message}</div>
                    {error.stack && (
                      <div className="mt-2">
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap text-xs mt-1">{error.stack}</pre>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyDebugInfo}
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {copied ? 'Copied!' : 'Copy Debug Info'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadLogs}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download Logs
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {onRetry && (
              <Button onClick={onRetry} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                {errorInfo.action || 'Retry'}
              </Button>
            )}
            
            {onDismiss && (
              <Button variant="outline" onClick={onDismiss} className="flex-1">
                Dismiss
              </Button>
            )}
          </div>

          {/* World App Specific Help */}
          {!sessionInfo.isWorldApp && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Not in World App</AlertTitle>
              <AlertDescription>
                For the best experience and full functionality, please open this application in World App.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Hook for using the error handler
export function useWorldAppErrorHandler() {
  const [error, setError] = useState<WorldAppError | null>(null)

  const showError = (error: WorldAppError) => {
    setError({
      ...error,
      timestamp: new Date().toISOString()
    })
  }

  const clearError = () => {
    setError(null)
  }

  const handleError = (error: unknown, code?: string, context?: Record<string, unknown>) => {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    
    showError({
      code,
      message: errorMessage,
      stack: errorStack,
      context
    })
  }

  return {
    error,
    showError,
    clearError,
    handleError
  }
}

export default WorldAppErrorHandler