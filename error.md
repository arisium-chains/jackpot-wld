[20:17:22.319] Running build in Washington, D.C., USA (East) – iad1
[20:17:22.319] Build machine configuration: 2 cores, 8 GB
[20:17:22.334] Cloning github.com/arisium-chains/jackpot-wld (Branch: main, Commit: bfd953f)
[20:17:23.305] Cloning completed: 970.000ms
[20:17:28.512] Restored build cache from previous deployment (3LB5Kc9TsCrpFbEM59FynRQK19qt)
[20:17:30.665] Running "vercel build"
[20:17:31.074] Vercel CLI 46.0.2
[20:17:31.653] Installing dependencies...
[20:17:34.106] npm warn ERESOLVE overriding peer dependency
[20:17:34.107] npm warn While resolving: use-sync-external-store@1.2.0
[20:17:34.108] npm warn Found: react@19.1.0
[20:17:34.108] npm warn node_modules/react
[20:17:34.108] npm warn react@"19.1.0" from the root project
[20:17:34.108] npm warn 56 more (zustand, zustand, @floating-ui/react-dom, ...)
[20:17:34.109] npm warn
[20:17:34.109] npm warn Could not resolve dependency:
[20:17:34.109] npm warn peer react@"^16.8.0 || ^17.0.0 || ^18.0.0" from use-sync-external-store@1.2.0
[20:17:34.109] npm warn node_modules/valtio/node_modules/use-sync-external-store
[20:17:34.110] npm warn use-sync-external-store@"1.2.0" from valtio@1.13.2
[20:17:34.110] npm warn node_modules/valtio
[20:17:34.110] npm warn
[20:17:34.110] npm warn Conflicting peer dependency: react@18.3.1
[20:17:34.110] npm warn node_modules/react
[20:17:34.111] npm warn peer react@"^16.8.0 || ^17.0.0 || ^18.0.0" from use-sync-external-store@1.2.0
[20:17:34.111] npm warn node_modules/valtio/node_modules/use-sync-external-store
[20:17:34.111] npm warn use-sync-external-store@"1.2.0" from valtio@1.13.2
[20:17:34.111] npm warn node_modules/valtio
[20:17:35.423]
[20:17:35.423] added 65 packages in 4s
[20:17:35.424]
[20:17:35.424] 287 packages are looking for funding
[20:17:35.425] run `npm fund` for details
[20:17:35.459] Detected Next.js version: 15.4.6
[20:17:35.467] Running "npm run build"
[20:17:35.586]
[20:17:35.586] > worldcoin-pooltogether-miniapp@0.1.0 build
[20:17:35.587] > next build
[20:17:35.587]
[20:17:36.412] ▲ Next.js 15.4.6
[20:17:36.412]
[20:17:36.471] Creating an optimized production build ...
[20:18:31.709] ⚠ Compiled with warnings in 54s
[20:18:31.709]
[20:18:31.709] ./node_modules/@prisma/instrumentation/node_modules/@opentelemetry/instrumentation/build/esm/platform/node/instrumentation.js
[20:18:31.709] Critical dependency: the request of a dependency is an expression
[20:18:31.710]
[20:18:31.710] Import trace for requested module:
[20:18:31.710] ./node_modules/@prisma/instrumentation/node_modules/@opentelemetry/instrumentation/build/esm/platform/node/instrumentation.js
[20:18:31.710] ./node_modules/@prisma/instrumentation/node_modules/@opentelemetry/instrumentation/build/esm/platform/node/index.js
[20:18:31.711] ./node_modules/@prisma/instrumentation/node_modules/@opentelemetry/instrumentation/build/esm/platform/index.js
[20:18:31.711] ./node_modules/@prisma/instrumentation/node_modules/@opentelemetry/instrumentation/build/esm/index.js
[20:18:31.711] ./node_modules/@prisma/instrumentation/dist/index.js
[20:18:31.711] ./node_modules/@sentry/node/build/cjs/integrations/tracing/prisma.js
[20:18:31.711] ./node_modules/@sentry/node/build/cjs/index.js
[20:18:31.711] ./node_modules/@sentry/nextjs/build/cjs/index.server.js
[20:18:31.711] ./src/components/ErrorBoundary.tsx
[20:18:31.711]
[20:18:31.711] ./node_modules/pino/lib/tools.js
[20:18:31.711] Module not found: Can't resolve 'pino-pretty' in '/vercel/path0/node_modules/pino/lib'
[20:18:31.711]
[20:18:31.712] Import trace for requested module:
[20:18:31.712] ./node_modules/pino/lib/tools.js
[20:18:31.712] ./node_modules/pino/pino.js
[20:18:31.712] ./node_modules/@walletconnect/logger/dist/index.es.js
[20:18:31.712] ./node_modules/@walletconnect/universal-provider/dist/index.es.js
[20:18:31.712] ./node_modules/@walletconnect/ethereum-provider/dist/index.es.js
[20:18:31.712] ./node_modules/@wagmi/connectors/dist/esm/walletConnect.js
[20:18:31.712] ./node_modules/@wagmi/connectors/dist/esm/exports/index.js
[20:18:31.712] ./node_modules/wagmi/dist/esm/exports/connectors.js
[20:18:31.712] ./src/lib/wagmi.ts
[20:18:31.712] ./src/providers/index.tsx
[20:18:31.712]
[20:18:31.717] Linting and checking validity of types ...
[20:18:42.808]
[20:18:42.808] ./src/**tests**/enhanced-sdk.test.tsx
[20:18:42.808] 7:46 Warning: 'act' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.808] 23:10 Warning: 'miniAppSDK' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.808] 577:18 Warning: 'error' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.808]
[20:18:42.808] ./src/**tests**/simplified-sdk.test.tsx
[20:18:42.808] 20:3 Warning: 'MiniAppProvider' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.809] 152:5 Warning: Unused eslint-disable directive (no problems were reported from '@typescript-eslint/no-explicit-any').
[20:18:42.809] 407:12 Warning: React Hook React.useEffect has a missing dependency: 'wallet'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.809] 510:13 Warning: 'sendButton' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.809]
[20:18:42.809] ./src/app/api/auth/nonce/route.ts
[20:18:42.809] 9:27 Warning: 'request' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.809]
[20:18:42.809] ./src/app/api/siwe/verify/route.ts
[20:18:42.809] 28:11 Warning: 'client' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.809]
[20:18:42.809] ./src/app/demo/page.tsx
[20:18:42.809] 8:38 Warning: 'useCallback' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.809] 30:3 Warning: 'Smartphone' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.810] 48:3 Warning: 'useLottery' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.813] 56:11 Warning: 'DemoSection' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.813] 126:9 Warning: 'payment' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.813] 271:9 Warning: 'payment' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.813] 408:11 Warning: 'state' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.813]
[20:18:42.813] ./src/app/deposit/page.tsx
[20:18:42.813] 17:10 Warning: 'verificationProof' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.814] 17:29 Warning: 'setVerificationProof' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.814]
[20:18:42.814] ./src/app/sdk-demo/page.tsx
[20:18:42.814] 17:11 Warning: 'DemoSection' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.814] 36:10 Warning: 'activeSection' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.814] 36:25 Warning: 'setActiveSection' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.814] 38:10 Warning: 'filterCategory' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.814] 38:26 Warning: 'setFilterCategory' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.814] 54:9 Warning: 'categoryCounts' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.814]
[20:18:42.814] ./src/components/WorldAppDebugPanel.tsx
[20:18:42.814] 16:3 Warning: 'Search' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.814] 17:3 Warning: 'Filter' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.814] 22:3 Warning: 'Settings' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.814]
[20:18:42.814] ./src/components/enhanced-analytics.tsx
[20:18:42.814] 11:10 Warning: 'AnalyticsEvent' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.814] 107:10 Warning: 'userProperties' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.814] 120:6 Warning: React Hook useEffect has a missing dependency: 'loadAnalyticsData'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.814] 127:6 Warning: React Hook useEffect has a missing dependency: 'trackPageView'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.814] 280:6 Warning: React Hook useCallback has an unnecessary dependency: 'selectedTimeRange'. Either exclude it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.815] 350:9 Warning: 'updateUserProperties' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.815]
[20:18:42.815] ./src/components/enhanced-biometric-auth.tsx
[20:18:42.815] 90:6 Warning: React Hook useEffect has a missing dependency: 'checkBiometricAvailability'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.815] 97:6 Warning: React Hook useEffect has a missing dependency: 'loadAuthHistory'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.815] 104:6 Warning: React Hook useEffect has a missing dependency: 'handleAuthentication'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.815] 319:14 Warning: 'error' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.815]
[20:18:42.815] ./src/components/enhanced-offline-support.tsx
[20:18:42.815] 97:3 Warning: 'showSync' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.815] 175:6 Warning: React Hook useEffect has a missing dependency: 'triggerSync'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.815] 190:6 Warning: React Hook useEffect has a missing dependency: 'triggerSync'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.815] 197:6 Warning: React Hook useEffect has missing dependencies: 'checkStorageInfo', 'detectNetworkQuality', and 'loadOfflineData'. Either include them or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.815] 402:6 Warning: React Hook useCallback has an unnecessary dependency: 'maxRetries'. Either exclude it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.815] 427:6 Warning: React Hook useCallback has an unnecessary dependency: 'offline'. Either exclude it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.815] 445:11 Warning: 'resolvedData' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.815]
[20:18:42.816] ./src/components/enhanced-payment.tsx
[20:18:42.816] 53:3 Warning: 'onTransactionUpdate' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.816] 86:6 Warning: React Hook useEffect has a missing dependency: 'loadPaymentHistory'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.816] 91:6 Warning: React Hook useEffect has a missing dependency: 'validateForm'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.816] 151:6 Warning: React Hook useCallback has an unnecessary dependency: 'formData'. Either exclude it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.816]
[20:18:42.816] ./src/components/enhanced-push-notifications.tsx
[20:18:42.816] 140:3 Warning: 'onNotificationReceived' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.816] 174:6 Warning: React Hook useEffect has a missing dependency: 'checkPermissionStatus'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.822] 181:6 Warning: React Hook useEffect has a missing dependency: 'loadNotificationHistory'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.822] 188:6 Warning: React Hook useEffect has a missing dependency: 'requestPermission'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.823]
[20:18:42.823] ./src/components/enhanced-sharing.tsx
[20:18:42.823] 85:6 Warning: React Hook useEffect has a missing dependency: 'loadShareHistory'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.823] 92:6 Warning: React Hook useEffect has a missing dependency: 'generateQRCode'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.823] 251:13 Warning: 'encodedDescription' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.823] 538:13 Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element @next/next/no-img-element
[20:18:42.824]
[20:18:42.824] ./src/components/enhanced-ui-optimizations.tsx
[20:18:42.824] 102:3 Warning: 'maxConcurrentImages' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.824] 106:9 Warning: 'miniKit' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.824] 175:6 Warning: React Hook useEffect has missing dependencies: 'cleanup', 'detectDeviceCapabilities', 'initializeOptimizations', 'setupAccessibilityFeatures', and 'setupPerformanceMonitoring'. Either include them or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.824] 180:6 Warning: React Hook useEffect has a missing dependency: 'applyOptimizations'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.825] 251:6 Warning: React Hook useCallback has missing dependencies: 'setupGestureOptimization', 'setupImageOptimization', 'setupLazyLoading', and 'setupVirtualScrolling'. Either include them or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.825] 585:9 Warning: 'formatFileSize' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.825]
[20:18:42.825] ./src/components/enhanced-wallet-connect.tsx
[20:18:42.825] 61:6 Warning: React Hook useEffect has a missing dependency: 'handleConnect'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.825] 68:6 Warning: React Hook useEffect has a missing dependency: 'loadBalance'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.825]
[20:18:42.826] ./src/components/enhanced-world-id.tsx
[20:18:42.826] 10:38 Warning: 'WorldIDResponse' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.826] 82:6 Warning: React Hook useEffect has a missing dependency: 'loadVerificationHistory'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.826] 89:6 Warning: React Hook useEffect has a missing dependency: 'handleVerification'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.826]
[20:18:42.826] ./src/components/payment/payment-manager.tsx
[20:18:42.826] 101:3 Warning: 'min' is assigned a value but never used. @typescript-eslint/no-unused-vars
[20:18:42.827] 284:6 Warning: React Hook useCallback has a missing dependency: 'payment'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.827] 353:6 Warning: React Hook useCallback has a missing dependency: 'payment'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.827] 415:6 Warning: React Hook useCallback has a missing dependency: 'payment'. Either include it or remove the dependency array. react-hooks/exhaustive-deps
[20:18:42.828]
[20:18:42.828] ./src/components/performance-monitor.tsx
[20:18:42.828] 106:9 Warning: The 'handleOptimize' function makes the dependencies of useEffect Hook (at line 137) change on every render. To fix this, wrap the definition of 'handleOptimize' in its own useCallback() Hook. react-hooks/exhaustive-deps
[20:18:42.828]
[20:18:42.828] ./src/components/sdk-integration.tsx
[20:18:42.829] 74:9 Warning: The 'features' array makes the dependencies of useEffect Hook (at line 221) change on every render. To fix this, wrap the initialization of 'features' in its own useMemo() Hook. react-hooks/exhaustive-deps
[20:18:42.829]
[20:18:42.830] ./src/providers/miniapp-provider.tsx
[20:18:42.830] 242:36 Warning: 'signal' is defined but never used. @typescript-eslint/no-unused-vars
[20:18:42.830]
[20:18:42.830] info - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
[20:18:56.149] Failed to compile.
[20:18:56.150]
[20:18:56.150] ./src/app/api/auth/verify/route.ts:3:30
[20:18:56.150] Type error: Could not find a declaration file for module 'uuid'. '/vercel/path0/node_modules/uuid/dist/esm-browser/index.js' implicitly has an 'any' type.
[20:18:56.150] Try `npm i --save-dev @types/uuid` if it exists or add a new declaration (.d.ts) file containing `declare module 'uuid';`
[20:18:56.150]
[20:18:56.150] [0m [90m 1 |[39m [36mimport[39m { [33mNextRequest[39m[33m,[39m [33mNextResponse[39m } [36mfrom[39m [32m'next/server'[39m[33m;[39m
[20:18:56.150] [90m 2 |[39m [36mimport[39m { logger } [36mfrom[39m [32m'@/lib/logger'[39m[33m;[39m
[20:18:56.150] [31m[1m>[22m[39m[90m 3 |[39m [36mimport[39m { v4 [36mas[39m uuidv4 } [36mfrom[39m [32m'uuid'[39m[33m;[39m
[20:18:56.150] [90m |[39m [31m[1m^[22m[39m
[20:18:56.150] [90m 4 |[39m
[20:18:56.150] [90m 5 |[39m [36mexport[39m [36mconst[39m runtime [33m=[39m [32m'edge'[39m[33m;[39m
[20:18:56.150] [90m 6 |[39m[0m
[20:18:56.204] Next.js build worker exited with code: 1 and signal: null
[20:18:56.300] Error: Command "npm run build" exited with 1
