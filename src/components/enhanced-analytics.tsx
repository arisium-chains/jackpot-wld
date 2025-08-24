/**
 * Enhanced Analytics Component
 * Comprehensive analytics dashboard and tracking integration
 */

'use client';

import * as React from 'react';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useEnhancedAnalytics, useEnhancedWallet } from '../providers/enhanced-minikit-provider';
import { AnalyticsEvent, UserProperties, SDKError } from '../types/miniapp-sdk';
import { logger } from '../lib/logger';

/**
 * Enhanced Analytics Props
 */
interface EnhancedAnalyticsProps {
  onError?: (error: SDKError) => void;
  className?: string;
  showDashboard?: boolean;
  showRealTime?: boolean;
  autoTrack?: boolean;
  enableHeatmap?: boolean;
  enableSessionRecording?: boolean;
}

/**
 * Analytics metric
 */
interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  unit?: string;
  description?: string;
}

/**
 * Event data for display
 */
interface EventData {
  id: string;
  name: string;
  timestamp: Date;
  properties: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  category?: string;
}

/**
 * User session data
 */
interface SessionData {
  id: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: number;
  events: number;
  device: string;
  browser: string;
  location?: string;
}

/**
 * Analytics chart data point
 */
interface ChartDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

/**
 * Time range options
 */
type TimeRange = '1h' | '24h' | '7d' | '30d' | '90d';

/**
 * Enhanced Analytics Component
 */
export function EnhancedAnalytics({
  onError,
  className = '',
  showDashboard = true,
  showRealTime = true,
  autoTrack = true,
  enableHeatmap = false,
  enableSessionRecording = false
}: EnhancedAnalyticsProps) {
  // Hooks
  const analytics = useEnhancedAnalytics();
  const wallet = useEnhancedWallet();

  // Component state
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [recentEvents, setRecentEvents] = useState<EventData[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('24h');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>('page_views');
  const [userProperties, setUserProperties] = useState<UserProperties>({});
  const [customEvent, setCustomEvent] = useState({
    name: '',
    properties: '{}'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [realTimeEvents, setRealTimeEvents] = useState<EventData[]>([]);
  const [heatmapData, setHeatmapData] = useState<Array<{ x: number; y: number; intensity: number }>>([]);
  const [sessionRecordings, setSessionRecordings] = useState<Array<{ id: string; duration: number; events: number }>>([]);

  // Load analytics data on mount
  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeRange]);

  // Auto-track page views if enabled
  useEffect(() => {
    if (autoTrack) {
      trackPageView();
    }
  }, [autoTrack]);

  // Set up real-time event listening
  useEffect(() => {
    if (showRealTime) {
      const interval = setInterval(() => {
        // Simulate real-time events - in real implementation, this would come from the SDK
        const mockEvent: EventData = {
          id: `event-${Date.now()}`,
          name: 'user_interaction',
          timestamp: new Date(),
          properties: {
            action: 'click',
            element: 'button',
            page: window.location.pathname
          },
          sessionId: `session_${Date.now()}`
        };
        
        setRealTimeEvents(prev => [mockEvent, ...prev.slice(0, 9)]); // Keep last 10
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [showRealTime]);

  // Load analytics data
  const loadAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Load metrics
      const mockMetrics: AnalyticsMetric[] = [
        {
          id: 'page_views',
          name: 'Page Views',
          value: 1247,
          change: 12.5,
          changeType: 'increase',
          description: 'Total page views in selected period'
        },
        {
          id: 'unique_users',
          name: 'Unique Users',
          value: 342,
          change: -2.1,
          changeType: 'decrease',
          description: 'Unique users who visited'
        },
        {
          id: 'session_duration',
          name: 'Avg Session Duration',
          value: 4.2,
          change: 8.7,
          changeType: 'increase',
          unit: 'min',
          description: 'Average time spent per session'
        },
        {
          id: 'bounce_rate',
          name: 'Bounce Rate',
          value: 23.4,
          change: -5.2,
          changeType: 'decrease',
          unit: '%',
          description: 'Percentage of single-page sessions'
        },
        {
          id: 'conversion_rate',
          name: 'Conversion Rate',
          value: 3.8,
          change: 15.3,
          changeType: 'increase',
          unit: '%',
          description: 'Percentage of users who completed desired actions'
        },
        {
          id: 'wallet_connections',
          name: 'Wallet Connections',
          value: 89,
          change: 22.1,
          changeType: 'increase',
          description: 'Number of successful wallet connections'
        }
      ];
      setMetrics(mockMetrics);

      // Load recent events
      const mockEvents: EventData[] = Array.from({ length: 20 }, (_, i) => ({
        id: `event-${i}`,
        name: ['page_view', 'wallet_connect', 'deposit', 'withdrawal', 'share'][Math.floor(Math.random() * 5)],
        timestamp: new Date(Date.now() - i * 300000), // 5 minutes apart
        properties: {
          page: '/dashboard',
          user_agent: 'Mozilla/5.0...',
          referrer: 'https://worldcoin.org'
        },
        category: 'user_interaction'
      }));
      setRecentEvents(mockEvents);

      // Load chart data
      const mockChartData: ChartDataPoint[] = Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() - (23 - i) * 3600000), // Hourly data for 24h
        value: Math.floor(Math.random() * 100) + 20
      }));
      setChartData(mockChartData);

      // Load sessions
      const mockSessions: SessionData[] = Array.from({ length: 10 }, (_, i) => ({
        id: `session-${i}`,
        startTime: new Date(Date.now() - i * 1800000), // 30 minutes apart
        duration: Math.floor(Math.random() * 600) + 60, // 1-10 minutes
        pageViews: Math.floor(Math.random() * 10) + 1,
        events: Math.floor(Math.random() * 50) + 5,
        device: ['Desktop', 'Mobile', 'Tablet'][Math.floor(Math.random() * 3)],
        browser: ['Chrome', 'Safari', 'Firefox', 'Edge'][Math.floor(Math.random() * 4)]
      }));
      setSessions(mockSessions);

      // Load heatmap data if enabled
      if (enableHeatmap) {
        const mockHeatmapData = Array.from({ length: 50 }, () => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
          intensity: Math.random()
        }));
        setHeatmapData(mockHeatmapData);
      }

      // Load session recordings if enabled
      if (enableSessionRecording) {
        const mockRecordings = Array.from({ length: 5 }, (_, i) => ({
          id: `recording-${i}`,
          duration: Math.floor(Math.random() * 600) + 60,
          events: Math.floor(Math.random() * 100) + 10
        }));
        setSessionRecordings(mockRecordings);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics data';
      
      onError?.({
        code: 'UNKNOWN_ERROR',
        message: errorMessage,
        timestamp: new Date()
      });

      logger.error('Failed to load analytics data', { error: String(error) });
    } finally {
      setIsLoading(false);
    }
  }, [enableHeatmap, enableSessionRecording, onError]);

  // Track page view
  const trackPageView = useCallback(async () => {
    try {
      await analytics.track({
        name: 'page_view',
        properties: {
          page: window.location.pathname,
          title: document.title,
          referrer: document.referrer,
          timestamp: new Date().toISOString(),
          wallet_connected: wallet.state.isConnected,
          wallet_address: wallet.state.address
        }
      });
    } catch (error) {
      logger.error('Failed to track page view', { error: String(error) });
    }
  }, [analytics, wallet.state]);

  // Track custom event
  const trackCustomEvent = useCallback(async () => {
    if (!customEvent.name.trim()) {
      return;
    }

    try {
      let properties = {};
      if (customEvent.properties.trim()) {
        properties = JSON.parse(customEvent.properties);
      }

      await analytics.track({
        name: customEvent.name,
        properties: {
          ...properties,
          custom_event: true,
          timestamp: new Date().toISOString()
        }
      });

      // Add to recent events
      const newEvent: EventData = {
        id: `custom-${Date.now()}`,
        name: customEvent.name,
        timestamp: new Date(),
        properties,
        category: 'custom'
      };
      setRecentEvents(prev => [newEvent, ...prev.slice(0, 19)]);

      // Reset form
      setCustomEvent({ name: '', properties: '{}' });

      logger.info('Custom event tracked successfully', { event: newEvent.name, properties: JSON.stringify(newEvent.properties) });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to track custom event';
      
      onError?.({
        code: 'UNKNOWN_ERROR',
        message: errorMessage,
        timestamp: new Date()
      });

      logger.error('Failed to track custom event', { error: String(error) });
    }
  }, [customEvent, analytics, onError]);



  // Get metric icon
  const getMetricIcon = useCallback((metricId: string) => {
    const iconClass = "w-5 h-5";
    
    switch (metricId) {
      case 'page_views':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      case 'unique_users':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        );
      case 'session_duration':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'bounce_rate':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      case 'conversion_rate':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'wallet_connections':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
    }
  }, []);

  // Get change indicator
  const getChangeIndicator = useCallback((change: number, changeType: string) => {
    const isPositive = changeType === 'increase';
    const color = isPositive ? 'text-green-600' : changeType === 'decrease' ? 'text-red-600' : 'text-gray-600';
    const icon = isPositive ? '↗' : changeType === 'decrease' ? '↘' : '→';
    
    return (
      <span className={`text-sm ${color} flex items-center`}>
        <span className="mr-1">{icon}</span>
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  }, []);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: Date) => {
    return timestamp.toLocaleString();
  }, []);

  // Format duration
  const formatDuration = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Memoized chart component
  const SimpleChart = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const maxValue = Math.max(...chartData.map(d => d.value));
    const minValue = Math.min(...chartData.map(d => d.value));
    const range = maxValue - minValue || 1;
    
    return (
      <div className="h-32 flex items-end space-x-1">
        {chartData.map((point, index) => {
          const height = ((point.value - minValue) / range) * 100;
          return (
            <div
              key={index}
              className="bg-blue-500 rounded-t flex-1 min-w-0 transition-all hover:bg-blue-600"
              style={{ height: `${Math.max(height, 5)}%` }}
              title={`${point.value} at ${formatTimestamp(point.timestamp)}`}
            />
          );
        })}
      </div>
    );
  }, [chartData, formatTimestamp]);

  if (!showDashboard) {
    return null;
  }

  return (
    <div className={`enhanced-analytics ${className}`}>
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Analytics Dashboard
          </h2>
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as TimeRange)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            
            <button
              onClick={loadAnalyticsData}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Refresh
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric) => (
            <div key={metric.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getMetricIcon(metric.id)}
                  <h3 className="text-sm font-medium text-gray-700">
                    {metric.name}
                  </h3>
                </div>
                {getChangeIndicator(metric.change, metric.changeType)}
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-gray-900">
                  {metric.value.toLocaleString()}
                </span>
                {metric.unit && (
                  <span className="text-sm text-gray-500">{metric.unit}</span>
                )}
              </div>
              {metric.description && (
                <p className="text-xs text-gray-500 mt-1">
                  {metric.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {metrics.find(m => m.id === selectedMetric)?.name || 'Metric'} Over Time
          </h3>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {metrics.map((metric) => (
              <option key={metric.id} value={metric.id}>
                {metric.name}
              </option>
            ))}
          </select>
        </div>
        {SimpleChart}
      </div>

      {/* Real-time Events */}
      {showRealTime && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Real-time Events
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {realTimeEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-900">
                    {event.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {event.sessionId?.slice(-8)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Events */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Events
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Properties
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentEvents.slice(0, 10).map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {event.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(event.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {event.category || 'general'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <details className="cursor-pointer">
                      <summary className="text-blue-600 hover:text-blue-800">
                        View properties
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(event.properties, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Features */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Advanced Analytics
          </h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <span>Advanced Options</span>
            <svg className={`ml-1 h-4 w-4 transform transition-transform ${
              showAdvanced ? 'rotate-180' : ''
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-6">
            {/* Custom Event Tracking */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Track Custom Event
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Event Name</label>
                  <input
                    type="text"
                    value={customEvent.name}
                    onChange={(e) => setCustomEvent(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., button_click"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Properties (JSON)</label>
                  <input
                    type="text"
                    value={customEvent.properties}
                    onChange={(e) => setCustomEvent(prev => ({ ...prev, properties: e.target.value }))}
                    placeholder='{"button_id": "submit"}'
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={trackCustomEvent}
                disabled={!customEvent.name.trim()}
                className="mt-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
              >
                Track Event
              </button>
            </div>

            {/* Session Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Active Sessions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.slice(0, 6).map((session) => (
                  <div key={session.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-900">
                        {session.device}
                      </span>
                      <span className="text-xs text-gray-500">
                        {session.browser}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Duration: {session.duration ? formatDuration(session.duration) : 'Active'}</div>
                      <div>Page Views: {session.pageViews}</div>
                      <div>Events: {session.events}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap Data */}
            {enableHeatmap && heatmapData.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Click Heatmap
                </h4>
                <div className="bg-gray-100 rounded-lg p-4 h-32 relative overflow-hidden">
                  {heatmapData.slice(0, 20).map((point, index) => (
                    <div
                      key={index}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        left: `${point.x}%`,
                        top: `${point.y}%`,
                        backgroundColor: `rgba(59, 130, 246, ${point.intensity})`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Session Recordings */}
            {enableSessionRecording && sessionRecordings.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Session Recordings
                </h4>
                <div className="space-y-2">
                  {sessionRecordings.map((recording) => (
                    <div key={recording.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          Recording {recording.id}
                        </span>
                        <div className="text-xs text-gray-500">
                          {formatDuration(recording.duration)} • {recording.events} events
                        </div>
                      </div>
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        View Recording
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhancedAnalytics;