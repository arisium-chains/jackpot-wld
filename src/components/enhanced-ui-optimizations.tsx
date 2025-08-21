/**
 * Enhanced UI Optimizations Component
 * MiniApp-specific UI optimizations for better performance and UX
 */

'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useEnhancedMiniKit, useEnhancedAnalytics } from '../providers/enhanced-minikit-provider';
import { SDKError } from '../types/miniapp-sdk';
import { logger } from '../lib/logger';

/**
 * Enhanced UI Optimizations Props
 */
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

/**
 * Performance metrics
 */
interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
  interactionDelay: number;
  bundleSize: number;
  cacheHitRate: number;
}

/**
 * UI optimization settings
 */
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

/**
 * Gesture configuration
 */
interface GestureConfig {
  swipeThreshold: number;
  tapDelay: number;
  longPressDelay: number;
  pinchSensitivity: number;
  enableHapticFeedback: boolean;
}

/**
 * Image optimization settings
 */
interface ImageOptimization {
  enableWebP: boolean;
  enableAVIF: boolean;
  enableLazyLoading: boolean;
  enableProgressiveLoading: boolean;
  compressionQuality: number;
  maxWidth: number;
  maxHeight: number;
}

/**
 * Virtual scroll item
 */
interface VirtualScrollItem {
  id: string;
  height: number;
  content: React.ReactNode;
  isVisible: boolean;
}

/**
 * Enhanced UI Optimizations Component
 */
export function EnhancedUIOptimizations({
  onError,
  className = '',
  enableVirtualization = true,
  enableLazyLoading = true,
  enableImageOptimization = true,
  enableGestureOptimization = true,
  enableAccessibility = true,
  enablePerformanceMonitoring = true,
  maxConcurrentImages = 5,
  virtualScrollThreshold = 100
}: EnhancedUIOptimizationsProps) {
  // Hooks
  const miniKit = useEnhancedMiniKit();
  const analytics = useEnhancedAnalytics();

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
  const [gestureConfig, setGestureConfig] = useState<GestureConfig>({
    swipeThreshold: 50,
    tapDelay: 300,
    longPressDelay: 500,
    pinchSensitivity: 0.1,
    enableHapticFeedback: true
  });
  const [imageOptimization, setImageOptimization] = useState<ImageOptimization>({
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

  // Initialize optimizations on mount
  useEffect(() => {
    initializeOptimizations();
    detectDeviceCapabilities();
    setupPerformanceMonitoring();
    setupAccessibilityFeatures();
    
    return () => {
      cleanup();
    };
  }, []);

  // Apply optimizations when settings change
  useEffect(() => {
    applyOptimizations();
  }, [optimizationSettings, gestureConfig, imageOptimization]);

  // Initialize optimizations
  const initializeOptimizations = useCallback(async () => {
    try {
      setIsOptimizing(true);
      const results: string[] = [];

      // Detect user preferences
      if (window.matchMedia) {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const highContrast = window.matchMedia('(prefers-contrast: high)').matches;
        const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        setOptimizationSettings(prev => ({
          ...prev,
          reducedMotion,
          highContrast,
          darkMode
        }));
        
        results.push('User preferences detected');
      }

      // Setup virtual scrolling if enabled
      if (enableVirtualization) {
        setupVirtualScrolling();
        results.push('Virtual scrolling enabled');
      }

      // Setup lazy loading if enabled
      if (enableLazyLoading) {
        setupLazyLoading();
        results.push('Lazy loading enabled');
      }

      // Setup gesture optimization if enabled
      if (enableGestureOptimization) {
        setupGestureOptimization();
        results.push('Gesture optimization enabled');
      }

      // Setup image optimization if enabled
      if (enableImageOptimization) {
        setupImageOptimization();
        results.push('Image optimization enabled');
      }

      setOptimizationResults(results);
      
      analytics.track({
        name: 'ui_optimizations_initialized',
        properties: {
          optimizations: results,
          device_capabilities: deviceCapabilities
        }
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize optimizations';
      
      onError?.({
        code: 'OPTIMIZATION_INIT_FAILED',
        message: errorMessage,
        timestamp: new Date()
      });
      
      logger.error('Failed to initialize optimizations', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [enableVirtualization, enableLazyLoading, enableGestureOptimization, enableImageOptimization, deviceCapabilities, analytics, onError]);

  // Detect device capabilities
  const detectDeviceCapabilities = useCallback(() => {
    const capabilities = {
      memory: (navigator as { deviceMemory?: number }).deviceMemory || 0,
      cores: navigator.hardwareConcurrency || 0,
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
    
    // Adjust settings based on capabilities
    if (capabilities.memory < 4) {
      setOptimizationSettings(prev => ({ ...prev, compactMode: true }));
    }
    
    if (capabilities.connection === 'slow-2g' || capabilities.connection === '2g') {
      setImageOptimization(prev => ({ ...prev, compressionQuality: 60 }));
    }
  }, []);

  // Setup performance monitoring
  const setupPerformanceMonitoring = useCallback(() => {
    if (!enablePerformanceMonitoring) return;

    // FPS monitoring
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

    // Memory monitoring
    if ('memory' in performance) {
      const updateMemory = () => {
        const memory = (performance as { memory?: { usedJSHeapSize: number } }).memory;
        if (memory) {
          setPerformanceMetrics(prev => ({
            ...prev,
            memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
          }));
        }
      };
      
      setInterval(updateMemory, 5000);
    }

    // Performance observer
    if ('PerformanceObserver' in window) {
      performanceObserverRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            setPerformanceMetrics(prev => ({
              ...prev,
              loadTime: navEntry.loadEventEnd - navEntry.loadEventStart
            }));
          }
          
          if (entry.entryType === 'measure') {
            setPerformanceMetrics(prev => ({
              ...prev,
              renderTime: entry.duration
            }));
          }
        });
      });
      
      performanceObserverRef.current.observe({ entryTypes: ['navigation', 'measure'] });
    }
  }, [enablePerformanceMonitoring]);

  // Setup accessibility features
  const setupAccessibilityFeatures = useCallback(() => {
    if (!enableAccessibility) return;

    // Screen reader detection
    const detectScreenReader = () => {
      const isScreenReader = window.speechSynthesis && window.speechSynthesis.getVoices().length > 0;
      setOptimizationSettings(prev => ({ ...prev, screenReader: isScreenReader }));
    };
    
    detectScreenReader();
    
    // Keyboard navigation
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

  // Setup virtual scrolling
  const setupVirtualScrolling = useCallback(() => {
    // Generate sample items for demonstration
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

  // Setup lazy loading
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
        {
          rootMargin: '50px'
        }
      );
    }
  }, []);

  // Setup gesture optimization
  const setupGestureOptimization = useCallback(() => {
    if (!containerRef.current) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    
    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
      
      // Haptic feedback if supported
      if (gestureConfig.enableHapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    };
    
    const handleTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const deltaTime = Date.now() - touchStartTime;
      
      // Detect swipe
      if (Math.abs(deltaX) > gestureConfig.swipeThreshold || Math.abs(deltaY) > gestureConfig.swipeThreshold) {
        const direction = Math.abs(deltaX) > Math.abs(deltaY) 
          ? (deltaX > 0 ? 'right' : 'left')
          : (deltaY > 0 ? 'down' : 'up');
          
        analytics.track({
          name: 'gesture_swipe',
          properties: {
            direction,
            distance: Math.sqrt(deltaX * deltaX + deltaY * deltaY),
            duration: deltaTime
          }
        });
      }
      
      // Detect tap vs long press
      if (deltaTime < gestureConfig.tapDelay) {
        analytics.track({
          name: 'gesture_tap',
          properties: {
            x: touch.clientX,
            y: touch.clientY,
            duration: deltaTime
          }
        });
      } else if (deltaTime > gestureConfig.longPressDelay) {
        analytics.track({
          name: 'gesture_long_press',
          properties: {
            x: touch.clientX,
            y: touch.clientY,
            duration: deltaTime
          }
        });
      }
    };
    
    containerRef.current.addEventListener('touchstart', handleTouchStart, { passive: true });
    containerRef.current.addEventListener('touchend', handleTouchEnd, { passive: true });
  }, [gestureConfig, analytics]);

  // Setup image optimization
  const setupImageOptimization = useCallback(() => {
    // Create optimized image loader
    const loadOptimizedImage = (img: HTMLImageElement, src: string) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      const tempImg = new Image();
      tempImg.onload = () => {
        // Calculate optimal dimensions
        let { width, height } = tempImg;
        
        if (width > imageOptimization.maxWidth) {
          height = (height * imageOptimization.maxWidth) / width;
          width = imageOptimization.maxWidth;
        }
        
        if (height > imageOptimization.maxHeight) {
          width = (width * imageOptimization.maxHeight) / height;
          height = imageOptimization.maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(tempImg, 0, 0, width, height);
        
        // Convert to optimized format
        const quality = imageOptimization.compressionQuality / 100;
        const optimizedSrc = canvas.toDataURL('image/jpeg', quality);
        
        img.src = optimizedSrc;
      };
      
      tempImg.src = src;
    };
    
    // Apply to existing images
    const images = document.querySelectorAll('img[data-optimize]');
    images.forEach((img) => {
      const originalSrc = (img as HTMLImageElement).src;
      if (originalSrc) {
        loadOptimizedImage(img as HTMLImageElement, originalSrc);
      }
    });
  }, [imageOptimization]);

  // Apply optimizations
  const applyOptimizations = useCallback(() => {
    const root = document.documentElement;
    
    // Apply CSS custom properties for optimizations
    if (optimizationSettings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }
    
    if (optimizationSettings.highContrast) {
      root.style.setProperty('--contrast-multiplier', '1.5');
    } else {
      root.style.removeProperty('--contrast-multiplier');
    }
    
    if (optimizationSettings.largeText) {
      root.style.setProperty('--font-size-multiplier', '1.2');
    } else {
      root.style.removeProperty('--font-size-multiplier');
    }
    
    if (optimizationSettings.compactMode) {
      root.style.setProperty('--spacing-multiplier', '0.8');
    } else {
      root.style.removeProperty('--spacing-multiplier');
    }
    
    if (optimizationSettings.touchOptimized) {
      root.style.setProperty('--touch-target-size', '44px');
    } else {
      root.style.removeProperty('--touch-target-size');
    }
  }, [optimizationSettings]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (frameIdRef.current) {
      cancelAnimationFrame(frameIdRef.current);
    }
    
    if (performanceObserverRef.current) {
      performanceObserverRef.current.disconnect();
    }
    
    if (intersectionObserverRef.current) {
      intersectionObserverRef.current.disconnect();
    }
  }, []);

  // Format file size
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Get performance status
  const getPerformanceStatus = useCallback(() => {
    const { fps, memoryUsage } = performanceMetrics;
    
    if (fps < 30 || memoryUsage > 100) {
      return { status: 'poor', color: 'text-red-600', bg: 'bg-red-50' };
    } else if (fps < 50 || memoryUsage > 50) {
      return { status: 'fair', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    } else {
      return { status: 'good', color: 'text-green-600', bg: 'bg-green-50' };
    }
  }, [performanceMetrics]);

  // Visible virtual scroll items
  const visibleVirtualItems = useMemo(() => {
    return virtualScrollItems.filter(item => item.isVisible).slice(0, 20);
  }, [virtualScrollItems]);

  const performanceStatus = getPerformanceStatus();

  return (
    <div ref={containerRef} className={`enhanced-ui-optimizations ${className}`}>
      {/* Performance Dashboard */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            UI Optimizations
          </h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            performanceStatus.color
          } ${performanceStatus.bg}`}>
            Performance: {performanceStatus.status.toUpperCase()}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">FPS</div>
            <div className="text-lg font-semibold text-gray-900">
              {performanceMetrics.fps}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Memory</div>
            <div className="text-lg font-semibold text-gray-900">
              {performanceMetrics.memoryUsage.toFixed(1)} MB
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Load Time</div>
            <div className="text-lg font-semibold text-gray-900">
              {performanceMetrics.loadTime.toFixed(0)} ms
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Render Time</div>
            <div className="text-lg font-semibold text-gray-900">
              {performanceMetrics.renderTime.toFixed(1)} ms
            </div>
          </div>
        </div>

        {/* Device Capabilities */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Device Capabilities</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-sm">
              <span className="text-gray-600">Memory:</span>
              <span className="ml-2 font-medium">{deviceCapabilities.memory || 'Unknown'} GB</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Cores:</span>
              <span className="ml-2 font-medium">{deviceCapabilities.cores || 'Unknown'}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Connection:</span>
              <span className="ml-2 font-medium">{deviceCapabilities.connection}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Pixel Ratio:</span>
              <span className="ml-2 font-medium">{deviceCapabilities.pixelRatio}x</span>
            </div>
          </div>
        </div>

        {/* Optimization Results */}
        {optimizationResults.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Active Optimizations</h3>
            <div className="flex flex-wrap gap-2">
              {optimizationResults.map((result, index) => (
                <span key={index} className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  {result}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Accessibility Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Accessibility Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={optimizationSettings.reducedMotion}
                onChange={(e) => setOptimizationSettings(prev => ({ ...prev, reducedMotion: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Reduce motion and animations
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={optimizationSettings.highContrast}
                onChange={(e) => setOptimizationSettings(prev => ({ ...prev, highContrast: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                High contrast mode
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={optimizationSettings.largeText}
                onChange={(e) => setOptimizationSettings(prev => ({ ...prev, largeText: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Large text size
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={optimizationSettings.keyboardNavigation}
                onChange={(e) => setOptimizationSettings(prev => ({ ...prev, keyboardNavigation: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Keyboard navigation support
              </span>
            </label>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={optimizationSettings.compactMode}
                onChange={(e) => setOptimizationSettings(prev => ({ ...prev, compactMode: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Compact mode (less spacing)
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={optimizationSettings.touchOptimized}
                onChange={(e) => setOptimizationSettings(prev => ({ ...prev, touchOptimized: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Touch-optimized interface
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={optimizationSettings.screenReader}
                onChange={(e) => setOptimizationSettings(prev => ({ ...prev, screenReader: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Screen reader optimizations
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={optimizationSettings.darkMode}
                onChange={(e) => setOptimizationSettings(prev => ({ ...prev, darkMode: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Dark mode
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Virtual Scrolling Demo */}
      {enableVirtualization && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Virtual Scrolling Demo
          </h3>
          <div className="h-64 overflow-y-auto border border-gray-200 rounded">
            {visibleVirtualItems.map((item) => (
              <div key={item.id} style={{ height: item.height }}>
                {item.content}
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Showing {visibleVirtualItems.length} of {virtualScrollItems.length} items
          </div>
        </div>
      )}

      {/* Advanced Settings */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Advanced Optimizations
          </h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <span>Advanced Settings</span>
            <svg className={`ml-1 h-4 w-4 transform transition-transform ${
              showAdvanced ? 'rotate-180' : ''
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-6">
            {/* Gesture Configuration */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Gesture Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Swipe Threshold (px)</label>
                  <input
                    type="number"
                    value={gestureConfig.swipeThreshold}
                    onChange={(e) => setGestureConfig(prev => ({ ...prev, swipeThreshold: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Long Press Delay (ms)</label>
                  <input
                    type="number"
                    value={gestureConfig.longPressDelay}
                    onChange={(e) => setGestureConfig(prev => ({ ...prev, longPressDelay: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <label className="flex items-center mt-3">
                <input
                  type="checkbox"
                  checked={gestureConfig.enableHapticFeedback}
                  onChange={(e) => setGestureConfig(prev => ({ ...prev, enableHapticFeedback: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Enable haptic feedback
                </span>
              </label>
            </div>

            {/* Image Optimization */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Image Optimization</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Compression Quality (%)</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={imageOptimization.compressionQuality}
                    onChange={(e) => setImageOptimization(prev => ({ ...prev, compressionQuality: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {imageOptimization.compressionQuality}%
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max Width (px)</label>
                  <input
                    type="number"
                    value={imageOptimization.maxWidth}
                    onChange={(e) => setImageOptimization(prev => ({ ...prev, maxWidth: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max Height (px)</label>
                  <input
                    type="number"
                    value={imageOptimization.maxHeight}
                    onChange={(e) => setImageOptimization(prev => ({ ...prev, maxHeight: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={imageOptimization.enableWebP}
                    onChange={(e) => setImageOptimization(prev => ({ ...prev, enableWebP: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">WebP format</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={imageOptimization.enableProgressiveLoading}
                    onChange={(e) => setImageOptimization(prev => ({ ...prev, enableProgressiveLoading: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Progressive loading</span>
                </label>
              </div>
            </div>

            {/* Performance Actions */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Actions</h4>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={initializeOptimizations}
                  disabled={isOptimizing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  {isOptimizing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  Re-optimize
                </button>
                
                <button
                  onClick={() => {
                    if ('gc' in window) {
                      (window as { gc?: () => void }).gc?.();
                    }
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                >
                  Force Garbage Collection
                </button>
                
                <button
                  onClick={() => {
                    performance.mark('optimization-test-start');
                    setTimeout(() => {
                      performance.mark('optimization-test-end');
                      performance.measure('optimization-test', 'optimization-test-start', 'optimization-test-end');
                    }, 100);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  Run Performance Test
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhancedUIOptimizations;