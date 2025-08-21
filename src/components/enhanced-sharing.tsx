/**
 * Enhanced Sharing Component
 * Comprehensive sharing and social features integration
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useEnhancedSharing, useEnhancedAnalytics, useEnhancedWallet } from '../providers/enhanced-minikit-provider';
import { ShareOptions, ShareResponse, SDKError } from '../types/miniapp-sdk';
import { logger } from '../lib/logger';

/**
 * Enhanced Sharing Props
 */
interface EnhancedSharingProps {
  title?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  onSuccess?: (response: ShareResponse) => void;
  onError?: (error: SDKError) => void;
  className?: string;
  showSocialButtons?: boolean;
  showCopyLink?: boolean;
  showQRCode?: boolean;
  customShareText?: string;
  trackSharing?: boolean;
}

/**
 * Share platform types
 */
type SharePlatform = 'native' | 'twitter' | 'telegram' | 'whatsapp' | 'facebook' | 'linkedin' | 'reddit' | 'copy' | 'qr';

/**
 * Share history item
 */
interface ShareHistoryItem {
  id: string;
  platform: SharePlatform;
  title: string;
  url: string;
  timestamp: Date;
  success: boolean;
}

/**
 * Enhanced Sharing Component
 */
export function EnhancedSharing({
  title = 'Check out this amazing MiniApp!',
  description = 'Discover the future of decentralized applications with World ID verification.',
  url = typeof window !== 'undefined' ? window.location.href : '',
  imageUrl,
  onSuccess,
  onError,
  className = '',
  showSocialButtons = true,
  showCopyLink = true,
  showQRCode = true,
  customShareText,
  trackSharing = true
}: EnhancedSharingProps) {
  // Hooks
  const sharing = useEnhancedSharing();
  const analytics = useEnhancedAnalytics();
  const wallet = useEnhancedWallet();

  // Component state
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareHistory, setShareHistory] = useState<ShareHistoryItem[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [customTitle, setCustomTitle] = useState(title);
  const [customDescription, setCustomDescription] = useState(description);
  const [customUrl, setCustomUrl] = useState(url);

  // Load share history
  useEffect(() => {
    loadShareHistory();
  }, []);

  // Generate QR code data
  useEffect(() => {
    if (showQRCode) {
      generateQRCode();
    }
  }, [customUrl, showQRCode]);

  // Load share history
  const loadShareHistory = useCallback(async () => {
    try {
      const stored = localStorage.getItem('sharing-history');
      if (stored) {
        const history = JSON.parse(stored).map((item: {
          id: string;
          platform: SharePlatform;
          title: string;
          url: string;
          timestamp: string;
          success: boolean;
        }) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setShareHistory(history);
      }
    } catch (error) {
      logger.error('Failed to load share history', error);
    }
  }, []);

  // Save share to history
  const saveShareToHistory = useCallback((item: Omit<ShareHistoryItem, 'id'>) => {
    const historyItem: ShareHistoryItem = {
      ...item,
      id: `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const updatedHistory = [historyItem, ...shareHistory].slice(0, 20); // Keep last 20
    setShareHistory(updatedHistory);

    // Save to localStorage
    try {
      localStorage.setItem('sharing-history', JSON.stringify(updatedHistory));
    } catch (error) {
      logger.error('Failed to save share history', error);
    }
  }, [shareHistory]);

  // Generate QR code
  const generateQRCode = useCallback(async () => {
    try {
      // This would typically use a QR code generation library
      // For now, we'll create a simple data URL
      const qrData = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(customUrl)}`;
      setQrCodeData(qrData);
    } catch (error) {
      logger.error('Failed to generate QR code', error);
    }
  }, [customUrl]);

  // Handle native sharing
  const handleNativeShare = useCallback(async () => {
    if (isSharing) return;

    setIsSharing(true);
    setShareError(null);

    try {
      // Track share attempt
      if (trackSharing) {
        await analytics.track({
          name: 'share_attempt',
          properties: {
            platform: 'native',
            title: customTitle,
            url: customUrl,
            has_image: !!imageUrl,
            wallet_connected: wallet.state.isConnected
          }
        });
      }

      // Prepare share options
      const shareOptions: ShareOptions = {
        title: customTitle,
        text: customDescription,
        url: customUrl,
        imageUrl: imageUrl || undefined
      };

      // Execute native share
      const response = await sharing.share(shareOptions);

      if (response.success) {
        // Track successful share
        if (trackSharing) {
          await analytics.track({
            name: 'share_success',
            properties: {
              platform: 'native',
              title: customTitle,
              url: customUrl
            }
          });
        }

        // Save to history
        saveShareToHistory({
          platform: 'native',
          title: customTitle,
          url: customUrl,
          timestamp: new Date(),
          success: true
        });

        // Call success callback
        onSuccess?.(response);

        logger.info('Native share completed successfully');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Share failed';
      setShareError(errorMessage);

      // Track share error
      if (trackSharing) {
        await analytics.track({
          name: 'share_error',
          properties: {
            platform: 'native',
            error_message: errorMessage,
            title: customTitle,
            url: customUrl
          }
        });
      }

      // Save to history
      saveShareToHistory({
        platform: 'native',
        title: customTitle,
        url: customUrl,
        timestamp: new Date(),
        success: false
      });

      // Call error callback
      if (error instanceof Error) {
        onError?.({
          code: 'SHARE_FAILED',
          message: errorMessage,
          timestamp: new Date()
        });
      }

      logger.error('Native share failed', error);
    } finally {
      setIsSharing(false);
    }
  }, [customTitle, customDescription, customUrl, imageUrl, isSharing, sharing, analytics, wallet.state, trackSharing, onSuccess, onError, saveShareToHistory]);

  // Handle social platform sharing
  const handleSocialShare = useCallback(async (platform: SharePlatform) => {
    try {
      let shareUrl = '';
      const encodedUrl = encodeURIComponent(customUrl);
      const encodedTitle = encodeURIComponent(customTitle);
      const encodedDescription = encodeURIComponent(customDescription);

      switch (platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
          break;
        case 'telegram':
          shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
          break;
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
          break;
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
          break;
        case 'reddit':
          shareUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      // Track social share attempt
      if (trackSharing) {
        await analytics.track({
          name: 'social_share_attempt',
          properties: {
            platform,
            title: customTitle,
            url: customUrl
          }
        });
      }

      // Open share URL
      window.open(shareUrl, '_blank', 'width=600,height=400');

      // Save to history
      saveShareToHistory({
        platform,
        title: customTitle,
        url: customUrl,
        timestamp: new Date(),
        success: true
      });

      // Track successful social share
      if (trackSharing) {
        await analytics.track({
          name: 'social_share_success',
          properties: {
            platform,
            title: customTitle,
            url: customUrl
          }
        });
      }

      logger.info(`Social share to ${platform} initiated`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Social share failed';
      setShareError(errorMessage);
      logger.error(`Social share to ${platform} failed`, error);
    }
  }, [customTitle, customDescription, customUrl, analytics, trackSharing, saveShareToHistory]);

  // Handle copy link
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(customUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);

      // Track copy link
      if (trackSharing) {
        await analytics.track({
          name: 'copy_link',
          properties: {
            url: customUrl
          }
        });
      }

      // Save to history
      saveShareToHistory({
        platform: 'copy',
        title: 'Link Copied',
        url: customUrl,
        timestamp: new Date(),
        success: true
      });

      logger.info('Link copied to clipboard');
    } catch (error) {
      setShareError('Failed to copy link');
      logger.error('Failed to copy link', error);
    }
  }, [customUrl, analytics, trackSharing, saveShareToHistory]);

  // Get platform icon
  const getPlatformIcon = useCallback((platform: SharePlatform) => {
    const iconClass = "w-5 h-5";
    
    switch (platform) {
      case 'native':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        );
      case 'twitter':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
        );
      case 'telegram':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        );
      case 'whatsapp':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>
        );
      case 'copy':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'qr':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        );
    }
  }, []);

  // Format timestamp for display
  const formatTimestamp = useCallback((timestamp: Date) => {
    return timestamp.toLocaleString();
  }, []);

  return (
    <div className={`enhanced-sharing ${className}`}>
      {/* Share Configuration */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Share Content
        </h2>

        {/* Share Error */}
        {shareError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{shareError}</span>
            </div>
          </div>
        )}

        {/* Share Content Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL
            </label>
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Native Share Button */}
        <div className="mb-6">
          <button
            onClick={handleNativeShare}
            disabled={isSharing || sharing.status === 'sharing'}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {isSharing || sharing.status === 'sharing' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sharing...
              </>
            ) : (
              <>
                {getPlatformIcon('native')}
                <span className="ml-2">{customShareText || 'Share'}</span>
              </>
            )}
          </button>
        </div>

        {/* Social Share Buttons */}
        {showSocialButtons && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Share on Social Media
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['twitter', 'telegram', 'whatsapp', 'facebook'] as SharePlatform[]).map((platform) => (
                <button
                  key={platform}
                  onClick={() => handleSocialShare(platform)}
                  className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {getPlatformIcon(platform)}
                  <span className="ml-2 text-sm capitalize">{platform}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Utility Buttons */}
        <div className="flex space-x-3">
          {showCopyLink && (
            <button
              onClick={handleCopyLink}
              className={`flex-1 flex items-center justify-center p-3 border rounded-lg transition-colors ${
                copySuccess
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {getPlatformIcon('copy')}
              <span className="ml-2 text-sm">
                {copySuccess ? 'Copied!' : 'Copy Link'}
              </span>
            </button>
          )}
          {showQRCode && (
            <button
              onClick={() => setShowQR(!showQR)}
              className="flex-1 flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {getPlatformIcon('qr')}
              <span className="ml-2 text-sm">QR Code</span>
            </button>
          )}
        </div>

        {/* QR Code Display */}
        {showQR && qrCodeData && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
            <img
              src={qrCodeData}
              alt="QR Code"
              className="mx-auto mb-2"
              width={200}
              height={200}
            />
            <p className="text-sm text-gray-600">
              Scan to share this link
            </p>
          </div>
        )}
      </div>

      {/* Share History */}
      {shareHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Share History
          </h3>
          <div className="space-y-3">
            {shareHistory.slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getPlatformIcon(item.platform)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTimestamp(item.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {item.success ? 'Success' : 'Failed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedSharing;