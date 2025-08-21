/**
 * Comprehensive MiniApp SDK Types
 * Enhanced type definitions for all MiniApp SDK features
 */

// Core SDK Status Types
export type SDKStatus = 'idle' | 'initializing' | 'ready' | 'error' | 'unavailable';
export type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'error';
export type PaymentStatus = 'idle' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type VerificationStatus = 'idle' | 'verifying' | 'verified' | 'failed';

// Environment Detection
export interface EnvironmentInfo {
  isWorldApp: boolean;
  isDevelopment: boolean;
  isDevMode: boolean;
  hasValidAppId: boolean;
  userAgent: string;
  version?: string;
}

// Wallet Integration Types
export interface WalletAuthPayload {
  status: 'success' | 'error';
  error_code?: string;
  message?: string;
  signature?: string;
  address?: string;
  nonce?: string;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance?: string;
  chainId?: number;
  isLoading: boolean;
  lastConnected?: Date;
}

export interface WalletAuthOptions {
  nonce: string;
  requestId?: string;
  expirationTime?: string;
  notBefore?: string;
  statement?: string;
  uri?: string;
  version?: string;
  chainId?: number;
}

// Payment SDK Types
export interface PaymentRequest {
  to: string;
  value: string;
  data?: string;
  reference?: string;
  description?: string;
}

export interface PaymentResponse {
  status: 'success' | 'error';
  transaction_hash?: string;
  error_code?: string;
  error_message?: string;
}

export interface PaymentOptions {
  token?: string;
  amount: string;
  recipient: string;
  memo?: string;
  confirmations?: number;
}

export interface PaymentTransaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  amount: string;
  token?: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
  confirmations: number;
  memo?: string;
}

export interface DeviceInfo {
  platform: string;
  version: string;
  model: string;
  manufacturer: string;
  isPhysicalDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  locale: string;
  timezone: string;
}

// World ID Integration Types
export interface WorldIDProof {
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  verification_level: 'orb' | 'device';
}

export interface WorldIDVerificationOptions {
  action: string;
  signal?: string;
  credential_types?: ('orb' | 'device')[];
  bridge_url?: string;
}

export interface WorldIDResponse {
  status: 'success' | 'error';
  proof?: WorldIDProof;
  error_code?: string;
  error_message?: string;
}

// Sharing Features Types
export interface ShareContent {
  title?: string;
  text?: string;
  url?: string;
  image?: string;
}

export interface ShareOptions {
  content: ShareContent;
  platforms?: ('twitter' | 'telegram' | 'whatsapp' | 'native')[];
}

export interface ShareResponse {
  status: 'success' | 'error' | 'cancelled';
  platform?: string;
  error_message?: string;
}

// Biometric Authentication Types
export interface BiometricAuthOptions {
  reason?: string;
  subtitle?: string;
  description?: string;
  fallbackLabel?: string;
  negativeButtonText?: string;
}

export interface BiometricAuthResponse {
  status: 'success' | 'error' | 'cancelled';
  error_code?: string;
  error_message?: string;
  biometric_type?: 'fingerprint' | 'face' | 'voice';
}

// Push Notifications Types
export interface NotificationPermission {
  status: 'granted' | 'denied' | 'default';
  canRequest: boolean;
}

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Analytics Types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
  userId?: string;
  sessionId?: string;
}

export interface UserProperties {
  userId?: string;
  walletAddress?: string;
  verificationLevel?: string;
  appVersion?: string;
  platform?: string;
  [key: string]: unknown;
}

// Offline Support Types
export interface OfflineQueueItem {
  id: string;
  type: 'payment' | 'verification' | 'analytics';
  data: unknown;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync?: Date;
  pendingItems: number;
  isSyncing: boolean;
}

// Error Types
export type SDKErrorCode = 
  | 'SDK_NOT_AVAILABLE'
  | 'WALLET_AUTH_DECLINED'
  | 'PAYMENT_FAILED'
  | 'VERIFICATION_FAILED'
  | 'NETWORK_ERROR'
  | 'PERMISSION_DENIED'
  | 'BIOMETRIC_NOT_AVAILABLE'
  | 'SHARE_CANCELLED'
  | 'NOTIFICATION_BLOCKED'
  | 'OFFLINE_ERROR'
  | 'UNKNOWN_ERROR';

export interface SDKError {
  code: SDKErrorCode;
  message: string;
  details?: unknown;
  timestamp: Date;
}

