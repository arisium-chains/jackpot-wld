/**
 * Simplified MiniApp Provider
 * Focused on WLD wallet integration and core functionality
 */

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useReducer,
} from "react";
import { ISuccessResult } from "@worldcoin/idkit";
import { miniAppSDK } from "../lib/simplified-miniapp-sdk";
import {
  MiniAppState,
  MiniAppConfig,
  MiniAppEvent,
  EventListener,
  WalletActions,
  WorldIDActions,
  PaymentActions,
  LotteryActions,
  PoolStats,
  UserStats,
  PaymentTransaction,
} from "../types/miniapp";
import { logger } from "../lib/logger";

/**
 * MiniApp Context Type
 */
interface MiniAppContextType {
  // State
  state: MiniAppState;
  isReady: boolean;

  // Actions
  wallet: WalletActions;
  worldId: WorldIDActions;
  payment: PaymentActions;
  lottery: LotteryActions;

  // Event Management
  addEventListener: (event: MiniAppEvent, listener: EventListener) => void;
  removeEventListener: (event: MiniAppEvent, listener: EventListener) => void;

  // Initialization
  initialize: () => Promise<void>;
}

/**
 * State Actions for Reducer
 */
type StateAction =
  | { type: "SET_STATE"; payload: Partial<MiniAppState> }
  | { type: "SET_WALLET"; payload: Partial<MiniAppState["wallet"]> }
  | { type: "SET_WORLDID"; payload: Partial<MiniAppState["worldId"]> }
  | { type: "SET_PAYMENT"; payload: Partial<MiniAppState["payment"]> }
  | { type: "SET_LOTTERY"; payload: Partial<MiniAppState["lottery"]> }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET_STATE" };

/**
 * State Reducer
 */
function stateReducer(state: MiniAppState, action: StateAction): MiniAppState {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, ...action.payload };
    case "SET_WALLET":
      return { ...state, wallet: { ...state.wallet, ...action.payload } };
    case "SET_WORLDID":
      return { ...state, worldId: { ...state.worldId, ...action.payload } };
    case "SET_PAYMENT":
      return { ...state, payment: { ...state.payment, ...action.payload } };
    case "SET_LOTTERY":
      return { ...state, lottery: { ...state.lottery, ...action.payload } };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "RESET_STATE":
      return miniAppSDK.state;
    default:
      return state;
  }
}

/**
 * MiniApp Context
 */
const MiniAppContext = createContext<MiniAppContextType | null>(null);

/**
 * MiniApp Provider Props
 */
interface MiniAppProviderProps {
  children: ReactNode;
  config?: MiniAppConfig;
}

/**
 * MiniApp Provider Component
 */
export function MiniAppProvider({
  children,
  config = {
    appId: process.env.NEXT_PUBLIC_WORLD_APP_ID || "",
    environment:
      process.env.NODE_ENV === "development" ? "development" : "production",
    enableNotifications: true,
    enableAnalytics: true,
    autoConnect: true,
  },
}: MiniAppProviderProps) {
  // State Management
  const [state, dispatch] = useReducer(stateReducer, miniAppSDK.state);
  const [isReady, setIsReady] = useState(false);

  // Sync state with SDK
  const syncState = useCallback(() => {
    dispatch({ type: "SET_STATE", payload: miniAppSDK.state });
  }, []);

  // Event Handlers
  const handleSDKReady = useCallback(() => {
    setIsReady(true);
    syncState();
    logger.info("MiniApp SDK ready");
  }, [syncState]);

  const handleSDKError = useCallback((data: { error: string }) => {
    dispatch({ type: "SET_ERROR", payload: data.error });
    logger.error("MiniApp SDK error", { error: data.error });
  }, []);

  const handleWalletConnected = useCallback(
    (data: { address: string }) => {
      syncState();
      logger.info("Wallet connected", { address: data.address });
    },
    [syncState]
  );

  const handleWalletDisconnected = useCallback(() => {
    syncState();
    logger.info("Wallet disconnected");
  }, [syncState]);

  const handleWorldIDVerified = useCallback(
    (data: { proof: ISuccessResult; action: string }) => {
      syncState();
      logger.info("World ID verified", { action: data.action });
    },
    [syncState]
  );

  const handlePaymentSent = useCallback(
    (data: { transaction: PaymentTransaction }) => {
      syncState();
      logger.info("Payment sent", { transactionHash: data.transaction.hash });
    },
    [syncState]
  );

  // Initialize SDK and set up event listeners
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        // Set up event listeners
        miniAppSDK.addEventListener("sdk:ready", handleSDKReady as EventListener);
        miniAppSDK.addEventListener("sdk:error", handleSDKError as EventListener);
        miniAppSDK.addEventListener("wallet:connected", handleWalletConnected as EventListener);
        miniAppSDK.addEventListener(
          "wallet:disconnected",
          handleWalletDisconnected as EventListener
        );
        miniAppSDK.addEventListener("worldid:verified", handleWorldIDVerified as EventListener);
        miniAppSDK.addEventListener("payment:sent", handlePaymentSent as EventListener);

        // Initialize SDK
        if (config.autoConnect) {
          await miniAppSDK.initialize();
        }
      } catch (error) {
        logger.error("Failed to initialize MiniApp SDK", { error: String(error) });
        dispatch({ type: "SET_ERROR", payload: "Failed to initialize SDK" });
      }
    };

    initializeSDK();

    // Cleanup event listeners
    return () => {
      miniAppSDK.removeEventListener("sdk:ready", handleSDKReady as EventListener);
      miniAppSDK.removeEventListener("sdk:error", handleSDKError as EventListener);
      miniAppSDK.removeEventListener("wallet:connected", handleWalletConnected as EventListener);
      miniAppSDK.removeEventListener(
        "wallet:disconnected",
        handleWalletDisconnected as EventListener
      );
      miniAppSDK.removeEventListener("worldid:verified", handleWorldIDVerified as EventListener);
      miniAppSDK.removeEventListener("payment:sent", handlePaymentSent as EventListener);
    };
  }, [
    config.autoConnect,
    handleSDKReady,
    handleSDKError,
    handleWalletConnected,
    handleWalletDisconnected,
    handleWorldIDVerified,
    handlePaymentSent,
  ]);

  // Wallet Actions
  const walletActions: WalletActions = {
    connect: async () => {
      await miniAppSDK.connectWallet();
      syncState();
    },

    disconnect: async () => {
      await miniAppSDK.disconnectWallet();
      syncState();
    },

    getBalance: async () => {
      const balance = await miniAppSDK.getWalletBalance();
      syncState();
      return balance;
    },

    switchChain: async (chainId: number) => {
      await miniAppSDK.switchChain(chainId);
      syncState();
    },
  };

  // World ID Actions
  const worldIdActions: WorldIDActions = {
    verify: async (action: string, signal?: string) => {
      const proof = await miniAppSDK.verifyWorldID(action, signal);
      syncState();
      return proof;
    },

    reset: () => {
      miniAppSDK.resetWorldID();
      syncState();
    },
  };

  // Payment Actions
  const paymentActions: PaymentActions = {
    sendWLD: async (to: string, amount: string) => {
      const transactionHash = await miniAppSDK.sendWLD(to, amount);
      syncState();
      return transactionHash;
    },

    deposit: async (amount: string) => {
      const transactionHash = await miniAppSDK.depositToLottery(amount);
      syncState();
      return transactionHash;
    },

    withdraw: async (amount: string) => {
      const transactionHash = await miniAppSDK.withdrawFromLottery(amount);
      syncState();
      return transactionHash;
    },

    getHistory: async () => {
      return state.payment.history;
    },
  };

  // Lottery Actions
  const lotteryActions: LotteryActions = {
    getPoolStats: async () => {
      const stats = await miniAppSDK.getPoolStats();
      syncState();
      return stats;
    },

    getUserStats: async () => {
      const stats = await miniAppSDK.getUserStats();
      syncState();
      return stats;
    },

    checkEligibility: async () => {
      const isEligible = await miniAppSDK.checkEligibility();
      syncState();
      return isEligible;
    },

    claimPrize: async () => {
      // Implementation would depend on lottery contract
      throw new Error("Claim prize not yet implemented");
    },
  };

  // Initialize function
  const initialize = useCallback(async () => {
    await miniAppSDK.initialize();
    syncState();
  }, [syncState]);

  // Event management functions
  const addEventListener = useCallback(
    (event: MiniAppEvent, listener: EventListener) => {
      miniAppSDK.addEventListener(event, listener);
    },
    []
  );

  const removeEventListener = useCallback(
    (event: MiniAppEvent, listener: EventListener) => {
      miniAppSDK.removeEventListener(event, listener);
    },
    []
  );

  // Context value
  const contextValue: MiniAppContextType = {
    state,
    isReady,
    wallet: walletActions,
    worldId: worldIdActions,
    payment: paymentActions,
    lottery: lotteryActions,
    addEventListener,
    removeEventListener,
    initialize,
  };

  return (
    <MiniAppContext.Provider value={contextValue}>
      {children}
    </MiniAppContext.Provider>
  );
}

/**
 * Hook to use MiniApp Context
 */
export function useMiniApp(): MiniAppContextType {
  const context = useContext(MiniAppContext);
  if (!context) {
    throw new Error("useMiniApp must be used within a MiniAppProvider");
  }
  return context;
}

/**
 * Individual hooks for specific functionality
 */
export function useWallet() {
  const { state, wallet } = useMiniApp();
  return {
    ...state.wallet,
    ...wallet,
    error: state.error,
  };
}

export function useWorldID() {
  const { state, worldId } = useMiniApp();
  return {
    ...state.worldId,
    ...worldId,
    error: state.error,
  };
}

export function usePayment() {
  const { state, payment } = useMiniApp();
  return {
    ...state.payment,
    ...payment,
    error: state.error,
  };
}

export function useLottery() {
  const { state, lottery } = useMiniApp();
  return {
    ...state.lottery,
    ...lottery,
    error: state.error,
  };
}

export default MiniAppProvider;
