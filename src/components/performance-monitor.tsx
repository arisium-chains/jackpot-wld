/**
 * Performance Monitor Component
 * Real-time performance monitoring and optimization for MiniApp
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  HardDrive, 
  Wifi, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Monitor,
  Smartphone
} from 'lucide-react';

import { PerformanceOptimizer } from '../lib/performance-optimizer';
import { 
  getOptimizationConfig, 
  performanceThresholds,
  performanceProfiles,
  detectDeviceCapabilities
} from '../config/performance';
import type { PerformanceMetrics, OptimizationResult } from '../lib/performance-optimizer';

interface PerformanceMonitorProps {
  autoOptimize?: boolean;
  showAdvanced?: boolean;
  onOptimizationComplete?: (result: OptimizationResult) => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  autoOptimize = true,
  showAdvanced = false,
  onOptimizationComplete
}) => {
  const [optimizer, setOptimizer] = useState<PerformanceOptimizer | null>(null);
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [config, setConfig] = useState(getOptimizationConfig());
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [alerts, setAlerts] = useState<Array<{ type: 'warning' | 'critical'; message: string }>>([]);

  // Initialize performance optimizer
  useEffect(() => {
    const perfOptimizer = new PerformanceOptimizer(config.performance);
    setOptimizer(perfOptimizer);

    return () => {
      perfOptimizer.destroy();
    };
  }, [config.performance]);



  const checkPerformanceAlerts = useCallback((currentMetrics: Partial<PerformanceMetrics>) => {
    const newAlerts: Array<{ type: 'warning' | 'critical'; message: string }> = [];

    if (currentMetrics.memoryUsage) {
      if (currentMetrics.memoryUsage > config.performance.memoryThreshold) {
        newAlerts.push({
          type: 'critical',
          message: `Memory usage critical: ${currentMetrics.memoryUsage.toFixed(1)}MB`
        });
      } else if (currentMetrics.memoryUsage > config.performance.memoryThreshold * 0.8) {
        newAlerts.push({
          type: 'warning',
          message: `Memory usage high: ${currentMetrics.memoryUsage.toFixed(1)}MB`
        });
      }
    }

    if (currentMetrics.fps) {
      if (currentMetrics.fps < performanceThresholds.critical.fps) {
        newAlerts.push({
          type: 'critical',
          message: `FPS critical: ${currentMetrics.fps}`
        });
      } else if (currentMetrics.fps < performanceThresholds.warning.fps) {
        newAlerts.push({
          type: 'warning',
          message: `FPS low: ${currentMetrics.fps}`
        });
      }
    }

    setAlerts(newAlerts);
  }, [config.performance]);

  const shouldAutoOptimize = useCallback((currentMetrics: Partial<PerformanceMetrics>) => {
    return (
      (currentMetrics.memoryUsage && currentMetrics.memoryUsage > config.performance.memoryThreshold) ||
      (currentMetrics.fps && currentMetrics.fps < config.performance.fpsThreshold) ||
      (currentMetrics.renderTime && currentMetrics.renderTime > 50)
    );
  }, [config.performance]);

  const handleOptimize = async () => {
    if (!optimizer || isOptimizing) return;

    setIsOptimizing(true);
    try {
      const result = await optimizer.optimize();
      setOptimizationResult(result);
      onOptimizationComplete?.(result);
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Monitor performance metrics
  useEffect(() => {
    if (!optimizer || !isMonitoring) return;

    const interval = setInterval(() => {
      const currentMetrics = optimizer.getMetrics();
      setMetrics(currentMetrics);
      checkPerformanceAlerts(currentMetrics);

      // Auto-optimize if enabled and performance is poor
      if (autoOptimize && shouldAutoOptimize(currentMetrics)) {
        handleOptimize();
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [optimizer, isMonitoring, autoOptimize, checkPerformanceAlerts, handleOptimize, shouldAutoOptimize]);

  const getMemoryPercentage = () => {
    if (!metrics.memoryUsage) return 0;
    return Math.min((metrics.memoryUsage / config.performance.memoryThreshold) * 100, 100);
  };

  const getFPSPercentage = () => {
    if (!metrics.fps) return 0;
    return Math.min((metrics.fps / 60) * 100, 100);
  };

  const capabilities = detectDeviceCapabilities();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitor</h2>
          <p className="text-muted-foreground">
            Real-time performance monitoring and optimization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={capabilities.isLowEnd ? 'destructive' : 'default'}>
            {capabilities.isLowEnd ? <Smartphone className="w-3 h-3 mr-1" /> : <Monitor className="w-3 h-3 mr-1" />}
            {config.profile}
          </Badge>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isMonitoring}
              onChange={(e) => setIsMonitoring(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Monitor</span>
          </label>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {/* Overview Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* FPS Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">FPS</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.fps || 0}</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${getFPSPercentage()}%` }}
            />
          </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: {config.performance.fpsThreshold}+ FPS
                </p>
              </CardContent>
            </Card>

            {/* Memory Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.memoryUsage?.toFixed(1) || 0}MB
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${getMemoryPercentage()}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Limit: {config.performance.memoryThreshold}MB
                </p>
              </CardContent>
            </Card>

            {/* Network Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network</CardTitle>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.networkLatency ? `${metrics.networkLatency.toFixed(0)}ms` : 'N/A'}
                </div>
                <Badge variant="outline" className="mt-2">
                  {capabilities.connectionType.toUpperCase()}
                </Badge>
              </CardContent>
            </Card>

            {/* Bundle Size Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bundle</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.bundleSize || 0}KB
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(((metrics.bundleSize || 0) / config.performance.maxBundleSize) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Limit: {config.performance.maxBundleSize}KB
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Device Info */}
          <Card>
            <CardHeader>
              <CardTitle>Device Information</CardTitle>
              <CardDescription>Current device capabilities and configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-sm font-medium">Memory</span>
                  <p className="text-2xl font-bold">{capabilities.memory}GB</p>
                </div>
                <div>
                  <span className="text-sm font-medium">CPU Cores</span>
                  <p className="text-2xl font-bold">{capabilities.cores}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Connection</span>
                  <p className="text-2xl font-bold">{capabilities.connectionType.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Device Type</span>
                  <p className="text-2xl font-bold">{capabilities.isMobile ? 'Mobile' : 'Desktop'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Optimization Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Optimization</CardTitle>
              <CardDescription>Optimize app performance for current device</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={handleOptimize} 
                  disabled={isOptimizing}
                  className="flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>{isOptimizing ? 'Optimizing...' : 'Optimize Now'}</span>
                </Button>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoOptimize}
                    onChange={() => {}}
                    className="rounded"
                  />
                  <span className="text-sm">Auto-optimize</span>
                </label>
              </div>

              {optimizationResult && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    {optimizationResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium">
                      {optimizationResult.success ? 'Optimization Successful' : 'Optimization Failed'}
                    </span>
                  </div>

                  {optimizationResult.improvements.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Improvements Applied:</span>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        {optimizationResult.improvements.map((improvement, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {optimizationResult.recommendations.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Recommendations:</span>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        {optimizationResult.recommendations.map((recommendation, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Fine-tune performance optimization settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(performanceProfiles).map(([key, profile]) => (
                      <Card key={key} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{profile.name}</h4>
                            <p className="text-sm text-muted-foreground">{profile.description}</p>
                          </div>
                          <Button 
                            variant={config.profile === profile.name ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setConfig(prev => ({ ...prev, performance: profile.config, profile: profile.name }));
                              optimizer?.updateConfig(profile.config);
                            }}
                          >
                            {config.profile === profile.name ? 'Active' : 'Select'}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceMonitor;