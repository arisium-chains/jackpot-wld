/**
 * Payment Manager Component
 * Optimized for WLD token transactions and lottery operations
 */

"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send,
  Download,
  Upload,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Clock,
  TrendingUp,
  Coins,
} from "lucide-react";
import {
  usePayment,
  useWallet,
  useWorldID,
} from "../../providers/miniapp-provider";
import { PaymentTransaction } from "../../types/miniapp";
import { logger } from "../../lib/logger";
import { toast } from "sonner";

/**
 * Payment Manager Props
 */
interface PaymentManagerProps {
  className?: string;
  defaultTab?: "send" | "deposit" | "withdraw" | "history";
  maxAmount?: string;
  minAmount?: string;
  showHistory?: boolean;
  onPaymentSuccess?: (transaction: PaymentTransaction) => void;
  onPaymentError?: (error: string) => void;
}

/**
 * Transaction Status Badge
 */
function TransactionStatusBadge({
  status,
}: {
  status: PaymentTransaction["status"];
}) {
  const statusConfig = {
    pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
    confirmed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    failed: { color: "bg-red-100 text-red-800", icon: AlertTriangle },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={config.color}>
      <Icon className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

/**
 * Amount Input Component
 */
interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  max?: string;
  disabled?: boolean;
  error?: string;
}

function AmountInput({
  value,
  onChange,
  label,
  placeholder = "0.0",
  max,
  disabled = false,
  error,
}: AmountInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow empty string
    if (inputValue === "") {
      onChange("");
      return;
    }

    // Only allow valid decimal numbers
    const regex = /^\d*\.?\d*$/;
    if (regex.test(inputValue)) {
      onChange(inputValue);
    }
  };

  const handleMaxClick = () => {
    if (max) {
      onChange(max);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={label.toLowerCase().replace(" ", "-")}>{label}</Label>
      <div className="relative">
        <Input
          id={label.toLowerCase().replace(" ", "-")}
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={error ? "border-red-500" : ""}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
          <span className="text-sm text-gray-500">WLD</span>
          {max && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMaxClick}
              disabled={disabled}
              className="h-auto p-1 text-xs"
            >
              MAX
            </Button>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

/**
 * Payment Manager Component
 */
export function PaymentManager({
  className = "",
  defaultTab = "deposit",
  maxAmount,
  minAmount = "0.001",
  showHistory = true,
  onPaymentSuccess,
  onPaymentError,
}: PaymentManagerProps) {
  // Hooks
  const payment = usePayment();
  const wallet = useWallet();
  const worldId = useWorldID();

  // Local state
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [sendAmount, setSendAmount] = useState("");
  const [sendAddress, setSendAddress] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Clear errors when switching tabs
  useEffect(() => {
    setErrors({});
  }, [activeTab]);

  // Validation
  const validateAmount = useCallback(
    (amount: string, field: string) => {
      if (!amount || amount === "0") {
        return `${field} amount is required`;
      }

      const numAmount = parseFloat(amount);
      const minNum = parseFloat(minAmount);
      const maxNum = maxAmount
        ? parseFloat(maxAmount)
        : parseFloat(wallet.balance);

      if (isNaN(numAmount)) {
        return "Invalid amount";
      }

      if (numAmount < minNum) {
        return `Minimum amount is ${minAmount} WLD`;
      }

      if (numAmount > maxNum) {
        return `Insufficient balance. Maximum: ${maxNum} WLD`;
      }

      return null;
    },
    [minAmount, maxAmount, wallet.balance]
  );

  const validateAddress = useCallback((address: string) => {
    if (!address) {
      return "Recipient address is required";
    }

    if (!address.startsWith("0x") || address.length !== 42) {
      return "Invalid Ethereum address";
    }

    return null;
  }, []);

  // Handle send WLD
  const handleSend = useCallback(async () => {
    try {
      // Validation
      const amountError = validateAmount(sendAmount, "Send");
      const addressError = validateAddress(sendAddress);

      if (amountError || addressError) {
        setErrors({
          sendAmount: amountError || "",
          sendAddress: addressError || "",
        });
        return;
      }

      setErrors({});
      logger.info("PaymentManager: Initiating WLD send", {
        amount: sendAmount,
        to: sendAddress,
      });

      const transactionHash = await payment.sendWLD(sendAddress, sendAmount);

      const transaction: PaymentTransaction = {
        id: `send_${Date.now()}`,
        hash: transactionHash,
        from: wallet.address!,
        to: sendAddress,
        amount: sendAmount,
        token: "WLD",
        status: "pending",
        timestamp: new Date(),
        confirmations: 0,
        memo: `Send ${sendAmount} WLD`,
      };

      onPaymentSuccess?.(transaction);
      toast.success(`Sent ${sendAmount} WLD successfully!`);

      // Reset form
      setSendAmount("");
      setSendAddress("");

      logger.info("PaymentManager: WLD send completed", { transactionHash });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to send WLD";
      setErrors({ general: errorMessage });
      onPaymentError?.(errorMessage);
      toast.error(`Send failed: ${errorMessage}`);
      logger.error("PaymentManager: WLD send failed", { error: errorMessage });
    }
  }, [
    sendAmount,
    sendAddress,
    payment,
    wallet.address,
    onPaymentSuccess,
    onPaymentError,
    validateAmount,
    validateAddress,
    setErrors
  ]);

  // Handle deposit to lottery
  const handleDeposit = useCallback(async () => {
    try {
      // Validation
      const amountError = validateAmount(depositAmount, "Deposit");

      if (amountError) {
        setErrors({ depositAmount: amountError });
        return;
      }

      if (!worldId.isVerified) {
        setErrors({
          general: "World ID verification required for lottery participation",
        });
        toast.error("Please verify your World ID first");
        return;
      }

      setErrors({});
      logger.info("PaymentManager: Initiating lottery deposit", {
        amount: depositAmount,
      });

      const transactionHash = await payment.deposit(depositAmount);

      const transaction: PaymentTransaction = {
        id: `deposit_${Date.now()}`,
        hash: transactionHash,
        from: wallet.address!,
        to: process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS || "0x123...",
        amount: depositAmount,
        token: "WLD",
        status: "pending",
        timestamp: new Date(),
        confirmations: 0,
        memo: `Deposit ${depositAmount} WLD to lottery`,
      };

      onPaymentSuccess?.(transaction);
      toast.success(`Deposited ${depositAmount} WLD to lottery!`);

      // Reset form
      setDepositAmount("");

      logger.info("PaymentManager: Lottery deposit completed", {
        transactionHash,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to deposit to lottery";
      setErrors({ general: errorMessage });
      onPaymentError?.(errorMessage);
      toast.error(`Deposit failed: ${errorMessage}`);
      logger.error("PaymentManager: Lottery deposit failed", {
        error: errorMessage,
      });
    }
  }, [
    depositAmount,
    payment,
    wallet.address,
    worldId.isVerified,
    onPaymentSuccess,
    onPaymentError,
    validateAmount,
    setErrors,
    setDepositAmount
  ]);

  // Handle withdraw from lottery
  const handleWithdraw = useCallback(async () => {
    try {
      // Validation
      const amountError = validateAmount(withdrawAmount, "Withdraw");

      if (amountError) {
        setErrors({ withdrawAmount: amountError });
        return;
      }

      setErrors({});
      logger.info("PaymentManager: Initiating lottery withdrawal", {
        amount: withdrawAmount,
      });

      const transactionHash = await payment.withdraw(withdrawAmount);

      const transaction: PaymentTransaction = {
        id: `withdraw_${Date.now()}`,
        hash: transactionHash,
        from: process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS || "0x123...",
        to: wallet.address!,
        amount: withdrawAmount,
        token: "WLD",
        status: "pending",
        timestamp: new Date(),
        confirmations: 0,
        memo: `Withdraw ${withdrawAmount} WLD from lottery`,
      };

      onPaymentSuccess?.(transaction);
      toast.success(`Withdrew ${withdrawAmount} WLD from lottery!`);

      // Reset form
      setWithdrawAmount("");

      logger.info("PaymentManager: Lottery withdrawal completed", {
        transactionHash,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to withdraw from lottery";
      setErrors({ general: errorMessage });
      onPaymentError?.(errorMessage);
      toast.error(`Withdrawal failed: ${errorMessage}`);
      logger.error("PaymentManager: Lottery withdrawal failed", {
        error: errorMessage,
      });
    }
  }, [
    withdrawAmount,
    payment,
    wallet.address,
    onPaymentSuccess,
    onPaymentError,
    validateAmount,
    setErrors,
    setWithdrawAmount
  ]);

  // Format transaction display
  const formatTransaction = (tx: PaymentTransaction) => {
    const isOutgoing = tx.from.toLowerCase() === wallet.address?.toLowerCase();
    const displayAddress = isOutgoing ? tx.to : tx.from;
    const formattedAddress = `${displayAddress.slice(
      0,
      6
    )}...${displayAddress.slice(-4)}`;

    return {
      ...tx,
      displayAddress: formattedAddress,
      isOutgoing,
      displayAmount: `${isOutgoing ? "-" : "+"}${tx.amount} WLD`,
    };
  };

  // Check if operations are disabled
  const isDisabled = !wallet.isConnected || payment.isProcessing;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Coins className="w-5 h-5" />
          <span>WLD Payments</span>
        </CardTitle>
        <CardDescription>
          Send WLD tokens, deposit to lottery, or withdraw your funds
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* Error Display */}
        {errors.general && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{errors.general}</AlertDescription>
          </Alert>
        )}

        {/* Connection Check */}
        {!wallet.isConnected && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to use payment features
            </AlertDescription>
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "send" | "deposit" | "withdraw" | "history")
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="send" disabled={isDisabled}>
              <Send className="w-4 h-4 mr-1" />
              Send
            </TabsTrigger>
            <TabsTrigger value="deposit" disabled={isDisabled}>
              <Upload className="w-4 h-4 mr-1" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="withdraw" disabled={isDisabled}>
              <Download className="w-4 h-4 mr-1" />
              Withdraw
            </TabsTrigger>
            {showHistory && (
              <TabsTrigger value="history">
                <Clock className="w-4 h-4 mr-1" />
                History
              </TabsTrigger>
            )}
          </TabsList>

          {/* Send Tab */}
          <TabsContent value="send" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="send-address">Recipient Address</Label>
                <Input
                  id="send-address"
                  placeholder="0x..."
                  value={sendAddress}
                  onChange={(e) => setSendAddress(e.target.value)}
                  disabled={isDisabled}
                  className={errors.sendAddress ? "border-red-500" : ""}
                />
                {errors.sendAddress && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.sendAddress}
                  </p>
                )}
              </div>

              <AmountInput
                label="Amount"
                value={sendAmount}
                onChange={setSendAmount}
                max={wallet.balance}
                min={minAmount}
                disabled={isDisabled}
                error={errors.sendAmount}
              />

              <Button
                onClick={handleSend}
                disabled={isDisabled}
                className="w-full"
              >
                {payment.isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send WLD
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Deposit Tab */}
          <TabsContent value="deposit" className="space-y-4">
            <div className="space-y-4">
              {!worldId.isVerified && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    World ID verification required for lottery participation
                  </AlertDescription>
                </Alert>
              )}

              <AmountInput
                label="Deposit Amount"
                value={depositAmount}
                onChange={setDepositAmount}
                max={wallet.balance}
                min={minAmount}
                disabled={isDisabled || !worldId.isVerified}
                error={errors.depositAmount}
              />

              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">
                      Earn while you play
                    </p>
                    <p className="text-blue-700">
                      Your deposit earns yield and gives you lottery tickets
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleDeposit}
                disabled={isDisabled || !worldId.isVerified}
                className="w-full"
              >
                {payment.isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Depositing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Deposit to Lottery
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw" className="space-y-4">
            <div className="space-y-4">
              <AmountInput
                label="Withdraw Amount"
                value={withdrawAmount}
                onChange={setWithdrawAmount}
                min={minAmount}
                disabled={isDisabled}
                error={errors.withdrawAmount}
                placeholder="Amount to withdraw"
              />

              <div className="bg-amber-50 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900">
                      Withdrawal Notice
                    </p>
                    <p className="text-amber-700">
                      Withdrawing reduces your lottery eligibility
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={isDisabled}
                variant="outline"
                className="w-full"
              >
                {payment.isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Withdraw from Lottery
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* History Tab */}
          {showHistory && (
            <TabsContent value="history" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">Recent Transactions</h4>

                {payment.history.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {payment.history.map((tx) => {
                      const formatted = formatTransaction(tx);
                      return (
                        <div key={tx.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {formatted.isOutgoing ? (
                                <Send className="w-4 h-4 text-red-500" />
                              ) : (
                                <Download className="w-4 h-4 text-green-500" />
                              )}
                              <div>
                                <p className="font-medium text-sm">
                                  {formatted.displayAmount}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {formatted.isOutgoing ? "To" : "From"}{" "}
                                  {formatted.displayAddress}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <TransactionStatusBadge status={tx.status} />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  window.open(
                                    `https://etherscan.io/tx/${tx.hash}`,
                                    "_blank"
                                  )
                                }
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          {tx.memo && (
                            <p className="text-xs text-gray-500 mt-1">
                              {tx.memo}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default PaymentManager;
