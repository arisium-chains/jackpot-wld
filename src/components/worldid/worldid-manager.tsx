/**
 * Simplified World ID Manager Component
 * Streamlined verification process for lottery eligibility
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  IDKitWidget,
  VerificationLevel,
  ISuccessResult,
} from "@worldcoin/idkit";
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
  Shield,
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  User,
  Eye,
} from "lucide-react";
import { useWorldID, useWallet } from "../../providers/miniapp-provider";
import { logger } from "../../lib/logger";
import { toast } from "sonner";

/**
 * World ID Manager Props
 */
interface WorldIDManagerProps {
  className?: string;
  action?: string;
  signal?: string;
  autoVerify?: boolean;
  requiredLevel?: VerificationLevel;
  onVerified?: (proof: ISuccessResult) => void;
  onError?: (error: string) => void;
  onReset?: () => void;
  showHistory?: boolean;
}

/**
 * Verification Status Display
 */
interface VerificationStatusProps {
  isVerified: boolean;
  isVerifying: boolean;
  verificationLevel?: "orb" | "device" | null;
  error?: string | null;
}

/**
 * Verification History Item
 */
interface VerificationHistoryItem {
  timestamp: Date;
  action: string;
  level: "orb" | "device";
  success: boolean;
  error?: string;
}

/**
 * Verification Status Component
 */
