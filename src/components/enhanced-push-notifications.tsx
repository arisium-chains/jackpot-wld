/**
 * Enhanced Push Notifications Component
 * Comprehensive push notification management and integration
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useEnhancedNotifications, useEnhancedAnalytics, useEnhancedWallet } from '../providers/enhanced-minikit-provider';
import { PushNotificationOptions, SDKError } from '../types/miniapp-sdk';
import { logger } from '../lib/logger';

/**
 * Enhanced Push Notifications Props
 */
interface EnhancedPushNotificationsProps {
  onPermissionChange?: (granted: boolean) => void;
  onNotificationReceived?: (notification: NotificationData) => void;
  onError?: (error: SDKError) => void;
  className?: string;
  showHistory?: boolean;
  autoRequestPermission?: boolean;
  enableQuietHours?: boolean;
  customCategories?: NotificationCategory[];
}

/**
 * Notification data structure
 */
interface NotificationData {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  category?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: Date;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  silent?: boolean;
  requireInteraction?: boolean;
}

/**
 * Notification action
 */
interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

/**
 * Notification category
 */
interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  sound?: boolean;
  vibration?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Notification history item
 */
interface NotificationHistoryItem extends NotificationData {
  read: boolean;
  clicked: boolean;
  dismissed: boolean;
}

/**
 * Permission status
 */
type PermissionStatus = 'default' | 'granted' | 'denied' | 'checking';

/**
 * Default notification categories
 */
const DEFAULT_CATEGORIES: NotificationCategory[] = [
  {
    id: 'jackpot',
    name: 'Jackpot Alerts',
    description: 'Notifications about jackpot wins and draws',
    enabled: true,
    sound: true,
    vibration: true,
    priority: 'high'
  },
  {
    id: 'deposits',
    name: 'Deposit Confirmations',
    description: 'Confirmations for deposit transactions',
    enabled: true,
    sound: false,
    vibration: false,
    priority: 'normal'
  },
  {
    id: 'withdrawals',
    name: 'Withdrawal Updates',
    description: 'Updates on withdrawal requests and completions',
    enabled: true,
    sound: true,
    vibration: false,
    priority: 'normal'
  },
  {
    id: 'security',
    name: 'Security Alerts',
    description: 'Important security notifications',
    enabled: true,
    sound: true,
    vibration: true,
    priority: 'urgent'
  },
  {
    id: 'promotions',
    name: 'Promotions & News',
    description: 'Marketing messages and platform updates',
    enabled: false,
    sound: false,
    vibration: false,
    priority: 'low'
  }
];

/**
 * Enhanced Push Notifications Component
 */
