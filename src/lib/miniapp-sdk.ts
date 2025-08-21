/**
 * Enhanced MiniApp SDK Core Implementation
 * Comprehensive SDK for all MiniApp features
 */

// Global type declaration for MiniKit
declare global {
  interface Window {
    MiniKit?: {
      [key: string]: unknown;
      walletAddress?: string;
    };
  }
}

import { MiniKit, Tokens } from '@worldcoin/minikit-js';
import {
  MiniAppSDK,
  SDKStatus,
  EnvironmentInfo,
  WalletState,
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
  NotificationPermission,
  PushNotificationOptions,
  AnalyticsEvent,
  UserProperties,
  OfflineQueueItem,
  SyncStatus,
  SDKError,
  SDKErrorCode,
  DeviceInfo,
  PaymentStatus,
  VerificationStatus,
  SDKEventMap
} from '../types/miniapp-sdk';
import { logger } from './logger';

/**
 * Enhanced MiniApp SDK Implementation
 */
export class EnhancedMiniAppSDK implements MiniAppSDK {
  private _status: SDKStatus = 'idle';
  private _environment: EnvironmentInfo;
  private _walletState: WalletState;
  private _paymentStatus: PaymentStatus = 'idle';
  private _verificationStatus: VerificationStatus = 'idle';
  private _worldIdProof: WorldIDProof | null = null;
  private _offlineQueue: OfflineQueueItem[] = [];
  private _syncStatus: SyncStatus;
  private _notificationPermission: NotificationPermission;
  private _eventListeners: Map<string, ((data: unknown) => void)[]> = new Map();
  private _userProperties: UserProperties = {};
  private _paymentHistory: PaymentTransaction[] = [];

  constructor() {
    this._environment = this.detectEnvironment();
    this._walletState = {
      isConnected: false,
      address: null,
      isLoading: false
    };
    this._syncStatus = {
      isOnline: typeof window !== 'undefined' && typeof navigator !== 'undefined' ? navigator.onLine : true,
      pendingItems: 0,
      isSyncing: false
    };
    this._notificationPermission = {
      status: 'default',
      canRequest: true
    };

    this.setupEventListeners();
    this.initializeOfflineSupport();
  }

  // Core Properties
  get status(): SDKStatus {
    return this._status;
  }

  get environment(): EnvironmentInfo {
    return this._environment;
  }

  get isInstalled(): boolean {
    return typeof window !== 'undefined' && !!window.MiniKit;
  }

  get version(): string | undefined {
    return process.env.NEXT_PUBLIC_SDK_VERSION || '1.0.0';
  }

  // Environment Detection
  private detectEnvironment(): EnvironmentInfo {
    const isWorldApp = typeof window !== 'undefined' && !!window.MiniKit;
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
    const hasValidAppId = !!(process.env.NEXT_PUBLIC_WORLD_APP_ID && 
      !process.env.NEXT_PUBLIC_WORLD_APP_ID.includes('__FROM_DEV_PORTAL__'));
    
    return {
      isWorldApp,
      isDevelopment,
      isDevMode,
      hasValidAppId,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      version: this.version
    };
  }

  // Event System
  private setupEventListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this._syncStatus.isOnline = true;
        this.sync();
      });
      
      window.addEventListener('offline', () => {
        this._syncStatus.isOnline = false;
      });
    }
  }

  private emit(event: string, data: unknown): void {
    const listeners = this._eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        logger.error('Event listener error', { event, error: error as string });
      }
    });
  }

  // Error Handling
  private createError(code: SDKErrorCode, message: string, details?: unknown): SDKError {
    return {
      code,
      message,
      details,
      timestamp: new Date()
    };
  }

  private handleError(error: SDKError): void {
    logger.error('SDK Error', { ...error });
    this.emit('sdk:error', { error });
  }

  // Wallet Implementation
  public wallet = {
    get state(): WalletState {
      return miniAppSDK._walletState;
    },

    connect: async (options?: WalletAuthOptions): Promise<WalletAuthPayload> => {
      try {
        this._walletState.isLoading = true;
        logger.walletAuth('connect_start', options ? { options: JSON.stringify(options) } : {});

        if (!this.isInstalled) {
          throw this.createError('SDK_NOT_AVAILABLE', 'MiniKit is not available');
        }

        // Get nonce if not provided
        const nonce = options?.nonce || await this.fetchNonce();
        
        // Perform wallet authentication
        const authOptions = {
          nonce,
          requestId: options?.requestId || this.generateRequestId(),
          expirationTime: new Date(Date.now() + 10 * 60 * 1000),
          notBefore: new Date(),
          statement: options?.statement || 'Sign in to MiniApp',
          uri: options?.uri || window.location.origin,
          version: options?.version || '1',
          chainId: options?.chainId || 1
        };

        const { finalPayload } = await MiniKit.commandsAsync.walletAuth(authOptions);
        
        if (finalPayload?.status === 'error') {
          throw this.createError('WALLET_AUTH_DECLINED', finalPayload.error_code || 'Authentication failed');
        }

        const address = window.MiniKit?.walletAddress;
        if (!address) {
          throw this.createError('WALLET_AUTH_DECLINED', 'No wallet address received');
        }

        // Verify signature if provided
        if (finalPayload.message && finalPayload.signature) {
          await this.verifySignature(address, finalPayload.message, finalPayload.signature);
        }

        // Update wallet state
        this._walletState = {
          isConnected: true,
          address,
          isLoading: false,
          lastConnected: new Date()
        };

        logger.walletAuth('connect_success', { address });
        this.emit('wallet:connected', { address });

        return {
          status: 'success',
          address,
          message: finalPayload.message,
          signature: finalPayload.signature
        };
      } catch (error) {
        this._walletState.isLoading = false;
        const sdkError = error instanceof Error ? 
          this.createError('WALLET_AUTH_DECLINED', error.message, error) :
          this.createError('UNKNOWN_ERROR', 'Unknown wallet error', error);
        this.handleError(sdkError);
        throw sdkError;
      }
    },

    disconnect: async (): Promise<void> => {
      this._walletState = {
        isConnected: false,
        address: null,
        isLoading: false
      };
      logger.walletAuth('disconnect', {});
      this.emit('wallet:disconnected', {});
    },

    getBalance: async (): Promise<string> => {
      if (!this._walletState.isConnected || !this._walletState.address) {
        throw this.createError('WALLET_AUTH_DECLINED', 'Wallet not connected');
      }
      // Implementation would depend on chain integration
      return '0';
    },

    switchChain: async (chainId: number): Promise<void> => {
      if (!this._walletState.isConnected) {
        throw this.createError('WALLET_AUTH_DECLINED', 'Wallet not connected');
      }
      // Implementation would depend on MiniKit chain switching support
      logger.info('Chain switch requested', { chainId });
    }
  };

  // Payment Implementation
  public payment = {
    get status(): PaymentStatus {
      return miniAppSDK._paymentStatus;
    },

    send: async (options: PaymentOptions): Promise<PaymentResponse> => {
      try {
        this._paymentStatus = 'processing';
        logger.info('Payment send started', { options: JSON.stringify(options) });

        if (!this.isInstalled) {
          throw this.createError('SDK_NOT_AVAILABLE', 'MiniKit is not available');
        }

        // Use MiniKit payment functionality
        const paymentResult = await MiniKit.commandsAsync.pay({
          reference: this.generateTransactionId(),
          to: options.recipient,
          tokens: [{
          symbol: (options.token as Tokens) || Tokens.WLD,
          token_amount: options.amount
        }],
          description: options.memo || 'Payment'
        });

        this._paymentStatus = 'completed';
        
        const transaction: PaymentTransaction = {
          id: this.generateTransactionId(),
          hash: '',
          from: this._walletState.address || '',
          to: options.recipient,
          amount: options.amount,
          token: options.token,
          status: 'pending',
          timestamp: new Date(),
          confirmations: 0,
          memo: options.memo
        };

        this._paymentHistory.unshift(transaction);
        this.emit('payment:completed', { transactionHash: transaction.hash });

        return {
          status: 'success',
          transaction_hash: transaction.hash
        };
      } catch (error) {
        this._paymentStatus = 'failed';
        const sdkError = error instanceof Error ?
          this.createError('PAYMENT_FAILED', error.message, error) :
          this.createError('PAYMENT_FAILED', 'Payment failed', error);
        this.handleError(sdkError);
        this.emit('payment:failed', { error: sdkError.message });
        throw sdkError;
      }
    },

    request: async (request: unknown): Promise<PaymentResponse> => {
      // Implementation for payment requests
      throw this.createError('SDK_NOT_AVAILABLE', 'Payment requests not yet implemented');
    },

    getHistory: async (): Promise<PaymentTransaction[]> => {
      return [...this._paymentHistory];
    }
  };

  // World ID Implementation
  public worldId = {
    get status(): VerificationStatus {
      return miniAppSDK._verificationStatus;
    },

    verify: async (options: WorldIDVerificationOptions): Promise<WorldIDResponse> => {
      try {
        this._verificationStatus = 'verifying';
        logger.info('World ID verification started', { options: JSON.stringify(options) });

        if (!this.isInstalled) {
          throw this.createError('SDK_NOT_AVAILABLE', 'MiniKit is not available');
        }

        // Use MiniKit World ID verification
        const verificationResult = await MiniKit.commandsAsync.verify({
          action: options.action,
          signal: options.signal || ''
        });

        if (!verificationResult) {
          throw this.createError('VERIFICATION_FAILED', 'Verification failed');
        }

        this._worldIdProof = (verificationResult as unknown as WorldIDResponse & { proof?: WorldIDProof }).proof || null;
        this._verificationStatus = 'verified';
        
        this.emit('worldid:verified', { proof: this._worldIdProof });

        return {
          status: 'success',
          proof: this._worldIdProof || undefined
        };
      } catch (error) {
        this._verificationStatus = 'failed';
        const sdkError = error instanceof Error ?
          this.createError('VERIFICATION_FAILED', error.message, error) :
          this.createError('VERIFICATION_FAILED', 'Verification failed', error);
        this.handleError(sdkError);
        throw sdkError;
      }
    },

    getProof: async (): Promise<WorldIDProof | null> => {
      return this._worldIdProof;
    },

    isVerified: (): boolean => {
      return this._verificationStatus === 'verified' && !!this._worldIdProof;
    }
  };

  // Sharing Implementation
  public sharing = {
    share: async (options: ShareOptions): Promise<ShareResponse> => {
      try {
        logger.info('Share started', { options: JSON.stringify(options) });

        if (!this.isInstalled) {
          // Fallback to Web Share API
          if (navigator.share) {
            await navigator.share({
              title: options.content.title,
              text: options.content.text,
              url: options.content.url
            });
            return { status: 'success', platform: 'native' };
          }
          throw this.createError('SDK_NOT_AVAILABLE', 'Sharing not available');
        }

        // Use MiniKit sharing
        const shareResult = await MiniKit.commandsAsync.share(options.content);
        
        this.emit('share:completed', { platform: 'unknown' }); // shareResult.platform not available
        
        return {
          status: 'success',
          platform: 'unknown' // shareResult.platform not available
        };
      } catch (error) {
        const sdkError = error instanceof Error ?
          this.createError('SHARE_CANCELLED', error.message, error) :
          this.createError('SHARE_CANCELLED', 'Share cancelled', error);
        this.handleError(sdkError);
        throw sdkError;
      }
    },

    canShare: (): boolean => {
      return this.isInstalled || !!navigator.share;
    },

    getSupportedPlatforms: (): string[] => {
      const platforms = ['native'];
      if (this.isInstalled) {
        platforms.push('twitter', 'telegram', 'whatsapp');
      }
      return platforms;
    }
  };

  // Biometric Implementation
  public biometric = {
    isAvailable: async (): Promise<boolean> => {
      if (!this.isInstalled) return false;
      // Check if device supports biometric authentication
      return true; // Placeholder
    },

    authenticate: async (options?: BiometricAuthOptions): Promise<BiometricAuthResponse> => {
      try {
        if (!this.isInstalled) {
          throw this.createError('BIOMETRIC_NOT_AVAILABLE', 'Biometric authentication not available');
        }

        // Use MiniKit biometric authentication
        // Note: biometricAuth might not be available in current MiniKit version
        // const authResult = await MiniKit.commandsAsync.biometricAuth(options || {});
        throw new Error('Biometric authentication not available in current MiniKit version');
      } catch (error) {
        const sdkError = error instanceof Error ?
          this.createError('BIOMETRIC_NOT_AVAILABLE', error.message, error) :
          this.createError('BIOMETRIC_NOT_AVAILABLE', 'Biometric authentication failed', error);
        this.handleError(sdkError);
        throw sdkError;
      }
    },

    getSupportedTypes: async (): Promise<string[]> => {
      if (!this.isInstalled) return [];
      return ['fingerprint', 'face']; // Placeholder
    }
  };

  // Notifications Implementation
  public notifications = {
    get permission(): NotificationPermission {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      return { status: 'default', canRequest: true }; // _notificationPermission not available on notifications object
    },

    requestPermission: async (): Promise<NotificationPermission> => {
      try {
        if (!this.isInstalled) {
          // Fallback to web notifications
          if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this._notificationPermission = {
              status: permission,
              canRequest: permission === 'default'
            };
            return this._notificationPermission;
          }
          throw this.createError('NOTIFICATION_BLOCKED', 'Notifications not supported');
        }

        // Use MiniKit notification permission
        // Note: requestNotificationPermission might not be available in current MiniKit version
        // const permissionResult = await MiniKit.commandsAsync.requestNotificationPermission();
        // For now, assume permission is granted
        const permissionResult: NotificationPermission = { 
          status: 'granted',
          canRequest: false
        };
        this._notificationPermission = permissionResult;
        return this._notificationPermission;
      } catch (error) {
        const sdkError = error instanceof Error ?
          this.createError('PERMISSION_DENIED', error.message, error) :
          this.createError('PERMISSION_DENIED', 'Permission denied', error);
        this.handleError(sdkError);
        throw sdkError;
      }
    },

    schedule: async (options: PushNotificationOptions): Promise<void> => {
      try {
        if (!this.isInstalled) {
          // Fallback to web notifications
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(options.title, {
              body: options.body,
              icon: options.icon,
              badge: options.badge,
              tag: options.tag,
              data: options.data
            });
            return;
          }
          throw this.createError('NOTIFICATION_BLOCKED', 'Notifications not available');
        }

        // Use MiniKit notifications
        // Note: scheduleNotification might not be available in current MiniKit version
        // await MiniKit.commandsAsync.scheduleNotification(options);
        throw new Error('Push notification scheduling not available in current MiniKit version');
      } catch (error) {
        const sdkError = error instanceof Error ?
          this.createError('NOTIFICATION_BLOCKED', error.message, error) :
          this.createError('NOTIFICATION_BLOCKED', 'Notification failed', error);
        this.handleError(sdkError);
        throw sdkError;
      }
    },

    clear: async (tag?: string): Promise<void> => {
      if (this.isInstalled) {
        // Note: clearNotifications might not be available in current MiniKit version
        // await MiniKit.commandsAsync.clearNotifications(tag);
        logger.info('Clear notifications called', { tag });
      }
    }
  };

  // Analytics Implementation
  public analytics = {
    track: async (event: AnalyticsEvent): Promise<void> => {
      try {
        const enrichedEvent = {
          ...event,
          timestamp: event.timestamp || new Date(),
          userId: event.userId || this._userProperties.userId,
          sessionId: this.getSessionId(),
          properties: {
            ...event.properties,
            ...this._userProperties,
            sdk_version: this.version,
            platform: this._environment.isWorldApp ? 'world_app' : 'web'
          }
        };

        if (this._syncStatus.isOnline) {
          await this.sendAnalyticsEvent(enrichedEvent);
        } else {
          this.queueOfflineItem({
            id: this.generateId(),
            type: 'analytics',
            data: enrichedEvent,
            timestamp: new Date(),
            retryCount: 0,
            maxRetries: 3
          });
        }

        logger.info('Analytics event tracked', { name: event.name });
      } catch (error) {
        logger.error('Analytics tracking failed', { event: event.name, error: String(error) });
      }
    },

    setUserProperties: async (properties: UserProperties): Promise<void> => {
      this._userProperties = { ...this._userProperties, ...properties };
      logger.info('User properties updated', properties);
    },

    flush: async (): Promise<void> => {
      // Force send all pending analytics events
      await this.sync();
    }
  };

  // Offline Support Implementation
  public get offline() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return {
      get status(): SyncStatus {
        return self._syncStatus;
      },
      get queue(): OfflineQueueItem[] {
        // Ensure _offlineQueue is always an array
        if (!Array.isArray(self._offlineQueue)) {
          logger.warn('Offline queue is not an array, resetting to empty array');
          self._offlineQueue = [];
        }
        return [...self._offlineQueue];
      },
      sync: self.sync.bind(self),
      clearQueue: self.clearOfflineQueue.bind(self)
    };
  }

  private async clearOfflineQueue(): Promise<void> {
    this._offlineQueue = [];
    this._syncStatus.pendingItems = 0;
    // Clear from localStorage as well
    try {
      localStorage.removeItem('miniapp_offline_queue');
    } catch (error) {
      logger.error('Failed to clear offline queue from storage', { error: String(error) });
    }
    logger.info('Offline queue cleared');
  }

  // Utilities Implementation
  public utils = {
    openURL: async (url: string): Promise<void> => {
      if (this.isInstalled) {
        // OpenURL functionality may not be available in current MiniKit version
        window.open(url, '_blank');
      } else {
        window.open(url, '_blank');
      }
    },

    hapticFeedback: async (type: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> => {
      if (this.isInstalled) {
        // Haptic feedback functionality may not be available in current MiniKit version
        // await MiniKit.commandsAsync.sendHapticFeedback({ type });
      }
    },

    getDeviceInfo: async (): Promise<DeviceInfo> => {
      return {
        platform: navigator.platform,
        version: navigator.appVersion,
        model: 'Unknown',
        manufacturer: 'Unknown',
        isPhysicalDevice: true,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        locale: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    },

    screenshot: async (): Promise<string> => {
      if (this.isInstalled) {
        // Screenshot functionality not available in current MiniKit version
        throw new Error('Screenshot functionality not available');
      }
      throw this.createError('SDK_NOT_AVAILABLE', 'Screenshot not available');
    }
  };

  // Private Helper Methods
  private async fetchNonce(): Promise<string> {
    const response = await fetch('/api/siwe/nonce');
    const data = await response.json();
    return data.nonce;
  }

  private async verifySignature(address: string, message: string, signature: string): Promise<void> {
    const response = await fetch('/api/siwe/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, message, signature })
    });
    
    const result = await response.json();
    if (!result.ok) {
      throw this.createError('VERIFICATION_FAILED', 'Signature verification failed');
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionId(): string {
    // Simple session ID generation - could be more sophisticated
    return sessionStorage.getItem('sdk_session_id') || this.generateId();
  }

  private async sendAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
    // Implementation would send to analytics service
    logger.info('Analytics event sent', { event: event.name });
  }

  private queueOfflineItem(item: OfflineQueueItem): void {
    // Ensure _offlineQueue is always an array
    if (!Array.isArray(this._offlineQueue)) {
      logger.warn('Offline queue is not an array, resetting to empty array');
      this._offlineQueue = [];
    }
    this._offlineQueue.push(item);
    this._syncStatus.pendingItems = this._offlineQueue.length;
  }

  private initializeOfflineSupport(): void {
    // Load offline queue from storage
    try {
      const stored = localStorage.getItem('miniapp_offline_queue');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure the parsed data is an array
        if (Array.isArray(parsed)) {
          this._offlineQueue = parsed;
          this._syncStatus.pendingItems = this._offlineQueue.length;
        } else {
          logger.warn('Invalid offline queue data in storage, resetting to empty array');
          this._offlineQueue = [];
          this._syncStatus.pendingItems = 0;
        }
      }
    } catch (error) {
      logger.error('Failed to load offline queue', { error: String(error) });
      // Ensure _offlineQueue is always an array even if parsing fails
      this._offlineQueue = [];
      this._syncStatus.pendingItems = 0;
    }
  }

  private async sync(): Promise<void> {
    // Ensure _offlineQueue is always an array
    if (!Array.isArray(this._offlineQueue)) {
      logger.warn('Offline queue is not an array, resetting to empty array');
      this._offlineQueue = [];
    }
    
    if (!this._syncStatus.isOnline || this._syncStatus.isSyncing || this._offlineQueue.length === 0) {
      return;
    }

    this._syncStatus.isSyncing = true;
    logger.info('Starting offline sync', { itemCount: this._offlineQueue.length });

    const itemsToSync = [...this._offlineQueue];
    const successfulItems: string[] = [];

    for (const item of itemsToSync) {
      try {
        if (item.type === 'analytics') {
          await this.sendAnalyticsEvent(item.data as AnalyticsEvent);
        }
        // Add other sync types as needed
        
        successfulItems.push(item.id);
      } catch (error) {
        item.retryCount++;
        if (item.retryCount >= item.maxRetries) {
          successfulItems.push(item.id); // Remove failed items after max retries
          logger.error('Offline item failed after max retries', { item: item.id, error: String(error) });
        }
      }
    }

    // Remove successfully synced items
    this._offlineQueue = this._offlineQueue.filter(item => !successfulItems.includes(item.id));
    this._syncStatus.pendingItems = this._offlineQueue.length;
    this._syncStatus.lastSync = new Date();
    this._syncStatus.isSyncing = false;

    // Save updated queue
    try {
      localStorage.setItem('miniapp_offline_queue', JSON.stringify(this._offlineQueue));
    } catch (error) {
      logger.error('Failed to save offline queue', { error: String(error) });
    }

    this.emit('offline:synced', { itemCount: successfulItems.length });
    logger.info('Offline sync completed', { syncedItems: successfulItems.length, remainingItems: this._offlineQueue.length });
  }

  // Public initialization method
  public async initialize(): Promise<void> {
    try {
      this._status = 'initializing';
      logger.info('Initializing Enhanced MiniApp SDK');

      if (this.isInstalled) {
        // Initialize MiniKit if available
        await MiniKit.install();
      }

      this._status = 'ready';
      logger.info('Enhanced MiniApp SDK initialized successfully');
      this.emit('sdk:ready', { sdk: this });
    } catch (error) {
      this._status = 'error';
      const sdkError = error instanceof Error ?
        this.createError('SDK_NOT_AVAILABLE', error.message, error) :
        this.createError('UNKNOWN_ERROR', 'SDK initialization failed', error);
      this.handleError(sdkError);
      throw sdkError;
    }
  }

  // Event listener management
  public addEventListener(event: string, listener: (data: unknown) => void): void {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, []);
    }
    this._eventListeners.get(event)!.push(listener);
  }

  public removeEventListener(event: string, listener: (data: unknown) => void): void {
    const listeners = this._eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
}

// Export singleton instance
export const miniAppSDK = new EnhancedMiniAppSDK();
export default miniAppSDK;