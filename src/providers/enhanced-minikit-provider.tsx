/**
 * Enhanced MiniKit Provider
 * Comprehensive provider for all MiniApp SDK features
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { miniAppSDK, EnhancedMiniAppSDK } from '../lib/miniapp-sdk';
import {
  MiniAppSDK,
  SDKStatus,
  EnvironmentInfo,
  WalletState,
  PaymentStatus,
  VerificationStatus,
  NotificationPermission,
  SyncStatus,
  SDKError,
  WalletAuthOptions,
  WalletAuthPayload,
  PaymentOptions,
  PaymentResponse,
  PaymentTransaction,
  WorldIDVerificationOptions,
  WorldIDResponse,
  WorldIDProof,
  ShareOptions,
  ShareResponse,
  BiometricAuthOptions,
  BiometricAuthResponse,
  PushNotificationOptions,
  AnalyticsEvent,
  UserProperties,
  OfflineQueueItem,
  DeviceInfo
} from '../types/miniapp-sdk';
import { logger } from '../lib/logger';

/**
 * Enhanced MiniKit Context Interface
 */
interface EnhancedMiniKitContextType {
  // Core SDK
  sdk: MiniAppSDK;
  status: SDKStatus;
  environment: EnvironmentInfo;
  isInstalled: boolean;
  version: string | undefined;
  error: SDKError | null;

  // Wallet
  wallet: {
    state: WalletState;
    connect: (options?: WalletAuthOptions) => Promise<WalletAuthPayload>;
    disconnect: () => Promise<void>;
    getBalance: () => Promise<string>;
    switchChain: (chainId: number) => Promise<void>;
  };

