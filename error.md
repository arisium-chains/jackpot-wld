[00:28:00.124] Running build in Washington, D.C., USA (East) – iad1
[00:28:00.125] Build machine configuration: 2 cores, 8 GB
[00:28:00.140] Cloning github.com/arisium-chains/jackpot-wld (Branch: main, Commit: 618b8c5)
[00:28:01.005] Cloning completed: 864.000ms
[00:28:07.161] Restored build cache from previous deployment (bRTrBLq5yrUL1tYMRLbXJPtmVQdd)
[00:28:08.849] Running "vercel build"
[00:28:09.243] Vercel CLI 46.0.2
[00:28:09.783] Installing dependencies...
[00:28:12.348] npm warn ERESOLVE overriding peer dependency
[00:28:12.349] npm warn While resolving: use-sync-external-store@1.2.0
[00:28:12.349] npm warn Found: react@19.1.0
[00:28:12.349] npm warn node_modules/react
[00:28:12.350] npm warn react@"19.1.0" from the root project
[00:28:12.350] npm warn 56 more (zustand, zustand, @floating-ui/react-dom, ...)
[00:28:12.350] npm warn
[00:28:12.350] npm warn Could not resolve dependency:
[00:28:12.351] npm warn peer react@"^16.8.0 || ^17.0.0 || ^18.0.0" from use-sync-external-store@1.2.0
[00:28:12.351] npm warn node_modules/valtio/node_modules/use-sync-external-store
[00:28:12.351] npm warn use-sync-external-store@"1.2.0" from valtio@1.13.2
[00:28:12.351] npm warn node_modules/valtio
[00:28:12.352] npm warn
[00:28:12.352] npm warn Conflicting peer dependency: react@18.3.1
[00:28:12.352] npm warn node_modules/react
[00:28:12.352] npm warn peer react@"^16.8.0 || ^17.0.0 || ^18.0.0" from use-sync-external-store@1.2.0
[00:28:12.353] npm warn node_modules/valtio/node_modules/use-sync-external-store
[00:28:12.353] npm warn use-sync-external-store@"1.2.0" from valtio@1.13.2
[00:28:12.353] npm warn node_modules/valtio
[00:28:13.000]
[00:28:13.000] up to date in 3s
[00:28:13.001]
[00:28:13.001] 287 packages are looking for funding
[00:28:13.001] run `npm fund` for details
[00:28:13.033] Detected Next.js version: 15.4.6
[00:28:13.040] Running "npm run build"
[00:28:13.148]
[00:28:13.149] > worldcoin-pooltogether-miniapp@0.1.0 build
[00:28:13.149] > next build
[00:28:13.149]
[00:28:13.898] ▲ Next.js 15.4.6
[00:28:13.899]
[00:28:13.962] Creating an optimized production build ...
[00:28:30.040] Failed to compile.
[00:28:30.041]
[00:28:30.041] ./src/lib/error-handler.ts
[00:28:30.041] Error: [31mx[0m Expected unicode escape
[00:28:30.041] ,-[[36;1;4m/vercel/path0/src/lib/error-handler.ts[0m:289:1]
[00:28:30.042] [2m286[0m | retryable: true,
[00:28:30.042] [2m287[0m | recoveryAction: RecoveryAction.RETRY
[00:28:30.042] [2m288[0m | }
[00:28:30.046] [2m289[0m | };\n\n/**\n _ Enhanced Error Handler Class\n _/\nexport class ErrorHandler {\n private static instance: ErrorHandler;\n private errorHistory: EnhancedError[] = [];\n private maxHistorySize = 50;\n\n private constructor() {}\n\n static getInstance(): ErrorHandler {\n if (!ErrorHandler.instance) {\n ErrorHandler.instance = new ErrorHandler();\n }\n return ErrorHandler.instance;\n }\n\n /**\n _ Create enhanced error from various input types\n _/\n createError(\n input: string | Error | AuthErrorType,\n context?: string,\n details?: Record<string, unknown>\n ): EnhancedError {\n let errorType: AuthErrorType;\n let message: string;\n\n // Determine error type and message\n if (typeof input === 'string') {\n errorType = this.classifyErrorFromString(input);\n message = input;\n } else if (input instanceof Error) {\n errorType = this.classifyErrorFromError(input);\n message = input.message;\n } else {\n errorType = input;\n message = `${errorType} occurred`;\n }\n\n // Get error configuration\n const config = ERROR_CONFIG[errorType] || ERROR_CONFIG[AuthErrorType.UNKNOWN_ERROR];\n\n // Create enhanced error\n const enhancedError: EnhancedError = {\n ...config,\n message,\n details: details || {},\n timestamp: new Date(),\n context\n };\n\n // Add to history\n this.addToHistory(enhancedError);\n\n // Log error\n this.logError(enhancedError);\n\n return enhancedError;\n }\n\n /**\n _ Classify error from string message\n _/\n private classifyErrorFromString(message: string): AuthErrorType {\n const lowerMessage = message.toLowerCase();\n\n // Network errors\n if (lowerMessage.includes('timeout') || lowerMessage.includes('network')) {\n return AuthErrorType.NETWORK_TIMEOUT;\n }\n if (lowerMessage.includes('rpc') || lowerMessage.includes('blockchain')) {\n return AuthErrorType.RPC_ERROR;\n }\n\n // Environment errors\n if (lowerMessage.includes('minikit') || lowerMessage.includes('world app')) {\n return AuthErrorType.MINIKIT_UNAVAILABLE;\n }\n\n // Authentication errors\n if (lowerMessage.includes('rejected') || lowerMessage.includes('cancelled')) {\n return AuthErrorType.USER_REJECTED;\n }\n if (lowerMessage.includes('signature')) {\n return AuthErrorType.SIGNATURE_INVALID;\n }\n if (lowerMessage.includes('nonce')) {\n return AuthErrorType.NONCE_INVALID;\n }\n\n // Rate limiting\n if (lowerMessage.includes('rate') || lowerMessage.includes('too many')) {\n return AuthErrorType.RATE_LIMITED;\n }\n\n return AuthErrorType.UNKNOWN_ERROR;\n }\n\n /**\n _ Classify error from Error object\n _/\n private classifyErrorFromError(error: Error): AuthErrorType {\n // Check error name/constructor\n if (error.name === 'NetworkError' || error.name === 'TimeoutError') {\n return AuthErrorType.NETWORK_TIMEOUT;\n }\n\n // Check error message\n return this.classifyErrorFromString(error.message);\n }\n\n /**\n _ Add error to history\n _/\n private addToHistory(error: EnhancedError): void {\n this.errorHistory.unshift(error);\n if (this.errorHistory.length > this.maxHistorySize) {\n this.errorHistory.pop();\n }\n }\n\n /**\n _ Log error with appropriate level\n _/\n private logError(error: EnhancedError): void {\n const logData = {\n type: error.type,\n code: error.code,\n message: error.message,\n severity: error.severity,\n retryable: error.retryable,\n context: error.context,\n details: error.details\n };\n\n switch (error.severity) {\n case ErrorSeverity.LOW:\n logger.info('Authentication error (low severity)', logData);\n break;\n case ErrorSeverity.MEDIUM:\n logger.warn('Authentication error (medium severity)', logData);\n break;\n case ErrorSeverity.HIGH:\n case ErrorSeverity.CRITICAL:\n logger.error('Authentication error (high/critical severi
[00:28:30.051] : [35;1m ^[0m
[00:28:30.051] `----
[00:28:30.051]
[00:28:30.051] Caused by:
[00:28:30.051] Syntax Error
[00:28:30.051]
[00:28:30.051] Import trace for requested module:
[00:28:30.051] ./src/lib/error-handler.ts
[00:28:30.051] ./src/components/AuthButton.tsx
[00:28:30.051] ./src/components/index.ts
[00:28:30.051] ./src/app/page.tsx
[00:28:30.051]
[00:28:30.051] ./src/app/api/auth/session/route.ts
[00:28:30.051] Module not found: Can't resolve '../../../../../lib/logger'
[00:28:30.051]
[00:28:30.051] https://nextjs.org/docs/messages/module-not-found
[00:28:30.051]
[00:28:30.052]
[00:28:30.052] > Build failed because of webpack errors
[00:28:30.116] Error: Command "npm run build" exited with 1
