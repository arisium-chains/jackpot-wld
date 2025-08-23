/**
 * SDK Integration Component
 * Comprehensive integration of all enhanced MiniApp SDK features
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SDKError } from '../types/miniapp-sdk';
import { 
  Wallet, 
  CreditCard, 
  Shield, 
  Share2, 
  Fingerprint, 
  Bell, 
  BarChart3, 
  Wifi, 
  Settings,
  CheckCircle,
  AlertTriangle,
  Activity
} from 'lucide-react';

// Import all enhanced components
import EnhancedWalletConnect from './enhanced-wallet-connect';
import EnhancedPayment from './enhanced-payment';
import EnhancedWorldID from './enhanced-world-id';
import EnhancedSharing from './enhanced-sharing';
import EnhancedBiometricAuth from './enhanced-biometric-auth';
import EnhancedPushNotifications from './enhanced-push-notifications';
import EnhancedAnalytics from './enhanced-analytics';
import EnhancedOfflineSupport from './enhanced-offline-support';
import EnhancedUIOptimizations from './enhanced-ui-optimizations';
import PerformanceMonitor from './performance-monitor';

// Import providers and utilities
import { useEnhancedMiniKit } from '../providers/enhanced-minikit-provider';
import { PerformanceOptimizer } from '../lib/performance-optimizer';
import { getOptimizationConfig } from '../config/performance';

interface SDKFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType;
  status: 'available' | 'unavailable' | 'error';
  priority: 'high' | 'medium' | 'low';
}

interface SDKIntegrationProps {
  showAdvanced?: boolean;
  enablePerformanceMonitoring?: boolean;
  autoOptimize?: boolean;
  onError?: (error: SDKError) => void;
}

const SDKIntegration: React.FC<SDKIntegrationProps> = ({
  showAdvanced = false,
  enablePerformanceMonitoring = true,
  autoOptimize = true
}) => {
  const { isReady, error: sdkError } = useEnhancedMiniKit();
  const [activeFeature, setActiveFeature] = useState<string>('overview');
  const [featureStatuses, setFeatureStatuses] = useState<Record<string, 'available' | 'unavailable' | 'error'>>({});
  const [isOptimized, setIsOptimized] = useState(false);

  // Define SDK features
  const features: SDKFeature[] = [
    {
      id: 'wallet',
      name: 'Wallet Integration',
      description: 'Connect and manage crypto wallets',
      icon: <Wallet className="w-5 h-5" />,
      component: EnhancedWalletConnect,
      status: featureStatuses.wallet || 'available',
      priority: 'high'
    },
    {
      id: 'payment',
      name: 'Payment System',
      description: 'Process crypto payments and transactions',
      icon: <CreditCard className="w-5 h-5" />,
      component: EnhancedPayment,
      status: featureStatuses.payment || 'available',
      priority: 'high'
    },
    {
      id: 'worldid',
      name: 'World ID Verification',
      description: 'Verify user identity with World ID',
      icon: <Shield className="w-5 h-5" />,
      component: EnhancedWorldID,
      status: featureStatuses.worldid || 'available',
      priority: 'high'
    },
    {
      id: 'sharing',
      name: 'Social Sharing',
      description: 'Share content across platforms',
      icon: <Share2 className="w-5 h-5" />,
      component: EnhancedSharing,
      status: featureStatuses.sharing || 'available',
      priority: 'medium'
    },
    {
      id: 'biometric',
      name: 'Biometric Auth',
      description: 'Secure biometric authentication',
      icon: <Fingerprint className="w-5 h-5" />,
      component: EnhancedBiometricAuth,
      status: featureStatuses.biometric || 'available',
      priority: 'medium'
    },
    {
      id: 'notifications',
      name: 'Push Notifications',
      description: 'Send and manage notifications',
      icon: <Bell className="w-5 h-5" />,
      component: EnhancedPushNotifications,
      status: featureStatuses.notifications || 'available',
      priority: 'medium'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'Track user behavior and events',
      icon: <BarChart3 className="w-5 h-5" />,
      component: EnhancedAnalytics,
      status: featureStatuses.analytics || 'available',
      priority: 'low'
    },
    {
      id: 'offline',
      name: 'Offline Support',
      description: 'Offline capabilities and sync',
      icon: <Wifi className="w-5 h-5" />,
      component: EnhancedOfflineSupport,
      status: featureStatuses.offline || 'available',
      priority: 'low'
    },
    {
      id: 'ui-optimizations',
      name: 'UI Optimizations',
      description: 'Performance and accessibility optimizations',
      icon: <Settings className="w-5 h-5" />,
      component: EnhancedUIOptimizations,
      status: featureStatuses.uiOptimizations || 'available',
      priority: 'low'
    }
  ];

  // Initialize performance optimizer
  useEffect(() => {
    if (enablePerformanceMonitoring) {
      const config = getOptimizationConfig();
      const optimizer = new PerformanceOptimizer(config.performance);

      // Auto-optimize if enabled
      if (autoOptimize) {
        optimizer.optimize().then((result) => {
          setIsOptimized(result.success);
        }).catch(console.error);
      }

      return () => {
        optimizer.destroy();
      };
    }
  }, [enablePerformanceMonitoring, autoOptimize]);

  // Check feature availability
  useEffect(() => {
    const checkFeatureAvailability = async () => {
      const statuses: Record<string, 'available' | 'unavailable' | 'error'> = {};

      for (const feature of features) {
        try {
          // Basic availability check based on SDK initialization
          if (!isReady) {
            statuses[feature.id] = 'unavailable';
            continue;
          }

          // Feature-specific checks
          switch (feature.id) {
            case 'wallet':
              statuses[feature.id] = 'available';
              break;
            case 'payment':
              statuses[feature.id] = 'available';
              break;
            case 'worldid':
              statuses[feature.id] = 'available';
              break;
            case 'biometric':
              // Check if biometric authentication is supported
              statuses[feature.id] = navigator.credentials ? 'available' : 'unavailable';
              break;
            case 'notifications':
              // Check if notifications are supported
              statuses[feature.id] = 'Notification' in window ? 'available' : 'unavailable';
              break;
            default:
              statuses[feature.id] = 'available';
          }
        } catch {
          statuses[feature.id] = 'error';
        }
      }

      setFeatureStatuses(statuses);
    };

    checkFeatureAvailability();
  }, [isReady, features]);

  const getStatusBadge = (status: 'available' | 'unavailable' | 'error') => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-100 text-green-800">Available</Badge>;
      case 'unavailable':
        return <Badge variant="secondary">Unavailable</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  };

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    return <Badge variant="outline" className={colors[priority]}>{priority.toUpperCase()}</Badge>;
  };

  const renderActiveFeature = () => {
    if (activeFeature === 'overview') {
      return (
        <div className="space-y-6">
          {/* SDK Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>SDK Status</span>
              </CardTitle>
              <CardDescription>Current status of the MiniApp SDK integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">SDK Initialized</span>
                  <div className="flex items-center space-x-2">
                    {isReady ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                    <span>{isReady ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                
                {enablePerformanceMonitoring && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Performance Optimized</span>
                    <div className="flex items-center space-x-2">
                      {isOptimized ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      )}
                      <span>{isOptimized ? 'Yes' : 'Pending'}</span>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="font-medium">Available Features</span>
                  <span className="font-bold">
                    {Object.values(featureStatuses).filter(status => status === 'available').length} / {features.length}
                  </span>
                </div>
              </div>
              
              {sdkError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>SDK Error: {typeof sdkError === 'string' ? sdkError : sdkError?.message || 'Unknown error'}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <Card 
                key={feature.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveFeature(feature.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {feature.icon}
                      <CardTitle className="text-lg">{feature.name}</CardTitle>
                    </div>
                    {getStatusBadge(feature.status)}
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    {getPriorityBadge(feature.priority)}
                    <Button variant="outline" size="sm">
                      Open
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    if (activeFeature === 'performance' && enablePerformanceMonitoring) {
      return (
        <PerformanceMonitor 
          autoOptimize={autoOptimize}
          showAdvanced={showAdvanced}
          onOptimizationComplete={(result) => setIsOptimized(result.success)}
        />
      );
    }

    const feature = features.find(f => f.id === activeFeature);
    if (feature && feature.status === 'available') {
      const FeatureComponent = feature.component;
      return <FeatureComponent />;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Feature Unavailable</CardTitle>
          <CardDescription>This feature is currently unavailable or not supported.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setActiveFeature('overview')} variant="outline">
            Back to Overview
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MiniApp SDK Integration</h1>
          <p className="text-muted-foreground">
            Comprehensive integration of all enhanced MiniApp SDK features
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isReady ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              SDK Ready
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertTriangle className="w-3 h-3 mr-1" />
              SDK Error
            </Badge>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeFeature === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveFeature('overview')}
          className="flex items-center space-x-2"
        >
          <Activity className="w-4 h-4" />
          <span>Overview</span>
        </Button>
        
        {enablePerformanceMonitoring && (
          <Button
            variant={activeFeature === 'performance' ? 'default' : 'outline'}
            onClick={() => setActiveFeature('performance')}
            className="flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Performance</span>
          </Button>
        )}
        
        {features.map((feature) => (
          <Button
            key={feature.id}
            variant={activeFeature === feature.id ? 'default' : 'outline'}
            onClick={() => setActiveFeature(feature.id)}
            disabled={feature.status !== 'available'}
            className="flex items-center space-x-2"
          >
            {feature.icon}
            <span>{feature.name}</span>
            {feature.status !== 'available' && (
              <AlertTriangle className="w-3 h-3 ml-1" />
            )}
          </Button>
        ))}
      </div>

      {/* Active Feature Content */}
      <div className="min-h-[600px]">
        {renderActiveFeature()}
      </div>
    </div>
  );
};

export default SDKIntegration;