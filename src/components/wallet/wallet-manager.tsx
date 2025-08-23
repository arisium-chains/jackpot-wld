/**
 * Streamlined Wallet Manager Component
 * Optimized for WLD wallet integration and core functionality
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Wallet,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Copy,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useWallet } from "../../providers/miniapp-provider";
import { logger } from "../../lib/logger";
import { toast } from "sonner";

/**
 * Wallet Manager Props
 */
interface WalletManagerProps {
  className?: string;
  showBalance?: boolean;
  showChainInfo?: boolean;
  autoConnect?: boolean;
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

/**
 * Chain Information
 */
interface ChainInfo {
  id: number;
  name: string;
  nativeCurrency: {
    symbol: string;
    decimals: number;
  };
  blockExplorer?: string;
}

const SUPPORTED_CHAINS: Record<number, ChainInfo> = {
  4801: {
    id: 4801,
    name: "World Chain Sepolia",
    nativeCurrency: { symbol: "ETH", decimals: 18 },
    blockExplorer: "https://worldchain-sepolia.blockscout.com",
  },
  480: {
    id: 480,
    name: "World Chain",
    nativeCurrency: { symbol: "ETH", decimals: 18 },
    blockExplorer: "https://worldscan.org",
  },
  11155111: {
    id: 11155111,
    name: "Sepolia Testnet",
    nativeCurrency: { symbol: "ETH", decimals: 18 },
    blockExplorer: "https://sepolia.etherscan.io",
  },
  1: {
    id: 1,
    name: "Ethereum Mainnet",
    nativeCurrency: { symbol: "ETH", decimals: 18 },
    blockExplorer: "https://etherscan.io",
  },
};

/**
 * Streamlined Wallet Manager Component
 */
export function WalletManager({
  className = "",
  showBalance = true,
  showChainInfo = true,
  autoConnect = false,
  onConnect,
  onDisconnect,
  onError,
}: WalletManagerProps) {
  // Hooks
  const wallet = useWallet();

  // Local state
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState<Date | null>(null);

  // Handle wallet connection
  const handleConnect = useCallback(async () => {
    try {
      logger.info("WalletManager: Initiating connection");
      await wallet.connect();

      if (wallet.address) {
        onConnect?.(wallet.address);
        toast.success("Wallet connected successfully!");
        logger.info("WalletManager: Wallet connected", {
          address: wallet.address,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect wallet";
      onError?.(errorMessage);
      toast.error(`Connection failed: ${errorMessage}`);
      logger.error("WalletManager: Connection failed", { error: errorMessage });
    }
  }, [wallet, onConnect, onError]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && !wallet.isConnected && !wallet.isConnecting) {
      handleConnect();
    }
  }, [autoConnect, handleConnect, wallet.isConnected, wallet.isConnecting]);

  // Handle wallet disconnection
  const handleDisconnect = useCallback(async () => {
    try {
      logger.info("WalletManager: Initiating disconnection");
      await wallet.disconnect();
      onDisconnect?.();
      toast.success("Wallet disconnected");
      logger.info("WalletManager: Wallet disconnected");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to disconnect wallet";
      onError?.(errorMessage);
      toast.error(`Disconnection failed: ${errorMessage}`);
      logger.error("WalletManager: Disconnection failed", {
        error: errorMessage,
      });
    }
  }, [wallet, onDisconnect, onError]);

  // Handle balance refresh
  const handleRefreshBalance = useCallback(async () => {
    if (!wallet.isConnected) return;

    try {
      setIsRefreshingBalance(true);
      await wallet.getBalance();
      setLastBalanceUpdate(new Date());
      toast.success("Balance updated");
      logger.info("WalletManager: Balance refreshed");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to refresh balance";
      toast.error(`Failed to refresh balance: ${errorMessage}`);
      logger.error("WalletManager: Balance refresh failed", {
        error: errorMessage,
      });
    } finally {
      setIsRefreshingBalance(false);
    }
  }, [wallet]);

  // Handle chain switching
  const handleSwitchChain = useCallback(
    async (chainId: number) => {
      try {
        await wallet.switchChain(chainId);
        toast.success(
          `Switched to ${SUPPORTED_CHAINS[chainId]?.name || "Unknown Chain"}`
        );
        logger.info("WalletManager: Chain switched", { chainId });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to switch chain";
        toast.error(`Chain switch failed: ${errorMessage}`);
        logger.error("WalletManager: Chain switch failed", {
          error: errorMessage,
          chainId,
        });
      }
    },
    [wallet]
  );

  // Copy address to clipboard
  const handleCopyAddress = useCallback(async () => {
    if (!wallet.address) return;

    try {
      await navigator.clipboard.writeText(wallet.address);
      toast.success("Address copied to clipboard");
    } catch {
      toast.error("Failed to copy address");
    }
  }, [wallet]);

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format balance for display
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return "0";
    if (num < 0.0001) return "< 0.0001";
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    });
  };

  // Get current chain info
  const currentChain = SUPPORTED_CHAINS[wallet.chainId];

  // Render connection status
  const renderConnectionStatus = () => {
    if (wallet.isConnecting) {
      return (
        <div className="flex items-center space-x-2 text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Connecting...</span>
        </div>
      );
    }

    if (wallet.isConnected) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Connected</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Wallet className="w-4 h-4" />
        <span className="text-sm">Not Connected</span>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="w-5 h-5" />
            <span>WLD Wallet</span>
          </div>
          {renderConnectionStatus()}
        </CardTitle>
        <CardDescription>
          Connect your World App wallet to participate in the lottery
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Display */}
        {wallet.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{wallet.error}</AlertDescription>
          </Alert>
        )}

        {/* Connection Section */}
        {!wallet.isConnected ? (
          <div className="space-y-4">
            <Button
              onClick={handleConnect}
              disabled={wallet.isConnecting}
              className="w-full"
              size="lg"
            >
              {wallet.isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </>
              )}
            </Button>

            <div className="text-sm text-gray-600 space-y-1">
              <p>• Connect your World App wallet</p>
              <p>• Access WLD tokens and lottery features</p>
              <p>• Secure authentication with World ID</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Address Display */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-mono text-sm">
                    {formatAddress(wallet.address!)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAddress}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  {currentChain?.blockExplorer && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `${currentChain.blockExplorer}/address/${wallet.address}`,
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Balance Display */}
            {showBalance && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">WLD Balance</p>
                    <p className="text-lg font-semibold">
                      {formatBalance(wallet.balance)} WLD
                    </p>
                    {lastBalanceUpdate && (
                      <p className="text-xs text-gray-500">
                        Updated {lastBalanceUpdate.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshBalance}
                    disabled={isRefreshingBalance}
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${
                        isRefreshingBalance ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                </div>
              </div>
            )}

            {/* Chain Information */}
            {showChainInfo && currentChain && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Network:</span>
                  <Badge variant="outline">{currentChain.name}</Badge>
                </div>

                {/* Chain Switcher */}
                <div className="flex space-x-1">
                  {Object.values(SUPPORTED_CHAINS).map((chain) => (
                    <Button
                      key={chain.id}
                      variant={
                        wallet.chainId === chain.id ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleSwitchChain(chain.id)}
                      disabled={wallet.chainId === chain.id}
                    >
                      {chain.name.split(" ")[0]}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Disconnect Button */}
            <Button
              variant="outline"
              onClick={handleDisconnect}
              className="w-full"
            >
              Disconnect Wallet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default WalletManager;
