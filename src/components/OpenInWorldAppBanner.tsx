'use client';

import { AlertCircle, ExternalLink } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface OpenInWorldAppBannerProps {
  className?: string;
}

export function OpenInWorldAppBanner({ className = '' }: OpenInWorldAppBannerProps) {
  const handleOpenInWorldApp = () => {
    // In a real implementation, this would generate a World App deep link
    // For now, we'll show instructions
    alert('Please open this app in World App to connect your wallet and access all features.');
  };

  return (
    <Card className={`p-6 text-center ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-8 w-8 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">World App Required</h2>
        </div>
        
        <div className="space-y-2">
          <p className="text-gray-600">
            This mini app requires World App to connect your wallet and access all features.
          </p>
          <p className="text-sm text-gray-500">
            World App provides secure wallet authentication and World ID verification.
          </p>
        </div>
        
        <Button 
          onClick={handleOpenInWorldApp}
          className="flex items-center space-x-2"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Open in World App</span>
        </Button>
        
        <div className="text-xs text-gray-400 space-y-1">
          <p>Don&apos;t have World App?</p>
          <a 
            href="https://worldcoin.org/download" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Download World App
          </a>
        </div>
      </div>
    </Card>
  );
}

export default OpenInWorldAppBanner;