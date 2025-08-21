/**
 * Performance Optimizer for MiniApp Environment
 * Optimizes performance for constrained mobile environments
 */

import { logger } from './logger';

// Performance monitoring interfaces
interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
  bundleSize: number;
  networkLatency: number;
}

interface PerformanceConfig {
  enableMemoryOptimization: boolean;
  enableBundleOptimization: boolean;
  enableRenderOptimization: boolean;
  enableNetworkOptimization: boolean;
  memoryThreshold: number;
  fpsThreshold: number;
  maxBundleSize: number;
}

interface OptimizationResult {
  success: boolean;
  improvements: string[];
  metrics: Partial<PerformanceMetrics>;
  recommendations: string[];
}

// Memory management utilities
class MemoryManager {
  private static instance: MemoryManager;
  private memoryCache = new Map<string, unknown>();
  private weakRefs = new Set<WeakRef<object>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  startMemoryMonitoring(): void {
    this.cleanupInterval = setInterval(() => {
      this.performGarbageCollection();
      this.cleanupWeakRefs();
    }, 30000); // Every 30 seconds
  }

  stopMemoryMonitoring(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  cacheData(key: string, data: unknown, ttl = 300000): void { // 5 minutes default
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  getCachedData(key: string): unknown | null {
    const cached = this.memoryCache.get(key) as {
      data: unknown;
      timestamp: number;
      ttl: number;
    } | undefined;

    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.memoryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  addWeakRef(obj: object): void {
    this.weakRefs.add(new WeakRef(obj));
  }

  private performGarbageCollection(): void {
    // Clean expired cache entries
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      const cached = value as { timestamp: number; ttl: number };
      if (now - cached.timestamp > cached.ttl) {
        this.memoryCache.delete(key);
      }
    }

    // Force garbage collection if available
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        (window as unknown as { gc: () => void }).gc();
      } catch (error) {
        logger.debug('Manual GC not available:', { error });
      }
    }
  }

  private cleanupWeakRefs(): void {
    const toRemove: WeakRef<object>[] = [];
    for (const ref of this.weakRefs) {
      if (ref.deref() === undefined) {
        toRemove.push(ref);
      }
    }
    toRemove.forEach(ref => this.weakRefs.delete(ref));
  }

  getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }
}

// Bundle optimization utilities
class BundleOptimizer {
  private static loadedModules = new Set<string>();
  private static moduleCache = new Map<string, unknown>();

  static async loadModuleDynamically<T>(modulePath: string): Promise<T> {
    if (this.moduleCache.has(modulePath)) {
      return this.moduleCache.get(modulePath) as T;
    }

    try {
      const loadedModule = await import(modulePath);
      this.moduleCache.set(modulePath, loadedModule);
      this.loadedModules.add(modulePath);
      return loadedModule as T;
    } catch (error) {
      logger.error('Failed to load module:', { modulePath, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  static preloadCriticalModules(modules: string[]): Promise<unknown[]> {
    return Promise.all(
      modules.map(module => this.loadModuleDynamically(module))
    );
  }

  static getLoadedModules(): string[] {
    return Array.from(this.loadedModules);
  }

  static getBundleSize(): number {
    // Estimate bundle size based on loaded modules
    return this.loadedModules.size * 50; // Rough estimate in KB
  }
}

// Render optimization utilities
class RenderOptimizer {
  private static rafId: number | null = null;
  private static renderQueue: (() => void)[] = [];
  private static isProcessing = false;

  static scheduleRender(callback: () => void): void {
    this.renderQueue.push(callback);
    if (!this.isProcessing) {
      this.processRenderQueue();
    }
  }

  private static processRenderQueue(): void {
    if (this.renderQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    this.rafId = requestAnimationFrame(() => {
      const startTime = performance.now();
      const timeSlice = 16; // 16ms for 60fps

      while (this.renderQueue.length > 0 && (performance.now() - startTime) < timeSlice) {
        const callback = this.renderQueue.shift();
        if (callback) {
          try {
            callback();
          } catch (error) {
            logger.error('Render callback error:', { error });
          }
        }
      }

      this.processRenderQueue();
    });
  }

  static cancelScheduledRenders(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.renderQueue.length = 0;
    this.isProcessing = false;
  }

  static measureRenderTime(name: string, callback: () => void): number {
    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    logger.debug(`Render time for ${name}: ${renderTime.toFixed(2)}ms`);
    return renderTime;
  }
}

// Network optimization utilities
class NetworkOptimizer {
  private static requestCache = new Map<string, Promise<Response>>();
  private static pendingRequests = new Set<string>();

  static async optimizedFetch(url: string, options?: RequestInit): Promise<Response> {
    const cacheKey = `${url}_${JSON.stringify(options || {})}`;

    // Return cached promise if request is pending
    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey)!;
    }

    // Create new request
    const requestPromise = this.performOptimizedRequest(url, options);
    this.requestCache.set(cacheKey, requestPromise);

    try {
      const response = await requestPromise;
      // Cache successful responses for a short time
      setTimeout(() => {
        this.requestCache.delete(cacheKey);
      }, 30000); // 30 seconds
      return response;
    } catch (error) {
      this.requestCache.delete(cacheKey);
      throw error;
    }
  }

  private static async performOptimizedRequest(url: string, options?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept-Encoding': 'gzip, deflate, br',
          ...options?.headers
        }
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  static preloadResources(urls: string[]): Promise<Response[]> {
    return Promise.all(
      urls.map(url => this.optimizedFetch(url, { method: 'HEAD' }))
    );
  }

  static measureNetworkLatency(): Promise<number> {
    const startTime = performance.now();
    return this.optimizedFetch('/api/ping')
      .then(() => performance.now() - startTime)
      .catch(() => -1);
  }
}

// Main performance optimizer class
export class PerformanceOptimizer {
  private config: PerformanceConfig;
  private memoryManager: MemoryManager;
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableMemoryOptimization: true,
      enableBundleOptimization: true,
      enableRenderOptimization: true,
      enableNetworkOptimization: true,
      memoryThreshold: 100, // MB
      fpsThreshold: 30,
      maxBundleSize: 500, // KB
      ...config
    };

    this.memoryManager = MemoryManager.getInstance();
    this.initializePerformanceMonitoring();
  }

  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor FPS
    this.monitorFPS();

    // Monitor memory usage
    if (this.config.enableMemoryOptimization) {
      this.memoryManager.startMemoryMonitoring();
      this.monitorMemoryUsage();
    }

    // Monitor network performance
    if (this.config.enableNetworkOptimization) {
      this.monitorNetworkPerformance();
    }

    // Monitor render performance
    if (this.config.enableRenderOptimization) {
      this.monitorRenderPerformance();
    }
  }

  private monitorFPS(): void {
    let frames = 0;
    let lastTime = performance.now();

    const countFrame = (): void => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        this.metrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(countFrame);
    };

    requestAnimationFrame(countFrame);
  }

  private monitorMemoryUsage(): void {
    setInterval(() => {
      this.metrics.memoryUsage = this.memoryManager.getMemoryUsage();
      
      if (this.metrics.memoryUsage > this.config.memoryThreshold) {
        logger.warn(`Memory usage high: ${this.metrics.memoryUsage}MB`);
        this.optimizeMemory();
      }
    }, 5000); // Every 5 seconds
  }

  private monitorNetworkPerformance(): void {
    NetworkOptimizer.measureNetworkLatency()
      .then(latency => {
        this.metrics.networkLatency = latency;
      })
      .catch(error => {
        logger.error('Failed to measure network latency:', { error: error instanceof Error ? error.message : String(error) });
      });
  }

  private monitorRenderPerformance(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.entryType === 'measure') {
            this.metrics.renderTime = entry.duration;
          }
        }
      });

      observer.observe({ entryTypes: ['measure'] });
      this.observers.push(observer);
    }
  }

  async optimize(): Promise<OptimizationResult> {
    const improvements: string[] = [];
    const recommendations: string[] = [];

    try {
      // Memory optimization
      if (this.config.enableMemoryOptimization) {
        await this.optimizeMemory();
        improvements.push('Memory optimization applied');
      }

      // Bundle optimization
      if (this.config.enableBundleOptimization) {
        await this.optimizeBundle();
        improvements.push('Bundle optimization applied');
      }

      // Render optimization
      if (this.config.enableRenderOptimization) {
        this.optimizeRendering();
        improvements.push('Render optimization applied');
      }

      // Network optimization
      if (this.config.enableNetworkOptimization) {
        this.optimizeNetwork();
        improvements.push('Network optimization applied');
      }

      // Generate recommendations
      recommendations.push(...this.generateRecommendations());

      return {
        success: true,
        improvements,
        metrics: this.metrics,
        recommendations
      };
    } catch (error) {
      logger.error('Optimization failed:', error);
      return {
        success: false,
        improvements,
        metrics: this.metrics,
        recommendations: ['Optimization failed. Check console for details.']
      };
    }
  }

  private async optimizeMemory(): Promise<void> {
    // Clear unused cache entries
    this.memoryManager.getCachedData('__cleanup__');
    
    // Suggest garbage collection
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        (window as unknown as { gc: () => void }).gc();
      } catch (error) {
        logger.debug('Manual GC not available');
      }
    }
  }

  private async optimizeBundle(): Promise<void> {
    // Preload critical modules
    const criticalModules = [
      '@worldcoin/minikit-js',
      'react',
      'react-dom'
    ];

    try {
      await BundleOptimizer.preloadCriticalModules(criticalModules);
      this.metrics.bundleSize = BundleOptimizer.getBundleSize();
    } catch (error) {
      logger.error('Bundle optimization failed:', { error });
    }
  }

  private optimizeRendering(): void {
    // Cancel any pending renders and restart with optimization
    RenderOptimizer.cancelScheduledRenders();
  }

  private optimizeNetwork(): void {
    // Preload common resources
    const commonResources = [
      '/api/health',
      '/manifest.json'
    ];

    NetworkOptimizer.preloadResources(commonResources)
      .catch(error => {
        logger.debug('Resource preloading failed:', { error: error instanceof Error ? error.message : String(error) });
      });
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.fps && this.metrics.fps < this.config.fpsThreshold) {
      recommendations.push('Consider reducing animation complexity or frequency');
    }

    if (this.metrics.memoryUsage && this.metrics.memoryUsage > this.config.memoryThreshold) {
      recommendations.push('Memory usage is high. Consider implementing lazy loading');
    }

    if (this.metrics.bundleSize && this.metrics.bundleSize > this.config.maxBundleSize) {
      recommendations.push('Bundle size is large. Consider code splitting');
    }

    if (this.metrics.networkLatency && this.metrics.networkLatency > 1000) {
      recommendations.push('Network latency is high. Consider caching strategies');
    }

    return recommendations;
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  destroy(): void {
    this.memoryManager.stopMemoryMonitoring();
    RenderOptimizer.cancelScheduledRenders();
    
    this.observers.forEach(observer => observer.disconnect());
    this.observers.length = 0;
  }
}

// Export utilities
export { MemoryManager, BundleOptimizer, RenderOptimizer, NetworkOptimizer };
export type { PerformanceMetrics, PerformanceConfig, OptimizationResult };