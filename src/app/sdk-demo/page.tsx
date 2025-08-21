/**
 * Enhanced MiniApp SDK Demo Page
 * Comprehensive showcase of all SDK features and components
 */

'use client';

import React, { useState } from 'react';
import { EnhancedMiniKitProvider } from '../../providers/enhanced-minikit-provider';
import SDKIntegration from '../../components/sdk-integration';
import { SDKError } from '../../types/miniapp-sdk';
import { logger } from '../../lib/logger';

/**
 * Demo section configuration
 */
interface DemoSection {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<{ onError?: (error: SDKError) => void }>;
  category: 'core' | 'features' | 'optimization' | 'analytics';
  priority: 'high' | 'medium' | 'low';
}

// Simplified to use the comprehensive SDK integration component
const showAdvancedFeatures = true;
const enablePerformanceMonitoring = true;
const autoOptimize = true;

/**
 * Enhanced MiniApp SDK Demo Page
 */
export default function SDKDemoPage() {
  // Component state
  const [activeSection, setActiveSection] = useState<string>('wallet');
  const [errors, setErrors] = useState<SDKError[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showSidebar, setShowSidebar] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  // Handle errors from components
  const handleError = (error: SDKError) => {
    setErrors(prev => [error, ...prev.slice(0, 9)]); // Keep last 10 errors
    logger.error('SDK Demo Error', { error: error.message, code: error.code });
  };

  // Clear errors
  const clearErrors = () => {
    setErrors([]);
  };

  // Simplified category counts since we're using integrated component
  const categoryCounts = {
    all: 15,
    core: 3,
    features: 4,
    optimization: 2,
    analytics: 1
  };

  return (
    <EnhancedMiniKitProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="ml-4 lg:ml-0">
                  <h1 className="text-xl font-semibold text-gray-900">
                    Enhanced MiniApp SDK Demo
                  </h1>
                  <p className="text-sm text-gray-600">
                    Comprehensive showcase of all SDK features
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Compact Mode Toggle */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={compactMode}
                    onChange={(e) => setCompactMode(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Compact</span>
                </label>
                
                {/* Error Indicator */}
                {errors.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={clearErrors}
                      className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      {errors.length} Error{errors.length !== 1 ? 's' : ''}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Display */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-red-800">
                  Recent Errors ({errors.length})
                </h3>
                <button
                  onClick={clearErrors}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-2">
                {errors.slice(0, 3).map((error, index) => (
                  <div key={index} className="text-sm text-red-700">
                    <span className="font-medium">{error.code}:</span> {error.message}
                  </div>
                ))}
                {errors.length > 3 && (
                  <div className="text-sm text-red-600">
                    ... and {errors.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main SDK Integration Component */}
          <SDKIntegration 
            showAdvanced={showAdvancedFeatures}
            enablePerformanceMonitoring={enablePerformanceMonitoring}
            autoOptimize={autoOptimize}
            onError={handleError}
          />
        </div>
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Enhanced MiniApp SDK
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Comprehensive SDK implementation with advanced features, optimizations, and analytics
              </p>
              <div className="flex justify-center space-x-6 text-sm text-gray-500">
                <span>✓ Wallet Integration</span>
                <span>✓ Payment Processing</span>
                <span>✓ World ID Verification</span>
                <span>✓ Social Features</span>
                <span>✓ Biometric Auth</span>
                <span>✓ Push Notifications</span>
                <span>✓ Analytics</span>
                <span>✓ Offline Support</span>
                <span>✓ UI Optimizations</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </EnhancedMiniKitProvider>
  );
}