  // Payment
  payment: {
    status: PaymentStatus;
    send: (options: PaymentOptions) => Promise<PaymentResponse>;
    request: (request: unknown) => Promise<PaymentResponse>;
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

  // Event management
  addEventListener: (event: string, listener: (data: unknown) => void) => void;
  removeEventListener: (event: string, listener: (data: unknown) => void) => void;

  // Initialization
  initialize: () => Promise<void>;
  isReady: boolean;
}

/**
 * Enhanced MiniKit Context
 */
const EnhancedMiniKitContext = createContext<EnhancedMiniKitContextType | null>(null);

/**
 * Enhanced MiniKit Provider Props
 */
interface EnhancedMiniKitProviderProps {
  children: ReactNode;
  config?: {
    enableAnalytics?: boolean;
    enableOfflineSupport?: boolean;
    enableBiometric?: boolean;
    enableNotifications?: boolean;
    autoInitialize?: boolean;
  };
}

/**
 * Enhanced MiniKit Provider Component
 */
export function EnhancedMiniKitProvider({ 
  children, 
  config = {
    enableAnalytics: true,
    enableOfflineSupport: true,
    enableBiometric: true,
    enableNotifications: true,
    autoInitialize: true
  }
}: EnhancedMiniKitProviderProps) {
  // State management
  const [status, setStatus] = useState<SDKStatus>('idle');
  const [environment, setEnvironment] = useState<EnvironmentInfo>(miniAppSDK.environment);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<SDKError | null>(null);
  const [walletState, setWalletState] = useState<WalletState>(miniAppSDK.wallet.state);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(miniAppSDK.payment.status);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(miniAppSDK.worldId.status);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(miniAppSDK.notifications.permission);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(miniAppSDK.offline.status);

  // Event handlers
  const handleSDKReady = useCallback(() => {
    setStatus(miniAppSDK.status);
    setIsReady(true);
    logger.info('Enhanced MiniKit Provider: SDK ready');
  }, []);

  const handleSDKError = useCallback((data: { error: SDKError }) => {
    setError(data.error);
    logger.error('Enhanced MiniKit Provider: SDK error', data.error);
  }, []);

  const handleWalletConnected = useCallback((data: { address: string }) => {
    setWalletState(miniAppSDK.wallet.state);
    logger.info('Enhanced MiniKit Provider: Wallet connected', data);
  }, []);

  const handleWalletDisconnected = useCallback(() => {
    setWalletState(miniAppSDK.wallet.state);
    logger.info('Enhanced MiniKit Provider: Wallet disconnected');
  }, []);

  const handlePaymentCompleted = useCallback((data: { transactionHash: string }) => {
    setPaymentStatus(miniAppSDK.payment.status);
    logger.info('Enhanced MiniKit Provider: Payment completed', data);
  }, []);

  const handlePaymentFailed = useCallback((data: { error: string }) => {
    setPaymentStatus(miniAppSDK.payment.status);
    logger.error('Enhanced MiniKit Provider: Payment failed', data);
  }, []);

  const handleWorldIDVerified = useCallback((data: { proof: WorldIDProof }) => {
    setVerificationStatus(miniAppSDK.worldId.status);
    logger.info('Enhanced MiniKit Provider: World ID verified', data);
  }, []);

  const handleOfflineSynced = useCallback((data: { itemCount: number }) => {
    setSyncStatus(miniAppSDK.offline.status);
    logger.info('Enhanced MiniKit Provider: Offline sync completed', data);
  }, []);

  // Initialize SDK and event listeners
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        logger.info('Enhanced MiniKit Provider: Initializing SDK');
        
        // Set up event listeners
        miniAppSDK.addEventListener('sdk:ready', handleSDKReady);
        miniAppSDK.addEventListener('sdk:error', handleSDKError);
        miniAppSDK.addEventListener('wallet:connected', handleWalletConnected);
        miniAppSDK.addEventListener('wallet:disconnected', handleWalletDisconnected);
        miniAppSDK.addEventListener('payment:completed', handlePaymentCompleted);
        miniAppSDK.addEventListener('payment:failed', handlePaymentFailed);
        miniAppSDK.addEventListener('worldid:verified', handleWorldIDVerified);
        miniAppSDK.addEventListener('offline:synced', handleOfflineSynced);

        // Initialize SDK if auto-initialize is enabled
        if (config.autoInitialize) {
          await miniAppSDK.initialize();
          setStatus(miniAppSDK.status);
          setEnvironment(miniAppSDK.environment);
          setIsReady(true);
        }
      } catch (error) {
        logger.error('Enhanced MiniKit Provider: Initialization failed', error);
        setError(error as SDKError);
      }
    };

    initializeSDK();

    // Cleanup event listeners on unmount
    return () => {
      miniAppSDK.removeEventListener('sdk:ready', handleSDKReady);
      miniAppSDK.removeEventListener('sdk:error', handleSDKError);
      miniAppSDK.removeEventListener('wallet:connected', handleWalletConnected);
      miniAppSDK.removeEventListener('wallet:disconnected', handleWalletDisconnected);
      miniAppSDK.removeEventListener('payment:completed', handlePaymentCompleted);
      miniAppSDK.removeEventListener('payment:failed', handlePaymentFailed);
      miniAppSDK.removeEventListener('worldid:verified', handleWorldIDVerified);
      miniAppSDK.removeEventListener('offline:synced', handleOfflineSynced);
    };
  }, [config.autoInitialize, handleSDKReady, handleSDKError, handleWalletConnected, handleWalletDisconnected, handlePaymentCompleted, handlePaymentFailed, handleWorldIDVerified, handleOfflineSynced]);

  // Manual initialization function
  const initialize = useCallback(async () => {
    try {
      await miniAppSDK.initialize();
      setStatus(miniAppSDK.status);
      setEnvironment(miniAppSDK.environment);
      setIsReady(true);
    } catch (error) {
      logger.error('Enhanced MiniKit Provider: Manual initialization failed', error);
      setError(error as SDKError);
      throw error;
    }
  }, []);

  // Context value
  const contextValue: EnhancedMiniKitContextType = {
    // Core SDK
    sdk: miniAppSDK,
    status,
    environment,
    isInstalled: miniAppSDK.isInstalled,
    version: miniAppSDK.version,
    error,

    // Wallet
    wallet: {
      state: walletState,
      connect: miniAppSDK.wallet.connect,
      disconnect: miniAppSDK.wallet.disconnect,
      getBalance: miniAppSDK.wallet.getBalance,
      switchChain: miniAppSDK.wallet.switchChain
    },

    // Payment
    payment: {
      status: paymentStatus,
      send: miniAppSDK.payment.send,
      request: miniAppSDK.payment.request,
      getHistory: miniAppSDK.payment.getHistory
    },

    // World ID
    worldId: {
      status: verificationStatus,
      verify: miniAppSDK.worldId.verify,
      getProof: miniAppSDK.worldId.getProof,
      isVerified: miniAppSDK.worldId.isVerified
    },

    // Sharing
    sharing: {
      share: miniAppSDK.sharing.share,
      canShare: miniAppSDK.sharing.canShare,
      getSupportedPlatforms: miniAppSDK.sharing.getSupportedPlatforms
    },

    // Biometric
    biometric: {
      isAvailable: miniAppSDK.biometric.isAvailable,
      authenticate: miniAppSDK.biometric.authenticate,
      getSupportedTypes: miniAppSDK.biometric.getSupportedTypes
    },

    // Notifications
    notifications: {
      permission: notificationPermission,
      requestPermission: miniAppSDK.notifications.requestPermission,
      schedule: miniAppSDK.notifications.schedule,
      clear: miniAppSDK.notifications.clear
    },

    // Analytics
    analytics: {
      track: miniAppSDK.analytics.track,
      setUserProperties: miniAppSDK.analytics.setUserProperties,
      flush: miniAppSDK.analytics.flush
    },

    // Offline
    offline: {
      status: syncStatus,
      queue: miniAppSDK.offline.queue,
      sync: miniAppSDK.offline.sync,
      clearQueue: miniAppSDK.offline.clearQueue
    },

    // Utilities
    utils: {
      openURL: miniAppSDK.utils.openURL,
      hapticFeedback: miniAppSDK.utils.hapticFeedback,
      getDeviceInfo: miniAppSDK.utils.getDeviceInfo,
      screenshot: miniAppSDK.utils.screenshot
    },

    // Event management
    addEventListener: miniAppSDK.addEventListener.bind(miniAppSDK),
    removeEventListener: miniAppSDK.removeEventListener.bind(miniAppSDK),

    // Initialization
    initialize,
    isReady
  };

  return (
    <EnhancedMiniKitContext.Provider value={contextValue}>
      {children}
    </EnhancedMiniKitContext.Provider>
  );
}

/**
 * Enhanced MiniKit Hook
 */
export function useEnhancedMiniKit(): EnhancedMiniKitContextType {
  const context = useContext(EnhancedMiniKitContext);
  
  if (!context) {
    throw new Error('useEnhancedMiniKit must be used within an EnhancedMiniKitProvider');
  }
  
  return context;
}

/**
 * Wallet Hook
 */
export function useEnhancedWallet() {
  const { wallet, environment } = useEnhancedMiniKit();
  return {
    ...wallet,
    isWorldApp: environment.isWorldApp,
    isDevelopment: environment.isDevelopment
  };
}

/**
 * Payment Hook
 */
export function useEnhancedPayment() {
  const { payment } = useEnhancedMiniKit();
  return payment;
}

/**
 * World ID Hook
 */
export function useEnhancedWorldID() {
  const { worldId } = useEnhancedMiniKit();
  return worldId;
}

/**
 * Sharing Hook
 */
export function useEnhancedSharing() {
  const { sharing } = useEnhancedMiniKit();
  return sharing;
}

/**
 * Biometric Hook
 */
export function useEnhancedBiometric() {
  const { biometric } = useEnhancedMiniKit();
  return biometric;
}

/**
 * Notifications Hook
 */
export function useEnhancedNotifications() {
  const { notifications } = useEnhancedMiniKit();
  return notifications;
}

/**
 * Analytics Hook
 */
export function useEnhancedAnalytics() {
  const { analytics } = useEnhancedMiniKit();
  return analytics;
}

/**
 * Offline Hook
 */
export function useEnhancedOffline() {
  const { offline } = useEnhancedMiniKit();
  return offline;
}

/**
 * Utilities Hook
 */
export function useEnhancedUtils() {
  const { utils } = useEnhancedMiniKit();
  return utils;
}

/**
 * Environment Hook
 */
export function useEnhancedEnvironment() {
  const { environment, isInstalled, version } = useEnhancedMiniKit();
  return {
    ...environment,
    isInstalled,
    version
  };
}

/**
 * Status Hook
 */
export function useEnhancedStatus() {
  const { status, error, isReady } = useEnhancedMiniKit();
  return {
    status,
    error,
    isReady,
    isLoading: status === 'initializing',
    hasError: !!error
  };
}

export default EnhancedMiniKitProvider;