// Core SDK Interface
export interface MiniAppSDK {
  // Core
  status: SDKStatus;
  environment: EnvironmentInfo;
  isInstalled: boolean;
  version?: string;
  
  // Wallet
  wallet: {
    state: WalletState;
    connect: (options?: WalletAuthOptions) => Promise<WalletAuthPayload>;
    disconnect: () => Promise<void>;
    getBalance: () => Promise<string>;
    switchChain: (chainId: number) => Promise<void>;
  };
  
  // Payments
  payment: {
    status: PaymentStatus;
    send: (options: PaymentOptions) => Promise<PaymentResponse>;
    request: (request: PaymentRequest) => Promise<PaymentResponse>;
    getHistory: () => Promise<PaymentTransaction[]>;
  };
  
  // World ID
  worldId: {
    status: VerificationStatus;
    verify: (options: WorldIDVerificationOptions) => Promise<WorldIDResponse>;
    getProof: () => Promise<WorldIDProof | null>;
    isVerified: () => boolean;
  };
  
  // Sharing
  sharing: {
    share: (options: ShareOptions) => Promise<ShareResponse>;
    canShare: () => boolean;
    getSupportedPlatforms: () => string[];
  };
  
  // Biometric
  biometric: {
    isAvailable: () => Promise<boolean>;
    authenticate: (options?: BiometricAuthOptions) => Promise<BiometricAuthResponse>;
    getSupportedTypes: () => Promise<string[]>;
  };
  
  // Notifications
  notifications: {
    permission: NotificationPermission;
    requestPermission: () => Promise<NotificationPermission>;
    schedule: (options: PushNotificationOptions) => Promise<void>;
    clear: (tag?: string) => Promise<void>;
  };
  
  // Analytics
  analytics: {
    track: (event: AnalyticsEvent) => Promise<void>;
    setUserProperties: (properties: UserProperties) => Promise<void>;
    flush: () => Promise<void>;
  };
  
  // Offline
  offline: {
    status: SyncStatus;
    queue: OfflineQueueItem[];
    sync: () => Promise<void>;
    clearQueue: () => Promise<void>;
  };
  
  // Utilities
  utils: {
    openURL: (url: string) => Promise<void>;
    hapticFeedback: (type?: 'light' | 'medium' | 'heavy') => Promise<void>;
    getDeviceInfo: () => Promise<DeviceInfo>;
    screenshot: () => Promise<string>;
  };
}

// Hook Return Types
export interface UseMiniAppSDKReturn {
  sdk: MiniAppSDK;
  isReady: boolean;
  error: SDKError | null;
  initialize: () => Promise<void>;
  reset: () => void;
}

export interface UseWalletReturn {
  state: WalletState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  error: string | null;
}

export interface UsePaymentReturn {
  send: (options: PaymentOptions) => Promise<PaymentResponse>;
  status: PaymentStatus;
  history: PaymentTransaction[];
  error: string | null;
}

export interface UseWorldIDReturn {
  verify: (options: WorldIDVerificationOptions) => Promise<WorldIDResponse>;
  status: VerificationStatus;
  proof: WorldIDProof | null;
  isVerified: boolean;
  error: string | null;
}

// Configuration Types
export interface SDKConfig {
  appId: string;
  environment: 'development' | 'staging' | 'production';
  enableAnalytics?: boolean;
  enableOfflineSupport?: boolean;
  enableBiometric?: boolean;
  enableNotifications?: boolean;
  apiEndpoints?: {
    nonce?: string;
    verify?: string;
    worldId?: string;
    payment?: string;
  };
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
  };
}

// Event Types
export interface SDKEventMap {
  'sdk:ready': { sdk: MiniAppSDK };
  'sdk:error': { error: SDKError };
  'wallet:connected': { address: string };
  'wallet:disconnected': Record<string, never>;
  'payment:completed': { transactionHash: string };
  'payment:failed': { error: string };
  'worldid:verified': { proof: WorldIDProof };
  'share:completed': { platform: string };
  'biometric:authenticated': { type: string };
  'notification:received': { data: unknown };
  'offline:synced': { itemCount: number };
}

export type SDKEventListener<T extends keyof SDKEventMap> = (event: SDKEventMap[T]) => void;

// Provider Props
export interface MiniAppSDKProviderProps {
  children: React.ReactNode;
  config: SDKConfig;
  onReady?: () => void;
  onError?: (error: SDKError) => void;
}

// Context Type
export interface MiniAppSDKContextType {
  sdk: MiniAppSDK | null;
  isReady: boolean;
  error: SDKError | null;
  config: SDKConfig;
}