function VerificationStatus({
  isVerified,
  isVerifying,
  verificationLevel,
  error,
}: VerificationStatusProps) {
  if (isVerifying) {
    return (
      <div className="flex items-center space-x-2 text-blue-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Verifying...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-red-600">
        <AlertTriangle className="w-4 h-4" />
        <span className="text-sm">Verification Failed</span>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">Verified</span>
        {verificationLevel && (
          <Badge variant="outline" className="text-xs">
            {verificationLevel === "orb" ? (
              <>
                <Eye className="w-3 h-3 mr-1" />
                Orb
              </>
            ) : (
              <>
                <User className="w-3 h-3 mr-1" />
                Device
              </>
            )}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-gray-500">
      <Shield className="w-4 h-4" />
      <span className="text-sm">Not Verified</span>
    </div>
  );
}

/**
 * Simplified World ID Manager Component
 */
export function WorldIDManager({
  className = "",
  action = "verify-lottery-eligibility",
  signal = "",
  autoVerify = false,
  requiredLevel = VerificationLevel.Orb,
  onVerified,
  onError,
  onReset,
  showHistory = false,
}: WorldIDManagerProps) {
  // Hooks
  const worldId = useWorldID();
  const wallet = useWallet();

  // Local state
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<
    VerificationHistoryItem[]
  >([]);

  // Load verification history from localStorage
  useEffect(() => {
    if (showHistory) {
      const savedHistory = localStorage.getItem("worldid-verification-history");
      if (savedHistory) {
        try {
          const history = JSON.parse(savedHistory);
          setVerificationHistory(history);
        } catch (error) {
          logger.error("Failed to load verification history", { error: error instanceof Error ? error.message : String(error) });
        }
      }
    }
  }, [showHistory]);

  // Save verification to history
  const saveToHistory = useCallback(
    (item: VerificationHistoryItem) => {
      if (!showHistory) return;

      const newHistory = [item, ...verificationHistory.slice(0, 9)]; // Keep last 10
      setVerificationHistory(newHistory);
      localStorage.setItem(
        "worldid-verification-history",
        JSON.stringify(newHistory)
      );
    },
    [showHistory, verificationHistory]
  );

  // Auto-verify if wallet is connected and verification is not done
  useEffect(() => {
    if (
      autoVerify &&
      wallet.isConnected &&
      !worldId.isVerified &&
      !worldId.isVerifying
    ) {
      handleVerify();
    }
  }, [autoVerify, wallet.isConnected, worldId.isVerified, worldId.isVerifying]);

  // Handle verification success
  const handleVerificationSuccess = useCallback(
    async (proof: ISuccessResult) => {
      try {
        logger.info("World ID verification started", {
          action,
          proof: proof.nullifier_hash,
        });

        // Call the API to verify the proof
        const response = await fetch("/api/worldid/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proof,
            action,
            signal,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Verification failed");
        }

        // Update SDK state
        await worldId.verify(action, signal);

        // Save to history
        saveToHistory({
          timestamp: new Date(),
          action,
          level: proof.verification_level as "orb" | "device",
          success: true,
        });

        onVerified?.(proof);
        toast.success("World ID verified successfully!");
        logger.info("World ID verification completed", {
          action,
          level: proof.verification_level,
          nullifier: proof.nullifier_hash,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Verification failed";

        // Save error to history
        saveToHistory({
          timestamp: new Date(),
          action,
          level: "device", // Default for failed attempts
          success: false,
          error: errorMessage,
        });

        onError?.(errorMessage);
        toast.error(`Verification failed: ${errorMessage}`);
        logger.error("World ID verification failed", {
          error: errorMessage,
          action,
        });
      } finally {
        setIsWidgetOpen(false);
      }
    },
    [action, signal, worldId.verify, onVerified, onError, saveToHistory]
  );

  // Handle verification error
  const handleVerificationError = useCallback(
    (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Verification failed";

      saveToHistory({
        timestamp: new Date(),
        action,
        level: "device",
        success: false,
        error: errorMessage,
      });

      onError?.(errorMessage);
      toast.error(`Verification failed: ${errorMessage}`);
      logger.error("World ID verification error", {
        error: errorMessage,
        action,
      });
      setIsWidgetOpen(false);
    },
    [action, onError, saveToHistory]
  );

  // Handle manual verification trigger
  const handleVerify = useCallback(() => {
    if (!wallet.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (worldId.isVerified) {
      toast.info("Already verified");
      return;
    }

    setIsWidgetOpen(true);
    logger.info("World ID verification initiated", { action });
  }, [wallet.isConnected, worldId.isVerified, action]);

  // Handle reset verification
  const handleReset = useCallback(() => {
    worldId.reset();
    onReset?.();
    toast.success("Verification reset");
    logger.info("World ID verification reset");
  }, [worldId.reset, onReset]);

  // Get verification requirements text
  const getRequirementText = () => {
    switch (requiredLevel) {
      case VerificationLevel.Orb:
        return "Orb verification required for maximum security";
      case VerificationLevel.Device:
        return "Device verification sufficient";
      default:
        return "Human verification required";
    }
  };

  // Format timestamp for history
  const formatTimestamp = (date: Date) => {
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>World ID Verification</span>
            </div>
            <VerificationStatus
              isVerified={worldId.isVerified}
              isVerifying={worldId.isVerifying}
              verificationLevel={worldId.verificationLevel}
              error={worldId.error}
            />
          </CardTitle>
          <CardDescription>
            Verify your humanity to participate in the lottery
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Display */}
          {worldId.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{worldId.error}</AlertDescription>
            </Alert>
          )}

          {/* Verification Status Section */}
          {!worldId.isVerified ? (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">
                      Human Verification Required
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Verify you're a real person to ensure fair lottery
                      participation
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      {getRequirementText()}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleVerify}
                disabled={!wallet.isConnected || worldId.isVerifying}
                className="w-full"
                size="lg"
              >
                {worldId.isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Verify with World ID
                  </>
                )}
              </Button>

              {!wallet.isConnected && (
                <p className="text-sm text-gray-600 text-center">
                  Connect your wallet first to proceed with verification
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Verified Status */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-green-900">
                        Verification Complete
                      </h4>
                      <p className="text-sm text-green-700">
                        You're verified and eligible for lottery participation
                      </p>
                    </div>
                  </div>
                  {worldId.verificationLevel && (
                    <Badge
                      variant="outline"
                      className="text-green-700 border-green-300"
                    >
                      {worldId.verificationLevel === "orb" ? (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          Orb Verified
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 mr-1" />
                          Device Verified
                        </>
                      )}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Reset Option */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Need to verify again?
                </span>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          )}

          {/* Verification History */}
          {showHistory && verificationHistory.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Verification History
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {verificationHistory.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      {item.success ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                      )}
                      <span className="text-gray-600">
                        {formatTimestamp(item.timestamp)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {item.level}
                      </Badge>
                    </div>
                    {item.error && (
                      <span
                        className="text-red-600 text-xs truncate max-w-24"
                        title={item.error}
                      >
                        {item.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* IDKit Widget */}
      {isWidgetOpen && (
        <IDKitWidget
          app_id={(process.env.NEXT_PUBLIC_WORLD_APP_ID || 'app_staging_test') as `app_${string}`}
          action={action}
          signal={signal}
          onSuccess={handleVerificationSuccess}
          onError={handleVerificationError}
          verification_level={requiredLevel}
        />
      )}
    </>
  );
}

export default WorldIDManager;
