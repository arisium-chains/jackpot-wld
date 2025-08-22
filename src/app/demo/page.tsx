/**
 * Enhanced Demo Experience
 * Showcasing simplified MiniApp SDK with lottery features
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Wallet,
  Shield,
  Send,
  Trophy,
  BarChart3,
  Zap,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Globe,
  Users,
  Coins,
  TrendingUp,
  Clock,
  Star,
} from "lucide-react";

// Import our simplified components
import WalletManager from "../../components/wallet/wallet-manager";
import WorldIDManager from "../../components/worldid/worldid-manager";
import PaymentManager from "../../components/payment/payment-manager";
import {
  useMiniApp,
  useWallet,
  useWorldID,
  usePayment,
  useLottery,
} from "../../providers/miniapp-provider";
import { logger } from "../../lib/logger";
import { toast } from "sonner";

/**
 * Demo Section Configuration
 */
interface DemoSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "available" | "demo" | "coming-soon";
  component?: React.ComponentType;
}

/**
 * Feature Showcase Card
 */
interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "working" | "demo" | "pending";
  onTest?: () => void;
}

function FeatureCard({
  title,
  description,
  icon: Icon,
  status,
  onTest,
}: FeatureCardProps) {
  const statusConfig = {
    working: { color: "bg-green-100 text-green-800", text: "Working" },
    demo: { color: "bg-blue-100 text-blue-800", text: "Demo" },
    pending: { color: "bg-yellow-100 text-yellow-800", text: "Pending" },
  };

  const config = statusConfig[status];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge className={config.color}>{config.text}</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {onTest && (
        <CardContent className="pt-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onTest}
            disabled={status === "pending"}
          >
            {status === "demo" ? "Try Demo" : "Test Feature"}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * SDK Status Display
 */
function SDKStatusDisplay() {
  const { state, isReady } = useMiniApp();
  const wallet = useWallet();
  const worldId = useWorldID();
  const payment = usePayment();

  const statusItems = [
    {
      label: "SDK Ready",
      status: isReady ? "success" : "pending",
      description: isReady ? "MiniApp SDK initialized" : "Initializing SDK...",
    },
    {
      label: "World App",
      status: state.isWorldApp ? "success" : "warning",
      description: state.isWorldApp
        ? "Running in World App"
        : "Development mode",
    },
    {
      label: "Wallet",
      status: wallet.isConnected ? "success" : "pending",
      description: wallet.isConnected
        ? `Connected: ${wallet.address?.slice(0, 8)}...`
        : "Not connected",
    },
    {
      label: "World ID",
      status: worldId.isVerified ? "success" : "pending",
      description: worldId.isVerified
        ? `Verified (${worldId.verificationLevel})`
        : "Not verified",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5" />
          <span>SDK Status</span>
        </CardTitle>
        <CardDescription>
          Current status of MiniApp SDK components
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {statusItems.map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    item.status === "success"
                      ? "bg-green-500"
                      : item.status === "warning"
                      ? "bg-yellow-500"
                      : "bg-gray-400"
                  }`}
                />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              <p className="text-xs text-gray-600 ml-4">{item.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Live Demo Stats
 */
function LiveDemoStats() {
  const [stats, setStats] = useState({
    totalUsers: 1247,
    totalDeposits: "45,678.90",
    currentPrize: "2,284.45",
    nextDraw: "2h 34m",
  });

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        totalUsers: prev.totalUsers + Math.floor(Math.random() * 3),
        totalDeposits: (
          parseFloat(prev.totalDeposits.replace(",", "")) +
          Math.random() * 10
        ).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">
            {stats.totalUsers.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Total Users</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Coins className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.totalDeposits}</p>
          <p className="text-sm text-gray-600">Total Deposits (WLD)</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.currentPrize}</p>
          <p className="text-sm text-gray-600">Current Prize (WLD)</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{stats.nextDraw}</p>
          <p className="text-sm text-gray-600">Next Draw</p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Interactive Demo Flow
 */
function InteractiveDemoFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const wallet = useWallet();
  const worldId = useWorldID();
  const payment = usePayment();

  const demoSteps = [
    {
      id: 0,
      title: "Connect Wallet",
      description: "Connect your World App wallet to begin",
      icon: Wallet,
      completed: wallet.isConnected,
      action: () => wallet.connect(),
    },
    {
      id: 1,
      title: "Verify Identity",
      description: "Verify your World ID for lottery eligibility",
      icon: Shield,
      completed: worldId.isVerified,
      action: () => worldId.verify("demo-verification"),
    },
    {
      id: 2,
      title: "Make Deposit",
      description: "Deposit WLD tokens to participate",
      icon: Send,
      completed: false, // Would check user's lottery balance
      action: () => setCurrentStep(3), // Navigate to payment section
    },
    {
      id: 3,
      title: "Enter Lottery",
      description: "You're now eligible for prize draws!",
      icon: Trophy,
      completed: false,
      action: () =>
        toast.success("Demo completed! You're ready to win prizes!"),
    },
  ];

  const handleStepAction = async (step: (typeof demoSteps)[0]) => {
    try {
      if (step.action) {
        await step.action();
        if (!completedSteps.includes(step.id)) {
          setCompletedSteps((prev) => [...prev, step.id]);
        }
        if (step.id < demoSteps.length - 1) {
          setCurrentStep(step.id + 1);
        }
      }
    } catch (error) {
      toast.error(
        `Step failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Play className="w-5 h-5" />
          <span>Interactive Demo Flow</span>
        </CardTitle>
        <CardDescription>
          Complete these steps to experience the full lottery flow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {demoSteps.map((step, index) => {
            const isActive = currentStep === index;
            const isCompleted =
              step.completed || completedSteps.includes(step.id);
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-center space-x-4 p-4 rounded-lg border-2 transition-all ${
                  isActive
                    ? "border-blue-500 bg-blue-50"
                    : isCompleted
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-blue-500 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1">
                  <h4 className="font-medium">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>

                {isActive && !isCompleted && (
                  <Button onClick={() => handleStepAction(step)} size="sm">
                    {step.id === 2 ? "Go to Payments" : "Complete"}
                  </Button>
                )}

                {isCompleted && (
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800"
                  >
                    Completed
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main Enhanced Demo Component
 */
export default function EnhancedDemo() {
  const [activeTab, setActiveTab] = useState("overview");
  const { state, isReady } = useMiniApp();

  // Feature cards configuration
  const features = [
    {
      title: "Wallet Integration",
      description: "Seamless WLD wallet connection and management",
      icon: Wallet,
      status: "working" as const,
      onTest: () => setActiveTab("wallet"),
    },
    {
      title: "World ID Verification",
      description: "Human verification for lottery eligibility",
      icon: Shield,
      status: "working" as const,
      onTest: () => setActiveTab("worldid"),
    },
    {
      title: "WLD Payments",
      description: "Send, deposit, and withdraw WLD tokens",
      icon: Send,
      status: "working" as const,
      onTest: () => setActiveTab("payments"),
    },
    {
      title: "Lottery System",
      description: "No-loss lottery with yield generation",
      icon: Trophy,
      status: "demo" as const,
      onTest: () => setActiveTab("lottery"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎰 MiniApp SDK Demo
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Simplified SDK for WLD Wallet Integration
          </p>
          <p className="text-gray-500">
            Experience seamless lottery participation with World ID verification
          </p>
        </div>

        {/* SDK Status Banner */}
        {!isReady && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              SDK is initializing... Some features may not be available yet.
            </AlertDescription>
          </Alert>
        )}

        {/* Live Stats */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Live Demo Statistics</h2>
          <LiveDemoStats />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
            <TabsTrigger value="worldid">World ID</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="lottery">Lottery</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* SDK Status */}
              <SDKStatusDisplay />

              {/* Interactive Demo Flow */}
              <InteractiveDemoFlow />
            </div>

            {/* Features Grid */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Available Features</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {features.map((feature) => (
                  <FeatureCard key={feature.title} {...feature} />
                ))}
              </div>
            </div>

            {/* Technology Stack */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Technology Stack</span>
                </CardTitle>
                <CardDescription>
                  Built with modern, optimized technologies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Frontend</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Next.js 15 with App Router</li>
                      <li>• TypeScript for type safety</li>
                      <li>• Tailwind CSS for styling</li>
                      <li>• Shadcn/UI components</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">MiniApp SDK</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• @worldcoin/minikit-js</li>
                      <li>• @worldcoin/idkit</li>
                      <li>• Simplified architecture</li>
                      <li>• React Context state</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Blockchain</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Viem & Wagmi</li>
                      <li>• World Chain support</li>
                      <li>• WLD token integration</li>
                      <li>• Smart contract lottery</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <WalletManager
                showBalance={true}
                showChainInfo={true}
                autoConnect={false}
                onConnect={(address) => {
                  toast.success(`Wallet connected: ${address.slice(0, 8)}...`);
                  logger.info("Demo: Wallet connected", { address });
                }}
                onDisconnect={() => {
                  toast.info("Wallet disconnected");
                  logger.info("Demo: Wallet disconnected");
                }}
                onError={(error) => {
                  toast.error(`Wallet error: ${error}`);
                  logger.error("Demo: Wallet error", { error });
                }}
              />
            </div>
          </TabsContent>

          {/* World ID Tab */}
          <TabsContent value="worldid" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <WorldIDManager
                action="demo-verification"
                signal="demo-signal"
                autoVerify={false}
                showHistory={true}
                onVerified={(proof) => {
                  toast.success("World ID verification successful!");
                  logger.info("Demo: World ID verified", {
                    proof: proof.nullifier_hash,
                  });
                }}
                onError={(error) => {
                  toast.error(`Verification error: ${error}`);
                  logger.error("Demo: World ID error", { error });
                }}
                onReset={() => {
                  toast.info("World ID verification reset");
                  logger.info("Demo: World ID reset");
                }}
              />
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <PaymentManager
                defaultTab="deposit"
                showHistory={true}
                minAmount="0.001"
                onPaymentSuccess={(transaction) => {
                  toast.success(
                    `Payment successful: ${transaction.hash.slice(0, 10)}...`
                  );
                  logger.info("Demo: Payment successful", { transaction });
                }}
                onPaymentError={(error) => {
                  toast.error(`Payment failed: ${error}`);
                  logger.error("Demo: Payment error", { error });
                }}
              />
            </div>
          </TabsContent>

          {/* Lottery Tab */}
          <TabsContent value="lottery" className="space-y-6">
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Lottery Demo</h3>
              <p className="text-gray-600 mb-6">
                The lottery system integrates with all the components above.
                <br />
                Complete the wallet and World ID verification to participate!
              </p>
              <div className="space-y-4 max-w-md mx-auto">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <h4 className="font-semibold mb-1">No-Loss Lottery</h4>
                    <p className="text-sm text-gray-600">
                      Keep your deposits, win from yield
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <h4 className="font-semibold mb-1">Yield Generation</h4>
                    <p className="text-sm text-gray-600">
                      Earn returns while participating
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Globe className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <h4 className="font-semibold mb-1">Fair & Transparent</h4>
                    <p className="text-sm text-gray-600">
                      World ID ensures one person, one entry
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
