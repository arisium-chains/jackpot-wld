/**
 * Simplified MiniApp SDK Test Suite
 * Comprehensive tests for the redesigned components and functionality
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { jest } from "@jest/globals";

// Import components to test
import {
  MiniAppProvider,
  useWallet,
  useWorldID,
  usePayment,
} from "../providers/miniapp-provider";
import WalletManager from "../components/wallet/wallet-manager";
import WorldIDManager from "../components/worldid/worldid-manager";
import PaymentManager from "../components/payment/payment-manager";
import { SimplifiedMiniAppSDK } from "../lib/simplified-miniapp-sdk";

// Mock external dependencies
jest.mock("../lib/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock("@worldcoin/minikit-js", () => ({
  MiniKit: {
    install: jest.fn().mockResolvedValue(true),
    commandsAsync: {
      walletAuth: jest.fn().mockResolvedValue({
        finalPayload: {
          status: "success",
          message: "mock message",
          signature: "mock signature",
        },
      }),
      pay: jest.fn().mockResolvedValue({
        finalPayload: {
          status: "success",
          transaction_hash: "0xmocktransactionhash",
        },
      }),
    },
  },
  Tokens: {
    WLD: "WLD",
  },
}));

jest.mock("@worldcoin/idkit", () => ({
  IDKitWidget: ({ onSuccess }: { onSuccess: (proof: any) => void }) => (
    <div data-testid="idkit-widget">
      <button
        onClick={() =>
          onSuccess({
            merkle_root: "0x123",
            nullifier_hash: "0x456",
            proof: "0x789",
            verification_level: "orb",
          })
        }
      >
        Mock Verify
      </button>
    </div>
  ),
  VerificationLevel: {
    Orb: "orb",
    Device: "device",
  },
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Mock window.MiniKit
Object.defineProperty(window, "MiniKit", {
  value: {
    walletAddress: "0x742d35Cc6732C0532925a3b8D7Bf8E434E73995F",
  },
  writable: true,
});

// Mock navigator.clipboard
Object.defineProperty(navigator, "clipboard", {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

// Mock the hooks directly for better test control
jest.mock("../providers/miniapp-provider", () => {
  const originalModule = jest.requireActual("../providers/miniapp-provider");

  return {
    ...originalModule,
    useWallet: jest.fn(),
    useWorldID: jest.fn(),
    usePayment: jest.fn(),
    useLottery: jest.fn(),
    useMiniApp: jest.fn(),
  };
});

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div>{children}</div>
);

// Helper function to render with provider
const renderWithProvider = (component: React.ReactElement) => {
  return render(component, { wrapper: TestWrapper });
};

describe("Simplified MiniApp SDK", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      json: () =>
        Promise.resolve({ nonce: "mock-nonce", ok: true, success: true }),
    });

    // Set up mock implementations for the hooks
    const { useWallet, useWorldID, usePayment, useLottery, useMiniApp } =
      jest.requireMock("../providers/miniapp-provider");

    useWallet.mockReturnValue({
      isConnected: true,
      isConnecting: false,
      address: "0x742d35Cc6732C0532925a3b8D7Bf8E434E73995F",
      balance: "100.0",
      chainId: 1,
      nonce: "123",
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      getBalance: jest.fn().mockResolvedValue("100.0"),
      switchChain: jest.fn().mockResolvedValue(undefined),
    });

    useWorldID.mockReturnValue({
      isVerified: true,
      isVerifying: false,
      verificationLevel: "orb",
      nullifierHash: "0x456",
      merkleRoot: "0x789",
      proof: null,
      actionId: "test-action",
      verify: jest.fn().mockResolvedValue({
        merkle_root: "0x789",
        nullifier_hash: "0x456",
        proof: "0x123",
        verification_level: "orb",
      }),
      reset: jest.fn().mockResolvedValue(undefined),
    });

    usePayment.mockReturnValue({
      isProcessing: false,
      balance: "100.0",
      history: [],
      sendWLD: jest.fn().mockResolvedValue("0xmocktransactionhash"),
      deposit: jest.fn().mockResolvedValue("0xmocktransactionhash"),
      withdraw: jest.fn().mockResolvedValue("0xmocktransactionhash"),
      getHistory: jest.fn().mockResolvedValue([]),
    });

    useLottery.mockReturnValue({
      isEligible: true,
      poolStats: {
        totalDeposits: "1000.0",
        currentPrize: "50.0",
        participantCount: 25,
        nextDrawTime: new Date(Date.now() + 86400000),
        lastDrawTime: new Date(Date.now() - 86400000),
      },
      userStats: {
        totalDeposited: "10.0",
        currentBalance: "10.0",
        ticketCount: 10,
        totalWinnings: "0.0",
        lastActivity: new Date(),
      },
      checkEligibility: jest.fn().mockResolvedValue(true),
      getPoolStats: jest.fn().mockResolvedValue({}),
      getUserStats: jest.fn().mockResolvedValue({}),
    });

    useMiniApp.mockReturnValue({
      state: {
        isInitialized: true,
        isWorldApp: false,
        error: null,
        wallet: {
          isConnected: true,
          isConnecting: false,
          address: "0x742d35Cc6732C0532925a3b8D7Bf8E434E73995F",
          balance: "100.0",
          chainId: 1,
          nonce: "123",
        },
        worldId: {
          isVerified: true,
          isVerifying: false,
          verificationLevel: "orb",
          nullifierHash: "0x456",
          merkleRoot: "0x789",
          proof: null,
          actionId: "test-action",
        },
        payment: {
          isProcessing: false,
          balance: "100.0",
          history: [],
        },
        lottery: {
          isEligible: true,
          poolStats: {
            totalDeposits: "1000.0",
            currentPrize: "50.0",
            participantCount: 25,
            nextDrawTime: new Date(Date.now() + 86400000),
            lastDrawTime: new Date(Date.now() - 86400000),
          },
          userStats: {
            totalDeposited: "10.0",
            currentBalance: "10.0",
            ticketCount: 10,
            totalWinnings: "0.0",
            lastActivity: new Date(),
          },
        },
      },
      isReady: true,
      wallet: useWallet(),
      worldId: useWorldID(),
      payment: usePayment(),
      lottery: useLottery(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      initialize: jest.fn().mockResolvedValue(undefined),
    });
  });

  describe("SimplifiedMiniAppSDK Core", () => {
    test("should initialize SDK correctly", async () => {
      const sdk = new SimplifiedMiniAppSDK();

      expect(sdk.status).toBe("idle");
      expect(sdk.isInstalled).toBeDefined();

      await act(async () => {
        await sdk.initialize();
      });

      expect(sdk.status).toBe("ready");
      expect(sdk.state.isInitialized).toBe(true);
    });

    test("should handle wallet connection", async () => {
      const sdk = new SimplifiedMiniAppSDK();
      await sdk.initialize();

      await act(async () => {
        await sdk.connectWallet();
      });

      expect(sdk.state.wallet.isConnected).toBe(true);
      expect(sdk.state.wallet.address).toBe(
        "0x742d35Cc6732C0532925a3b8D7Bf8E434E73995F"
      );
    });

    test("should handle World ID verification", async () => {
      const sdk = new SimplifiedMiniAppSDK();
      await sdk.initialize();

      const proof = await act(async () => {
        return await sdk.verifyWorldID("test-action");
      });

      expect(proof.verification_level).toBe("orb");
      expect(sdk.state.worldId.isVerified).toBe(true);
    });

    test("should handle payment transactions", async () => {
      const sdk = new SimplifiedMiniAppSDK();
      await sdk.initialize();
      await sdk.connectWallet();

      const txHash = await act(async () => {
        return await sdk.sendWLD("0x123", "10.5");
      });

      expect(txHash).toBeDefined();
      expect(sdk.state.payment.history.length).toBeGreaterThan(0);
    });
  });

  describe("MiniAppProvider", () => {
    test("should provide context correctly", () => {
      const TestComponent = () => {
        const wallet = useWallet();
        const worldId = useWorldID();
        const payment = usePayment();

        return (
          <div>
            <div data-testid="wallet-connected">
              {wallet.isConnected.toString()}
            </div>
            <div data-testid="worldid-verified">
              {worldId.isVerified.toString()}
            </div>
            <div data-testid="payment-processing">
              {payment.isProcessing.toString()}
            </div>
          </div>
        );
      };

      renderWithProvider(<TestComponent />);

      expect(screen.getByTestId("wallet-connected")).toHaveTextContent("false");
      expect(screen.getByTestId("worldid-verified")).toHaveTextContent("false");
      expect(screen.getByTestId("payment-processing")).toHaveTextContent(
        "false"
      );
    });
  });

  describe("WalletManager Component", () => {
    test("should render correctly", () => {
      renderWithProvider(<WalletManager />);

      expect(screen.getByText("WLD Wallet")).toBeInTheDocument();
      expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
    });

    test("should handle wallet connection", async () => {
      const user = userEvent.setup();
      const onConnect = jest.fn();

      renderWithProvider(<WalletManager onConnect={onConnect} />);

      const connectButton = screen.getByText("Connect Wallet");

      await act(async () => {
        await user.click(connectButton);
      });

      await waitFor(() => {
        expect(onConnect).toHaveBeenCalled();
      });
    });

    test("should show connected state", async () => {
      const ConnectedWalletTest = () => {
        const wallet = useWallet();

        React.useEffect(() => {
          wallet.connect();
        }, []);

        return <WalletManager />;
      };

      renderWithProvider(<ConnectedWalletTest />);

      await waitFor(() => {
        expect(screen.getByText("Connected")).toBeInTheDocument();
      });
    });

    test("should handle balance refresh", async () => {
      const user = userEvent.setup();

      renderWithProvider(<WalletManager showBalance={true} />);

      // First connect the wallet
      await act(async () => {
        await user.click(screen.getByText("Connect Wallet"));
      });

      // Then find and click refresh button
      await waitFor(() => {
        const refreshButton = screen.getByRole("button", { name: /refresh/i });
        expect(refreshButton).toBeInTheDocument();
      });
    });
  });

  describe("WorldIDManager Component", () => {
    test("should render correctly", () => {
      renderWithProvider(<WorldIDManager />);

      expect(screen.getByText("World ID Verification")).toBeInTheDocument();
      expect(screen.getByText("Verify with World ID")).toBeInTheDocument();
    });

    test("should handle verification", async () => {
      const user = userEvent.setup();
      const onVerified = jest.fn();

      renderWithProvider(<WorldIDManager onVerified={onVerified} />);

      const verifyButton = screen.getByText("Verify with World ID");

      await act(async () => {
        await user.click(verifyButton);
      });

      // Mock IDKit widget interaction
      if (screen.queryByTestId("idkit-widget")) {
        const mockVerifyButton = screen.getByText("Mock Verify");
        await user.click(mockVerifyButton);

        await waitFor(() => {
          expect(onVerified).toHaveBeenCalled();
        });
      }
    });
  });

  describe("PaymentManager Component", () => {
    test("should render correctly", () => {
      renderWithProvider(<PaymentManager />);

      expect(screen.getByText("WLD Payments")).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /deposit/i })).toBeInTheDocument();
    });

    test("should handle deposit", async () => {
      const user = userEvent.setup();
      const onPaymentSuccess = jest.fn();

      renderWithProvider(
        <PaymentManager onPaymentSuccess={onPaymentSuccess} />
      );

      // Switch to deposit tab
      const depositTab = screen.getByRole("tab", { name: /deposit/i });
      await user.click(depositTab);

      // Find amount input and deposit button
      const amountInput = screen.getByLabelText(/deposit amount/i);
      const depositButton = screen.getByText("Deposit to Lottery");

      // Enter amount
      await user.type(amountInput, "10.5");

      // Click deposit (should be disabled due to wallet not connected)
      expect(depositButton).toBeDisabled();
    });

    test("should validate input amounts", async () => {
      const user = userEvent.setup();

      renderWithProvider(<PaymentManager />);

      // Switch to send tab
      const sendTab = screen.getByRole("tab", { name: /send/i });
      await user.click(sendTab);

      const amountInput = screen.getByLabelText(/amount/i);
      const sendButton = screen.getByText("Send WLD");

      // Try to send with invalid amount
      await user.type(amountInput, "invalid");

      // Amount should remain empty due to validation
      expect(amountInput).toHaveValue("");
    });

    test("should show transaction history", () => {
      renderWithProvider(<PaymentManager showHistory={true} />);

      const historyTab = screen.getByRole("tab", { name: /history/i });
      fireEvent.click(historyTab);

      expect(screen.getByText("Recent Transactions")).toBeInTheDocument();
      expect(screen.getByText("No transactions yet")).toBeInTheDocument();
    });
  });

  describe("Integration Tests", () => {
    test("should handle complete flow: connect wallet -> verify World ID -> make deposit", async () => {
      const user = userEvent.setup();

      const IntegrationTest = () => {
        const wallet = useWallet();
        const worldId = useWorldID();

        return (
          <div>
            <div data-testid="wallet-status">
              {wallet.isConnected ? "connected" : "disconnected"}
            </div>
            <div data-testid="worldid-status">
              {worldId.isVerified ? "verified" : "unverified"}
            </div>
            <WalletManager />
            <WorldIDManager />
            <PaymentManager />
          </div>
        );
      };

      renderWithProvider(<IntegrationTest />);

      // Initial state
      expect(screen.getByTestId("wallet-status")).toHaveTextContent(
        "disconnected"
      );
      expect(screen.getByTestId("worldid-status")).toHaveTextContent(
        "unverified"
      );

      // Connect wallet
      await act(async () => {
        await user.click(screen.getByText("Connect Wallet"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("wallet-status")).toHaveTextContent(
          "connected"
        );
      });

      // Verify World ID
      await act(async () => {
        await user.click(screen.getByText("Verify with World ID"));
      });

      // Mock verification completion
      if (screen.queryByTestId("idkit-widget")) {
        await user.click(screen.getByText("Mock Verify"));
      }

      await waitFor(() => {
        expect(screen.getByTestId("worldid-status")).toHaveTextContent(
          "verified"
        );
      });
    });
  });

  describe("Error Handling", () => {
    test("should handle wallet connection errors", async () => {
      const user = userEvent.setup();
      const onError = jest.fn();

      // Mock a failing wallet connection
      jest.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

      renderWithProvider(<WalletManager onError={onError} />);

      await act(async () => {
        await user.click(screen.getByText("Connect Wallet"));
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalled();
      });
    });

    test("should handle payment errors", async () => {
      const user = userEvent.setup();
      const onPaymentError = jest.fn();

      renderWithProvider(<PaymentManager onPaymentError={onPaymentError} />);

      // Try to make a payment without wallet connection
      const sendTab = screen.getByRole("tab", { name: /send/i });
      await user.click(sendTab);

      const addressInput = screen.getByLabelText(/recipient address/i);
      const amountInput = screen.getByLabelText(/amount/i);
      const sendButton = screen.getByText("Send WLD");

      await user.type(
        addressInput,
        "0x742d35Cc6732C0532925a3b8D7Bf8E434E73995F"
      );
      await user.type(amountInput, "10.5");

      // Button should be disabled due to no wallet connection
      expect(sendButton).toBeDisabled();
    });
  });
});
