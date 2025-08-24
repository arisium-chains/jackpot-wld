'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useEnhancedMiniKit } from '../providers/enhanced-minikit-provider';
import { SDKError } from '../types/miniapp-sdk';
import { logger } from '../lib/logger';

// Component interfaces
interface EnhancedUIOptimizationsProps {
  onError?: (error: SDKError) => void;
  className?: string;
  enableVirtualization?: boolean;
  enableLazyLoading?: boolean;
  enableImageOptimization?: boolean;
  enableGestureOptimization?: boolean;
  enableAccessibility?: boolean;
  enablePerformanceMonitoring?: boolean;
  maxConcurrentImages?: number;
  virtualScrollThreshold?: number;
}

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
  interactionDelay: number;
  bundleSize: number;
  cacheHitRate: number;
}

interface OptimizationSettings {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  darkMode: boolean;
  compactMode: boolean;
  touchOptimized: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
}

interface GestureConfig {
  swipeThreshold: number;
  tapDelay: number;
  longPressDelay: number;
  pinchSensitivity: number;
  enableHapticFeedback: boolean;
}

interface ImageOptimization {
  enableWebP: boolean;
  enableAVIF: boolean;
  enableLazyLoading: boolean;
  enableProgressiveLoading: boolean;
  compressionQuality: number;
  maxWidth: number;
  maxHeight: number;
}

interface VirtualScrollItem {
  id: string;
  height: number;
  content: React.ReactNode;
  isVisible: boolean;
}

export function EnhancedUIOptimizations({
  onError,
  className = '',
  enableVirtualization = true,
  enableLazyLoading = true,
  enableImageOptimization = true,
  enableGestureOptimization = true,
  enableAccessibility = true,
  enablePerformanceMonitoring = true,
  virtualScrollThreshold = 100
}: EnhancedUIOptimizationsProps) {
  const { analytics } = useEnhancedMiniKit();

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const frameIdRef = useRef<number>(0);

  // Component state
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0,
    interactionDelay: 0,
    bundleSize: 0,
    cacheHitRate: 0
  });
  
  const [optimizationSettings, setOptimizationSettings] = useState<OptimizationSettings>({
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    darkMode: false,
    compactMode: false,
    touchOptimized: true,
    keyboardNavigation: true,
    screenReader: false
  });
  
  const [gestureConfig] = useState<GestureConfig>({
    swipeThreshold: 50,
    tapDelay: 300,
    longPressDelay: 500,
    pinchSensitivity: 0.1,
    enableHapticFeedback: true
  });
  
  const [imageOptimization] = useState<ImageOptimization>({
    enableWebP: true,
    enableAVIF: false,
    enableLazyLoading: true,
    enableProgressiveLoading: true,
    compressionQuality: 80,
    maxWidth: 1200,
    maxHeight: 800
  });
  
  const [virtualScrollItems, setVirtualScrollItems] = useState<VirtualScrollItem[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    memory: 0,
    cores: 0,
    connection: 'unknown',
    pixelRatio: 1,
    screenSize: { width: 0, height: 0 },
    touchSupport: false,
    webGLSupport: false
  });

  // Helper functions (defined before they are used)
  const detectDeviceCapabilities = useCallback(() => {
    const capabilities = {
      memory: (navigator as { deviceMemory?: number }).deviceMemory || 4,
      cores: navigator.hardwareConcurrency || 4,
      connection: (navigator as { connection?: { effectiveType?: string } }).connection?.effectiveType || 'unknown',
      pixelRatio: window.devicePixelRatio || 1,
      screenSize: {
        width: window.screen.width,
        height: window.screen.height
      },
      touchSupport: 'ontouchstart' in window,
      webGLSupport: !!document.createElement('canvas').getContext('webgl')
    };
    
    setDeviceCapabilities(capabilities);
    return capabilities;
  }, []);

  const setupPerformanceMonitoring = useCallback(() => {
    if (!enablePerformanceMonitoring) return;

    let lastTime = performance.now();
    let frameCount = 0;
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setPerformanceMetrics(prev => ({ ...prev, fps: frameCount }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      frameIdRef.current = requestAnimationFrame(measureFPS);
    };
    
    measureFPS();
  }, [enablePerformanceMonitoring]);

  const setupVirtualScrolling = useCallback(() => {
    const items: VirtualScrollItem[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `item-${i}`,
      height: 60,
      content: (
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium">Virtual Item {i + 1}</h3>
          <p className="text-sm text-gray-600">This is a virtualized list item</p>
        </div>
      ),
      isVisible: i < virtualScrollThreshold
    }));
    
    setVirtualScrollItems(items);
  }, [virtualScrollThreshold]);

  const setupLazyLoading = useCallback(() => {
    if (!intersectionObserverRef.current) {
      intersectionObserverRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const src = img.dataset.src;
              
              if (src) {
                img.src = src;
                img.removeAttribute('data-src');
                intersectionObserverRef.current?.unobserve(img);
              }
            }
          });
        },
        { rootMargin: '50px' }
      );
    }
  }, []);

  const setupGestureOptimization = useCallback(() => {
    if (!containerRef.current) return;

    const handleTouchStart = () => {
      if (gestureConfig.enableHapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    };
    
    containerRef.current.addEventListener('touchstart', handleTouchStart, { passive: true });
  }, [gestureConfig]);

  const setupImageOptimization = useCallback(() => {
    const images = document.querySelectorAll('img[data-optimize]');
    images.forEach((img) => {
      const htmlImg = img as HTMLImageElement;
      if (htmlImg.src) {
        // Basic optimization logic
        htmlImg.loading = 'lazy';
      }
    });
  }, []);

  const setupAccessibilityFeatures = useCallback(() => {
    if (!enableAccessibility) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setOptimizationSettings(prev => ({ ...prev, keyboardNavigation: true }));
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableAccessibility]);

  // Main initialization function
  const initializeOptimizations = useCallback(async () => {
    try {
      setIsOptimizing(true);
      const results: string[] = [];

      // Detect device capabilities first
      detectDeviceCapabilities();
      results.push('Device capabilities detected');

      // Setup optimizations based on enabled features
      if (enableVirtualization) {
        setupVirtualScrolling();
        results.push('Virtual scrolling enabled');
      }

      if (enableLazyLoading) {
        setupLazyLoading();
        results.push('Lazy loading enabled');
      }

      if (enableGestureOptimization) {
        setupGestureOptimization();
        results.push('Gesture optimization enabled');
      }

      if (enableImageOptimization) {
        setupImageOptimization();
        results.push('Image optimization enabled');
      }

      if (enableAccessibility) {
        setupAccessibilityFeatures();
        results.push('Accessibility features enabled');
      }

      if (enablePerformanceMonitoring) {
        setupPerformanceMonitoring();
        results.push('Performance monitoring enabled');
      }

      setOptimizationResults(results);
      
      analytics.track({
        name: 'ui_optimizations_initialized',
        properties: {
          enabledFeatures: results.length,
          deviceCapabilities
        }
      });
    } catch (error) {
      logger.error('Failed to initialize UI optimizations:', { error: error instanceof Error ? error.message : String(error) });
      onError?.({
        code: 'UNKNOWN_ERROR',
        message: 'Failed to initialize UI optimizations',
        details: error,
        timestamp: new Date()
      });
    } finally {
      setIsOptimizing(false);
    }
  }, [
    detectDeviceCapabilities,
    setupVirtualScrolling,
    setupLazyLoading,
    setupGestureOptimization,
    setupImageOptimization,
    setupAccessibilityFeatures,
    setupPerformanceMonitoring,
    enableVirtualization,
    enableLazyLoading,
    enableGestureOptimization,
    enableImageOptimization,
    enableAccessibility,
    enablePerformanceMonitoring,
    deviceCapabilities,
    analytics,
    onError
  ]);

  // Initialize on mount
  useEffect(() => {
    initializeOptimizations();
  }, [initializeOptimizations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect();
      }
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, []);

  // Memoized virtual scroll items for performance
  const visibleItems = useMemo(() => {
    return virtualScrollItems.filter(item => item.isVisible);
  }, [virtualScrollItems]);

  return (
    <div ref={containerRef} className={`enhanced-ui-optimizations ${className}`}>
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">UI Optimizations</h2>
        
        {isOptimizing && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800">Initializing optimizations...</p>
          </div>
        )}
        
        {optimizationResults.length > 0 && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
            <h3 className="font-medium text-green-800 mb-2">Enabled Optimizations:</h3>
            <ul className="text-sm text-green-700">
              {optimizationResults.map((result, index) => (
                <li key={index}>• {result}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-gray-50 rounded">
            <h4 className="font-medium mb-2">Performance</h4>
            <p className="text-sm">FPS: {performanceMetrics.fps}</p>
            <p className="text-sm">Memory: {performanceMetrics.memoryUsage.toFixed(1)}MB</p>
          </div>
          
          <div className="p-3 bg-gray-50 rounded">
            <h4 className="font-medium mb-2">Device</h4>
            <p className="text-sm">Cores: {deviceCapabilities.cores}</p>
            <p className="text-sm">Memory: {deviceCapabilities.memory}GB</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>
        
        {showAdvanced && (
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-medium mb-3">Advanced Configuration</h3>
            <div className="space-y-2 text-sm">
              <p>Reduced Motion: {optimizationSettings.reducedMotion ? 'Yes' : 'No'}</p>
              <p>High Contrast: {optimizationSettings.highContrast ? 'Yes' : 'No'}</p>
              <p>Touch Optimized: {optimizationSettings.touchOptimized ? 'Yes' : 'No'}</p>
              <p>Screen Reader: {optimizationSettings.screenReader ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}
        
        {enableVirtualization && visibleItems.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Virtual Scroll Demo</h3>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded">
              {visibleItems.slice(0, 10).map(item => (
                <div key={item.id}>{item.content}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhancedUIOptimizations;