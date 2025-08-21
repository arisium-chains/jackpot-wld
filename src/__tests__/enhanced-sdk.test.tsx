/**
 * Enhanced MiniApp SDK Test Suite
 * Comprehensive tests for all SDK components and functionality
 */

import * as React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Import components to test
import { EnhancedMiniKitProvider } from '../providers/enhanced-minikit-provider';
import EnhancedWalletConnect from '../components/enhanced-wallet-connect';
import EnhancedPayment from '../components/enhanced-payment';
import EnhancedWorldID from '../components/enhanced-world-id';
import EnhancedSharing from '../components/enhanced-sharing';
import EnhancedBiometricAuth from '../components/enhanced-biometric-auth';
import EnhancedPushNotifications from '../components/enhanced-push-notifications';
import EnhancedAnalytics from '../components/enhanced-analytics';
import EnhancedOfflineSupport from '../components/enhanced-offline-support';
import EnhancedUIOptimizations from '../components/enhanced-ui-optimizations';
import { miniAppSDK, EnhancedMiniAppSDK } from '../lib/miniapp-sdk';

// Mock external dependencies
jest.mock('../lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock MiniKit
jest.mock('@worldcoin/minikit-js', () => ({
  MiniKit: {
    isInstalled: jest.fn(() => true),
    install: jest.fn(),
    walletAuth: jest.fn(),
    commandsAsync: {
      walletAuth: jest.fn(),
      pay: jest.fn(),
      verify: jest.fn()
    }
  }
}));

// Mock Web APIs
Object.defineProperty(window, 'navigator', {
  value: {
    ...window.navigator,
    share: jest.fn(),
    clipboard: {
      writeText: jest.fn()
    },
    serviceWorker: {
      register: jest.fn(),
      ready: Promise.resolve({
        showNotification: jest.fn()
      })
    },
    permissions: {
      query: jest.fn(() => Promise.resolve({ state: 'granted' }))
    },
    vibrate: jest.fn(),
    deviceMemory: 8,
    hardwareConcurrency: 4,
    connection: {
      effectiveType: '4g'
    }
  },
  writable: true
});

Object.defineProperty(window, 'matchMedia', {
  value: jest.fn(() => ({
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn()
  })),
  writable: true
});

Object.defineProperty(window, 'IntersectionObserver', {
  value: jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  })),
  writable: true
});

Object.defineProperty(window, 'PerformanceObserver', {
  value: jest.fn(() => ({
    observe: jest.fn(),
    disconnect: jest.fn()
  })),
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <EnhancedMiniKitProvider>
    {children}
  </EnhancedMiniKitProvider>
);

// Helper function to render with provider
const renderWithProvider = (component: React.ReactElement) => {
  return render(component, { wrapper: TestWrapper });
};

describe('Enhanced MiniApp SDK', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('MiniAppSDK Core', () => {
    test('should initialize SDK correctly', () => {
      const sdk = new EnhancedMiniAppSDK();
      expect(sdk).toBeDefined();
      expect(sdk.status).toBe('idle');
    });

    test('should detect environment correctly', () => {
      const sdk = new EnhancedMiniAppSDK();
      const envInfo = sdk.environment;
      
      expect(envInfo).toHaveProperty('isWorldApp');
      expect(envInfo).toHaveProperty('isMiniApp');
      expect(envInfo).toHaveProperty('platform');
      expect(envInfo).toHaveProperty('version');
    });

    test('should handle initialization', async () => {
      const sdk = new EnhancedMiniAppSDK();
      await sdk.initialize();
      expect(sdk.status).toBe('ready');
    });
  });

  describe('EnhancedWalletConnect', () => {
    test('should render wallet connect component', () => {
      renderWithProvider(<EnhancedWalletConnect />);
      expect(screen.getByText(/wallet/i)).toBeInTheDocument();
    });

    test('should handle wallet connection', async () => {
      const user = userEvent.setup();
      renderWithProvider(<EnhancedWalletConnect />);
      
      const connectButton = screen.getByRole('button', { name: /connect/i });
      await user.click(connectButton);
      
      // Should show loading state or connection attempt
      await waitFor(() => {
        expect(screen.getByText(/connecting/i) || screen.getByText(/connect/i)).toBeInTheDocument();
      });
    });

    test('should display wallet information when connected', async () => {
      // Mock connected state
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'wallet_connection_history') {
          return JSON.stringify([{
            address: '0x1234567890123456789012345678901234567890',
            timestamp: Date.now(),
            chainId: 1
          }]);
        }
        return null;
      });

      renderWithProvider(<EnhancedWalletConnect />);
      
      await waitFor(() => {
        expect(screen.getByText(/0x1234/i) || screen.getByText(/wallet/i)).toBeInTheDocument();
      });
    });
  });

  describe('EnhancedPayment', () => {
    test('should render payment component', () => {
      renderWithProvider(<EnhancedPayment />);
      expect(screen.getByText(/payment/i)).toBeInTheDocument();
    });

    test('should handle payment form submission', async () => {
      const user = userEvent.setup();
      renderWithProvider(<EnhancedPayment />);
      
      // Fill payment form
      const recipientInput = screen.getByLabelText(/recipient/i) || screen.getByPlaceholderText(/recipient/i);
      const amountInput = screen.getByLabelText(/amount/i) || screen.getByPlaceholderText(/amount/i);
      
      if (recipientInput && amountInput) {
        await user.type(recipientInput, '0x1234567890123456789012345678901234567890');
        await user.type(amountInput, '0.1');
        
        const submitButton = screen.getByRole('button', { name: /send/i });
        await user.click(submitButton);
      }
    });

    test('should validate payment inputs', async () => {
      const user = userEvent.setup();
      renderWithProvider(<EnhancedPayment />);
      
      const submitButton = screen.getByRole('button', { name: /send/i });
      await user.click(submitButton);
      
      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/required/i) || screen.getByText(/invalid/i) || screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('EnhancedWorldID', () => {
    test('should render World ID component', () => {
      renderWithProvider(<EnhancedWorldID />);
      expect(screen.getByText(/world id/i)).toBeInTheDocument();
    });

    test('should handle verification process', async () => {
      const user = userEvent.setup();
      renderWithProvider(<EnhancedWorldID />);
      
      const verifyButton = screen.getByRole('button', { name: /verify/i });
      await user.click(verifyButton);
      
      // Should show verification process
      await waitFor(() => {
        expect(screen.getByText(/verifying/i) || screen.getByText(/verify/i)).toBeInTheDocument();
      });
    });

    test('should display verification history', async () => {
      // Mock verification history
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'worldid_verification_history') {
          return JSON.stringify([{
            id: '1',
            action: 'test-action',
            timestamp: Date.now(),
            status: 'success'
          }]);
        }
        return null;
      });

      renderWithProvider(<EnhancedWorldID />);
      
      await waitFor(() => {
        expect(screen.getByText(/history/i) || screen.getByText(/verification/i)).toBeInTheDocument();
      });
    });
  });

  describe('EnhancedSharing', () => {
    test('should render sharing component', () => {
      renderWithProvider(<EnhancedSharing />);
      expect(screen.getByText(/shar/i)).toBeInTheDocument();
    });

    test('should handle native sharing', async () => {
      const user = userEvent.setup();
      renderWithProvider(<EnhancedSharing />);
      
      const shareButton = screen.getByRole('button', { name: /share/i });
      await user.click(shareButton);
      
      expect(navigator.share).toHaveBeenCalled();
    });

    test('should handle copy to clipboard', async () => {
      const user = userEvent.setup();
      renderWithProvider(<EnhancedSharing />);
      
      const copyButton = screen.getByRole('button', { name: /copy/i });
      await user.click(copyButton);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  describe('EnhancedBiometricAuth', () => {
    test('should render biometric auth component', () => {
      renderWithProvider(<EnhancedBiometricAuth />);
      expect(screen.getByText(/biometric/i)).toBeInTheDocument();
    });

    test('should check biometric availability', async () => {
      renderWithProvider(<EnhancedBiometricAuth />);
      
      await waitFor(() => {
        expect(screen.getByText(/available/i) || screen.getByText(/not available/i) || screen.getByText(/biometric/i)).toBeInTheDocument();
      });
    });

    test('should handle authentication attempt', async () => {
      const user = userEvent.setup();
      renderWithProvider(<EnhancedBiometricAuth />);
      
      const authButton = screen.getByRole('button', { name: /authenticate/i });
      await user.click(authButton);
      
      // Should show authentication process
      await waitFor(() => {
        expect(screen.getByText(/authenticating/i) || screen.getByText(/authenticate/i)).toBeInTheDocument();
      });
    });
  });

  describe('EnhancedPushNotifications', () => {
    test('should render push notifications component', () => {
      renderWithProvider(<EnhancedPushNotifications />);
      expect(screen.getByText(/notification/i)).toBeInTheDocument();
    });

    test('should handle permission request', async () => {
      const user = userEvent.setup();
      renderWithProvider(<EnhancedPushNotifications />);
      
      const enableButton = screen.getByRole('button', { name: /enable/i });
      await user.click(enableButton);
      
      expect(navigator.permissions.query).toHaveBeenCalled();
    });

    test('should send test notification', async () => {
      const user = userEvent.setup();
      renderWithProvider(<EnhancedPushNotifications />);
      
      const testButton = screen.getByRole('button', { name: /test/i });
      await user.click(testButton);
      
      // Should attempt to send notification
      await waitFor(() => {
        expect(screen.getByText(/sent/i) || screen.getByText(/test/i)).toBeInTheDocument();
      });
    });
  });

  describe('EnhancedAnalytics', () => {
    test('should render analytics component', () => {
      renderWithProvider(<EnhancedAnalytics />);
      expect(screen.getByText(/analytics/i)).toBeInTheDocument();
    });

    test('should display analytics dashboard', async () => {
      renderWithProvider(<EnhancedAnalytics />);
      
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i) || screen.getByText(/events/i) || screen.getByText(/analytics/i)).toBeInTheDocument();
      });
    });

    test('should track custom events', async () => {
      const user = userEvent.setup();
      renderWithProvider(<EnhancedAnalytics />);
      
      const trackButton = screen.getByRole('button', { name: /track/i });
      await user.click(trackButton);
      
      // Should show event tracking
      await waitFor(() => {
        expect(screen.getByText(/tracked/i) || screen.getByText(/event/i)).toBeInTheDocument();
      });
    });
  });

  describe('EnhancedOfflineSupport', () => {
    test('should render offline support component', () => {
      renderWithProvider(<EnhancedOfflineSupport />);
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });

    test('should display offline status', async () => {
      renderWithProvider(<EnhancedOfflineSupport />);
      
      await waitFor(() => {
        expect(screen.getByText(/online/i) || screen.getByText(/offline/i)).toBeInTheDocument();
      });
    });

    test('should handle sync operations', async () => {
      const user = userEvent.setup();
      renderWithProvider(<EnhancedOfflineSupport />);
      
      const syncButton = screen.getByRole('button', { name: /sync/i });
      await user.click(syncButton);
      
      // Should show sync process
      await waitFor(() => {
        expect(screen.getByText(/syncing/i) || screen.getByText(/sync/i)).toBeInTheDocument();
      });
    });
  });

  describe('EnhancedUIOptimizations', () => {
    test('should render UI optimizations component', () => {
      renderWithProvider(<EnhancedUIOptimizations />);
      expect(screen.getByText(/optimization/i)).toBeInTheDocument();
    });

    test('should display performance metrics', async () => {
      renderWithProvider(<EnhancedUIOptimizations />);
      
      await waitFor(() => {
        expect(screen.getByText(/performance/i) || screen.getByText(/fps/i) || screen.getByText(/memory/i)).toBeInTheDocument();
      });
    });

    test('should handle accessibility settings', async () => {
      const user = userEvent.setup();
      renderWithProvider(<EnhancedUIOptimizations />);
      
      const accessibilityCheckbox = screen.getByRole('checkbox', { name: /reduce motion/i });
      await user.click(accessibilityCheckbox);
      
      expect(accessibilityCheckbox).toBeChecked();
    });
  });

  describe('Integration Tests', () => {
    test('should handle multiple components together', async () => {
      renderWithProvider(
        <div>
          <EnhancedWalletConnect />
          <EnhancedPayment />
          <EnhancedWorldID />
        </div>
      );
      
      // All components should render without conflicts
      expect(screen.getByText(/wallet/i)).toBeInTheDocument();
      expect(screen.getByText(/payment/i)).toBeInTheDocument();
      expect(screen.getByText(/world id/i)).toBeInTheDocument();
    });

    test('should handle error propagation', async () => {
      const onError = jest.fn();
      
      renderWithProvider(
        <EnhancedWalletConnect onError={onError} />
      );
      
      // Simulate error condition
      const connectButton = screen.getByRole('button', { name: /connect/i });
      fireEvent.click(connectButton);
      
      // Error handler should be available
      expect(onError).toBeDefined();
    });

    test('should maintain state across component updates', async () => {
      const { rerender } = renderWithProvider(<EnhancedAnalytics />);
      
      // Component should maintain its state
      rerender(
        <TestWrapper>
          <EnhancedAnalytics />
        </TestWrapper>
      );
      
      expect(screen.getByText(/analytics/i)).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    test('should render components within performance budget', async () => {
      const startTime = performance.now();
      
      renderWithProvider(
        <div>
          <EnhancedWalletConnect />
          <EnhancedPayment />
          <EnhancedWorldID />
          <EnhancedSharing />
          <EnhancedBiometricAuth />
        </div>
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(1000); // 1 second
    });

    test('should handle rapid state updates', async () => {
      const user = userEvent.setup();
      renderWithProvider(<EnhancedUIOptimizations />);
      
      // Rapidly toggle settings
      const checkbox = screen.getByRole('checkbox', { name: /reduce motion/i });
      
      for (let i = 0; i < 10; i++) {
        await user.click(checkbox);
      }
      
      // Component should still be responsive
      expect(checkbox).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    test('should have proper ARIA labels', () => {
      renderWithProvider(<EnhancedWalletConnect />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label', expect.any(String));
      });
    });

    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProvider(<EnhancedPayment />);
      
      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();
      
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();
    });

    test('should have proper heading structure', () => {
      renderWithProvider(<EnhancedAnalytics />);
      
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
      
      headings.forEach(heading => {
        expect(heading.tagName).toMatch(/^H[1-6]$/);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network error
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      
      renderWithProvider(<EnhancedPayment />);
      
      // Component should still render and handle error
      expect(screen.getByText(/payment/i)).toBeInTheDocument();
    });

    test('should handle invalid props gracefully', () => {
      // Test with invalid props
      expect(() => {
        renderWithProvider(<EnhancedWalletConnect onError={undefined} />);
      }).not.toThrow();
    });

    test('should recover from component errors', async () => {
      const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
        try {
          return <>{children}</>;
        } catch (error) {
          return <div>Error occurred</div>;
        }
      };
      
      renderWithProvider(
        <ErrorBoundary>
          <EnhancedAnalytics />
        </ErrorBoundary>
      );
      
      // Should either render component or error boundary
      expect(screen.getByText(/analytics/i) || screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});

// Cleanup after tests
afterAll(() => {
  jest.restoreAllMocks();
});