export function EnhancedPushNotifications({
  onPermissionChange,
  onNotificationReceived,
  onError,
  className = '',
  showHistory = true,
  autoRequestPermission = false,
  enableQuietHours = true,
  customCategories
}: EnhancedPushNotificationsProps) {
  // Hooks
  const notifications = useEnhancedNotifications();
  const analytics = useEnhancedAnalytics();
  const wallet = useEnhancedWallet();

  // Component state
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('checking');
  const [categories, setCategories] = useState<NotificationCategory[]>(customCategories || DEFAULT_CATEGORIES);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistoryItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [quietHours, setQuietHours] = useState({ start: '22:00', end: '08:00', enabled: enableQuietHours });
  const [testNotification, setTestNotification] = useState({
    title: 'Test Notification',
    body: 'This is a test notification from JackpotWLD',
    category: 'jackpot'
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    endpoint?: string;
    keys?: { p256dh: string; auth: string };
  }>({});

  // Check permission status on mount
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  // Load notification history
  useEffect(() => {
    if (showHistory) {
      loadNotificationHistory();
    }
  }, [showHistory]);

  // Auto-request permission if enabled
  useEffect(() => {
    if (autoRequestPermission && permissionStatus === 'default') {
      requestPermission();
    }
  }, [autoRequestPermission, permissionStatus]);

  // Update permission change callback
  useEffect(() => {
    onPermissionChange?.(permissionStatus === 'granted');
  }, [permissionStatus, onPermissionChange]);

  // Check current permission status
  const checkPermissionStatus = useCallback(async () => {
    try {
      setPermissionStatus('checking');
      const hasPermission = await notifications.hasPermission();
      setPermissionStatus(hasPermission ? 'granted' : 'default');
      
      if (hasPermission) {
        // Load subscription info
        const subscription = await notifications.getSubscription();
        if (subscription) {
          setSubscriptionInfo({
            endpoint: subscription.endpoint,
            keys: subscription.keys
          });
        }
      }
    } catch (error) {
      setPermissionStatus('denied');
      logger.error('Failed to check notification permission', error);
    }
  }, [notifications]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (isProcessing || permissionStatus === 'granted') {
      return;
    }

    setIsProcessing(true);

    try {
      // Track permission request
      await analytics.track({
        name: 'notification_permission_requested',
        properties: {
          wallet_connected: wallet.state.isConnected,
          wallet_address: wallet.state.address,
          auto_request: autoRequestPermission
        }
      });

      const granted = await notifications.requestPermission();
      setPermissionStatus(granted ? 'granted' : 'denied');

      if (granted) {
        // Subscribe to push notifications
        const subscription = await notifications.subscribe();
        if (subscription) {
          setSubscriptionInfo({
            endpoint: subscription.endpoint,
            keys: subscription.keys
          });
        }

        // Track successful permission grant
        await analytics.track({
          name: 'notification_permission_granted',
          properties: {
            subscription_endpoint: subscription?.endpoint
          }
        });

        logger.info('Push notification permission granted');
      } else {
        // Track permission denial
        await analytics.track({
          name: 'notification_permission_denied',
          properties: {}
        });

        logger.warn('Push notification permission denied');
      }
    } catch (error) {
      setPermissionStatus('denied');
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to request permission';
      
      // Track permission error
      await analytics.track({
        name: 'notification_permission_error',
        properties: {
          error_message: errorMessage
        }
      });

      onError?.({
        code: 'NOTIFICATION_PERMISSION_FAILED',
        message: errorMessage,
        timestamp: new Date()
      });

      logger.error('Failed to request notification permission', error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, permissionStatus, notifications, analytics, wallet.state, autoRequestPermission, onError]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (permissionStatus !== 'granted') {
      return;
    }

    try {
      const notificationData: NotificationData = {
        id: `test-${Date.now()}`,
        title: testNotification.title,
        body: testNotification.body,
        category: testNotification.category,
        priority: 'normal',
        timestamp: new Date(),
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge-icon.png',
        tag: 'test-notification',
        requireInteraction: false,
        actions: [
          { action: 'view', title: 'View', icon: '/icons/view-icon.png' },
          { action: 'dismiss', title: 'Dismiss' }
        ]
      };

      const options: PushNotificationOptions = {
        title: notificationData.title,
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        tag: notificationData.tag,
        data: { category: notificationData.category, test: true },
        actions: notificationData.actions,
        requireInteraction: notificationData.requireInteraction
      };

      await notifications.send(options);

      // Add to history
      const historyItem: NotificationHistoryItem = {
        ...notificationData,
        read: false,
        clicked: false,
        dismissed: false
      };
      
      setNotificationHistory(prev => [historyItem, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Track test notification
      await analytics.track({
        name: 'test_notification_sent',
        properties: {
          category: testNotification.category,
          title: testNotification.title
        }
      });

      logger.info('Test notification sent successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
      
      onError?.({
        code: 'NOTIFICATION_SEND_FAILED',
        message: errorMessage,
        timestamp: new Date()
      });

      logger.error('Failed to send test notification', error);
    }
  }, [permissionStatus, testNotification, notifications, analytics, onError]);

  // Load notification history
  const loadNotificationHistory = useCallback(async () => {
    try {
      const stored = localStorage.getItem('notification-history');
      if (stored) {
        const history = JSON.parse(stored).map((item: {
          id: string;
          title: string;
          body: string;
          category?: string;
          timestamp: string;
          read: boolean;
          clicked: boolean;
          dismissed: boolean;
        }) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setNotificationHistory(history);
        setUnreadCount(history.filter((item: NotificationHistoryItem) => !item.read).length);
      }
    } catch (error) {
      logger.error('Failed to load notification history', error);
    }
  }, []);

  // Save notification history
  const saveNotificationHistory = useCallback((history: NotificationHistoryItem[]) => {
    try {
      localStorage.setItem('notification-history', JSON.stringify(history));
    } catch (error) {
      logger.error('Failed to save notification history', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotificationHistory(prev => {
      const updated = prev.map(item => 
        item.id === notificationId ? { ...item, read: true } : item
      );
      saveNotificationHistory(updated);
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [saveNotificationHistory]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotificationHistory(prev => {
      const updated = prev.map(item => ({ ...item, read: true }));
      saveNotificationHistory(updated);
      return updated;
    });
    setUnreadCount(0);
  }, [saveNotificationHistory]);

  // Clear notification history
  const clearHistory = useCallback(() => {
    setNotificationHistory([]);
    setUnreadCount(0);
    localStorage.removeItem('notification-history');
  }, []);

  // Update category settings
  const updateCategory = useCallback((categoryId: string, updates: Partial<NotificationCategory>) => {
    setCategories(prev => {
      const updated = prev.map(cat => 
        cat.id === categoryId ? { ...cat, ...updates } : cat
      );
      
      // Save to localStorage
      try {
        localStorage.setItem('notification-categories', JSON.stringify(updated));
      } catch (error) {
        logger.error('Failed to save category settings', error);
      }
      
      return updated;
    });
  }, []);

  // Update quiet hours
  const updateQuietHours = useCallback((updates: Partial<typeof quietHours>) => {
    setQuietHours(prev => {
      const updated = { ...prev, ...updates };
      
      // Save to localStorage
      try {
        localStorage.setItem('notification-quiet-hours', JSON.stringify(updated));
      } catch (error) {
        logger.error('Failed to save quiet hours', error);
      }
      
      return updated;
    });
  }, []);

  // Check if currently in quiet hours
  const isQuietTime = useCallback(() => {
    if (!quietHours.enabled) return false;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, [quietHours]);

  // Get permission status icon
  const getPermissionIcon = useCallback((status: PermissionStatus) => {
    switch (status) {
      case 'granted':
        return (
          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'denied':
        return (
          <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'checking':
        return (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5V7a9.5 9.5 0 0119 0v10z" />
          </svg>
        );
    }
  }, []);

  // Get category icon
  const getCategoryIcon = useCallback((categoryId: string) => {
    const iconClass = "w-5 h-5";
    
    switch (categoryId) {
      case 'jackpot':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      case 'deposits':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'withdrawals':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
      case 'security':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'promotions':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5V7a9.5 9.5 0 0119 0v10z" />
          </svg>
        );
    }
  }, []);

  // Format timestamp for display
  const formatTimestamp = useCallback((timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  }, []);

  return (
    <div className={`enhanced-push-notifications ${className}`}>
      {/* Permission Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Push Notifications
          </h2>
          <div className="flex items-center space-x-2">
            {getPermissionIcon(permissionStatus)}
            <span className={`text-sm font-medium ${
              permissionStatus === 'granted' ? 'text-green-600' :
              permissionStatus === 'denied' ? 'text-red-600' :
              permissionStatus === 'checking' ? 'text-blue-600' :
              'text-gray-600'
            }`}>
              {permissionStatus === 'granted' ? 'Enabled' :
               permissionStatus === 'denied' ? 'Denied' :
               permissionStatus === 'checking' ? 'Checking...' :
               'Not Enabled'}
            </span>
          </div>
        </div>

        {/* Permission Actions */}
        {permissionStatus === 'default' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  Enable Push Notifications
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Get notified about jackpot wins, deposits, and important updates.
                </p>
              </div>
              <button
                onClick={requestPermission}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {isProcessing ? 'Requesting...' : 'Enable'}
              </button>
            </div>
          </div>
        )}

        {permissionStatus === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Notifications Blocked
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Please enable notifications in your browser settings to receive updates.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Info */}
        {permissionStatus === 'granted' && subscriptionInfo.endpoint && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  Notifications Active
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  You&apos;ll receive notifications based on your preferences below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount} unread
              </span>
            )}
            {isQuietTime() && (
              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                Quiet hours
              </span>
            )}
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <span>Settings</span>
            <svg className={`ml-1 h-4 w-4 transform transition-transform ${
              showSettings ? 'rotate-180' : ''
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Notification Settings
          </h3>

          {/* Categories */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Notification Categories
            </h4>
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(category.id)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {category.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={category.enabled}
                        onChange={(e) => updateCategory(category.id, { enabled: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-xs text-gray-600">Enabled</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiet Hours */}
          {enableQuietHours && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Quiet Hours
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-700">Enable quiet hours</span>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={quietHours.enabled}
                      onChange={(e) => updateQuietHours({ enabled: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </label>
                </div>
                {quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Start time</label>
                      <input
                        type="time"
                        value={quietHours.start}
                        onChange={(e) => updateQuietHours({ start: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">End time</label>
                      <input
                        type="time"
                        value={quietHours.end}
                        onChange={(e) => updateQuietHours({ end: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Notification */}
          {permissionStatus === 'granted' && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Test Notification
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Title</label>
                    <input
                      type="text"
                      value={testNotification.title}
                      onChange={(e) => setTestNotification(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Message</label>
                    <textarea
                      value={testNotification.body}
                      onChange={(e) => setTestNotification(prev => ({ ...prev, body: e.target.value }))}
                      rows={2}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Category</label>
                    <select
                      value={testNotification.category}
                      onChange={(e) => setTestNotification(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={sendTestNotification}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg"
                >
                  Send Test Notification
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notification History */}
      {showHistory && notificationHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Notification History
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={clearHistory}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear history
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {notificationHistory.slice(0, 20).map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  notification.read
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {notification.category && getCategoryIcon(notification.category)}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        notification.read ? 'text-gray-900' : 'text-blue-900'
                      }`}>
                        {notification.title}
                      </p>
                      <p className={`text-sm mt-1 ${
                        notification.read ? 'text-gray-600' : 'text-blue-700'
                      }`}>
                        {notification.body}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatTimestamp(notification.timestamp)}
                        {notification.category && (
                          <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded-full">
                            {categories.find(c => c.id === notification.category)?.name || notification.category}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedPushNotifications;