/**
 * Simplified MiniApp SDK Components Export
 * Clean, focused components for WLD wallet integration
 */

export { default as WalletManager } from '../wallet/wallet-manager';
export { default as WorldIDManager } from '../worldid/worldid-manager';
export { default as PaymentManager } from '../payment/payment-manager';

// Re-export providers and hooks
export { 
  MiniAppProvider, 
  useMiniApp, 
  useWallet, 
  useWorldID, 
  usePayment, 
  useLottery 
} from '../../providers/miniapp-provider';

// Re-export types
export type {
  MiniAppState,
  WalletState,
  WorldIDState,
  PaymentState,
  LotteryState,
  PaymentTransaction,
  PoolStats,
  UserStats,
  MiniAppConfig,
  MiniAppEvent,
  UseWalletReturn,
  UseWorldIDReturn,
  UsePaymentReturn,
  UseLotteryReturn
} from '../../types/miniapp';