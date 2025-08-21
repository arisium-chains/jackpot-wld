/**
 * Performance Configuration for MiniApp
 * Optimized settings for different device capabilities and network conditions
 */

import type { PerformanceConfig } from '../lib/performance-optimizer';

// Device capability detection
interface DeviceCapabilities {
  memory: number; // GB
  cores: number;
  connectionType: string;
  isLowEnd: boolean;
  isMobile: boolean;
}

// Performance profiles
interface PerformanceProfile {
  name: string;
  config: PerformanceConfig;
  description: string;
}

// Detect device capabilities
export function detectDeviceCapabilities(): DeviceCapabilities {
  const memory = typeof navigator !== 'undefined' && 'deviceMemory' in navigator 
    ? (navigator as unknown as { deviceMemory: number }).deviceMemory 
    : 4; // Default to 4GB

  const cores = typeof navigator !== 'undefined' && 'hardwareConcurrency' in navigator
    ? navigator.hardwareConcurrency
    : 4; // Default to 4 cores

  const connection = typeof navigator !== 'undefined' && 'connection' in navigator
    ? (navigator as unknown as { connection: { effectiveType: string } }).connection?.effectiveType || '4g'
    : '4g';

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const isLowEnd = memory <= 2 || cores <= 2 || connection === 'slow-2g' || connection === '2g';

  return {
    memory,
    cores,
    connectionType: connection,
    isLowEnd,
    isMobile
  };
}

// Performance profiles for different device types
export const performanceProfiles: Record<string, PerformanceProfile> = {
  highEnd: {
    name: 'High-End Device',
    description: 'Optimized for powerful devices with good network',
    config: {
      enableMemoryOptimization: true,
      enableBundleOptimization: true,
      enableRenderOptimization: true,
      enableNetworkOptimization: true,
      memoryThreshold: 200, // MB
      fpsThreshold: 55,
      maxBundleSize: 1000 // KB
    }
  },
  midRange: {
    name: 'Mid-Range Device',
    description: 'Balanced optimization for average devices',
    config: {
      enableMemoryOptimization: true,
      enableBundleOptimization: true,
      enableRenderOptimization: true,
      enableNetworkOptimization: true,
      memoryThreshold: 150, // MB
      fpsThreshold: 45,
      maxBundleSize: 750 // KB
    }
  },
  lowEnd: {
    name: 'Low-End Device',
    description: 'Aggressive optimization for constrained devices',
    config: {
      enableMemoryOptimization: true,
      enableBundleOptimization: true,
      enableRenderOptimization: true,
      enableNetworkOptimization: true,
      memoryThreshold: 100, // MB
      fpsThreshold: 30,
      maxBundleSize: 500 // KB
    }
  },
  minimal: {
    name: 'Minimal Performance',
    description: 'Maximum optimization for very constrained environments',
    config: {
      enableMemoryOptimization: true,
      enableBundleOptimization: true,
      enableRenderOptimization: true,
      enableNetworkOptimization: true,
      memoryThreshold: 50, // MB
      fpsThreshold: 20,
      maxBundleSize: 300 // KB
    }
  }
};

// Auto-detect optimal performance profile
export function getOptimalPerformanceProfile(): PerformanceProfile {
  const capabilities = detectDeviceCapabilities();

  if (capabilities.isLowEnd) {
    return capabilities.memory <= 1 ? performanceProfiles.minimal : performanceProfiles.lowEnd;
  }

  if (capabilities.memory >= 8 && capabilities.cores >= 8 && capabilities.connectionType === '4g') {
    return performanceProfiles.highEnd;
  }

  return performanceProfiles.midRange;
}

// Network-specific optimizations
export const networkOptimizations = {
  'slow-2g': {
    enableImageCompression: true,
    enableDataSaver: true,
    prefetchLimit: 1,
    cacheStrategy: 'aggressive'
  },
  '2g': {
    enableImageCompression: true,
    enableDataSaver: true,
    prefetchLimit: 2,
    cacheStrategy: 'aggressive'
  },
  '3g': {
    enableImageCompression: true,
    enableDataSaver: false,
    prefetchLimit: 3,
    cacheStrategy: 'normal'
  },
  '4g': {
    enableImageCompression: false,
    enableDataSaver: false,
    prefetchLimit: 5,
    cacheStrategy: 'normal'
  }
};

// Memory optimization strategies
export const memoryOptimizations = {
  lowMemory: {
    enableVirtualScrolling: true,
    enableLazyLoading: true,
    imageQuality: 'low',
    cacheSize: 'small',
    garbageCollectionInterval: 15000 // 15 seconds
  },
  normalMemory: {
    enableVirtualScrolling: true,
    enableLazyLoading: true,
    imageQuality: 'medium',
    cacheSize: 'medium',
    garbageCollectionInterval: 30000 // 30 seconds
  },
  highMemory: {
    enableVirtualScrolling: false,
    enableLazyLoading: false,
    imageQuality: 'high',
    cacheSize: 'large',
    garbageCollectionInterval: 60000 // 60 seconds
  }
};

// Render optimization strategies
export const renderOptimizations = {
  lowEnd: {
    enableAnimations: false,
    enableTransitions: false,
    enableShadows: false,
    enableBlur: false,
    maxFPS: 30
  },
  midRange: {
    enableAnimations: true,
    enableTransitions: true,
    enableShadows: false,
    enableBlur: false,
    maxFPS: 45
  },
  highEnd: {
    enableAnimations: true,
    enableTransitions: true,
    enableShadows: true,
    enableBlur: true,
    maxFPS: 60
  }
};

// Bundle optimization strategies
export const bundleOptimizations = {
  minimal: {
    enableCodeSplitting: true,
    enableTreeShaking: true,
    enableMinification: true,
    enableCompression: true,
    chunkSize: 'small'
  },
  balanced: {
    enableCodeSplitting: true,
    enableTreeShaking: true,
    enableMinification: true,
    enableCompression: true,
    chunkSize: 'medium'
  },
  performance: {
    enableCodeSplitting: false,
    enableTreeShaking: true,
    enableMinification: true,
    enableCompression: true,
    chunkSize: 'large'
  }
};

// Get comprehensive optimization config
export function getOptimizationConfig() {
  const capabilities = detectDeviceCapabilities();
  const profile = getOptimalPerformanceProfile();
  
  return {
    performance: profile.config,
    network: networkOptimizations[capabilities.connectionType as keyof typeof networkOptimizations] || networkOptimizations['4g'],
    memory: capabilities.memory <= 2 ? memoryOptimizations.lowMemory : 
            capabilities.memory <= 4 ? memoryOptimizations.normalMemory : 
            memoryOptimizations.highMemory,
    render: capabilities.isLowEnd ? renderOptimizations.lowEnd :
            capabilities.memory >= 8 ? renderOptimizations.highEnd :
            renderOptimizations.midRange,
    bundle: capabilities.isLowEnd ? bundleOptimizations.minimal :
            capabilities.memory >= 8 ? bundleOptimizations.performance :
            bundleOptimizations.balanced,
    capabilities,
    profile: profile.name
  };
}

// Performance monitoring thresholds
export const performanceThresholds = {
  critical: {
    memoryUsage: 90, // % of available memory
    fps: 15,
    loadTime: 5000, // ms
    renderTime: 100 // ms
  },
  warning: {
    memoryUsage: 70, // % of available memory
    fps: 25,
    loadTime: 3000, // ms
    renderTime: 50 // ms
  },
  good: {
    memoryUsage: 50, // % of available memory
    fps: 45,
    loadTime: 1500, // ms
    renderTime: 16 // ms (60fps)
  }
};

// Export default configuration
export const defaultPerformanceConfig = getOptimalPerformanceProfile().config;