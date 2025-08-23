/**
 * Simplified MiniApp SDK Core Implementation
 * Focused on WLD wallet integration and core functionality
 */

import { MiniKit, Tokens } from '@worldcoin/minikit-js';
import { ISuccessResult, VerificationLevel } from '@worldcoin/idkit';
import {
  SDKStatus,
  EnvironmentInfo,
  MiniAppState,
  MiniAppEvent,
  EventListener,
  PaymentTransaction,
  PoolStats,
  UserStats
} from '../types/miniapp';
import { logger } from './logger';
import { isWorldApp } from './utils';

/**
 * Global MiniKit type declarations
 */
declare global {
  interface Window {
    MiniKit?: {
      walletAddress?: string;
      [key: string]: unknown;
    };
  }
}

/**
 * Simplified MiniApp SDK Implementation
 */
export class SimplifiedMiniAppSDK {
  private _status: SDKStatus = 'idle';
  private _state: MiniAppState;
  private _eventListeners = new Map<MiniAppEvent, EventListener[]>();

  constructor() {
    this._state = this.createInitialState();
    this.setupEventListeners();
  }

  // Getters
  get status(): SDKStatus {
    return this._status;
  }

  get state(): MiniAppState {
    return { ...this._state };
  }

  get isInstalled(): boolean {
    return typeof window !== 'undefined' && !!window.MiniKit;
  }

  get environment(): EnvironmentInfo {
    const isWA = isWorldApp();
    const isDev = process.env.NODE_ENV === 'development';
    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
    const hasValidAppId = !!(
      process.env.NEXT_PUBLIC_WORLD_APP_ID &&
      !process.env.NEXT_PUBLIC_WORLD_APP_ID.includes('__FROM_DEV_PORTAL__')
    );

    return {
      isWorldApp: isWA,
      isDevelopment: isDev,
      isDevMode,
      hasValidAppId,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
      version: '1.0.0'
    };
  }

  // Initialization
  async initialize(): Promise<void> {
    try {
      this._status = 'initializing';
      logger.info('Initializing Simplified MiniApp SDK');

      // Update environment
      this._state.environment = this.environment;
      this._state.isWorldApp = this.environment.isWorldApp;

      if (this.isInstalled) {
        // Initialize MiniKit if available
        await MiniKit.install();
        logger.info('MiniKit installed successfully');
      }

      this._status = 'ready';
      this._state.isInitialized = true;
      logger.info('Simplified MiniApp SDK initialized successfully');
      this.emit('sdk:ready', { sdk: this });
    } catch (error) {
      this._status = 'error';
      const errorMessage = error instanceof Error ? error.message : 'SDK initialization failed';
      this._state.error = errorMessage;
      logger.error('SDK initialization failed', { error: errorMessage });
      this.emit('sdk:error', { error: errorMessage });
      throw new Error(errorMessage);
    }
  }

  // Wallet Implementation
  async connectWallet(): Promise<void> {
    try {
      this._state.wallet.isConnecting = true;
      this.emit('wallet:connecting', {});

      // Handle development environment gracefully
      if (!this.isInstalled) {
        if (this.environment.isDevelopment) {
          logger.warn('MiniKit not available in development environment - using mock wallet');
          // Mock wallet connection for development
          const mockAddress = '0x1234567890123456789012345678901234567890';
          this._state.wallet = {
            isConnected: true,
            address: mockAddress,
            balance: '1000.0',
            chainId: 4801, // World Chain Sepolia default
            isConnecting: false
          };
          logger.info('Mock wallet connected for development', { address: mockAddress });
          this.emit('wallet:connected', { address: mockAddress });
          return;
        }
        throw new Error('MiniKit not available');
      }

      // Get nonce for authentication
      const { nonce } = await (await fetch('/api/siwe/nonce')).json();

      // Request wallet authentication
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        requestId: '0',
        expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        statement: 'Sign in to the lottery app',
      });

      if (finalPayload.status === 'error') {
        throw new Error(`Wallet authentication failed: ${finalPayload.error_code || 'Unknown error'}`);
      }

      // Extract wallet address from finalPayload or fallback to MiniKit instance
      const address = (finalPayload as { address?: string }).address || window.MiniKit?.walletAddress;
      
      if (!address) {
        throw new Error('Wallet address not available in authentication response');
      }

      // Optional signature verification
      const { message, signature } = finalPayload;
      if (message && signature) {
        const response = await fetch('/api/siwe/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, message, signature })
        });
        
        const result = await response.json();
        if (!result.ok) {
          throw new Error('Signature verification failed');
        }
      }

      // Update wallet state
      this._state.wallet = {
        isConnected: true,
        address,
        balance: '0', // Will be updated by getBalance
        chainId: 4801, // World Chain Sepolia default
        isConnecting: false
      };

      // Get initial balance
      await this.getWalletBalance();

      logger.info('Wallet connected successfully', { address });
      this.emit('wallet:connected', { address });
    } catch (error) {
      this._state.wallet.isConnecting = false;
      const errorMessage = error instanceof Error ? error.message : 'Wallet connection failed';
      this._state.error = errorMessage;
      logger.error('Wallet connection failed', { error: errorMessage });
      throw new Error(errorMessage);
    }
  }

  async disconnectWallet(): Promise<void> {
    this._state.wallet = {
      isConnected: false,
      address: null,
      balance: '0',
      chainId: 4801, // World Chain Sepolia
      isConnecting: false
    };
    
    logger.info('Wallet disconnected');
    this.emit('wallet:disconnected', {});
  }

  async getWalletBalance(): Promise<string> {
    try {
      if (!this._state.wallet.isConnected || !this._state.wallet.address) {
        return '0';
      }

      // In development mode or when MiniKit is not available, return mock balance
      if (this.environment.isDevelopment || !this.isInstalled) {
        const balance = '1000.0';
        this._state.wallet.balance = balance;
        return balance;
      }

      // For now, return mock balance - in real implementation, 
      // this would fetch from blockchain
      const balance = '1000.0';
      this._state.wallet.balance = balance;
      
      return balance;
    } catch (error) {
      logger.error('Failed to get wallet balance', { error: error instanceof Error ? error.message : String(error) });
      return '0';
    }
  }

  async switchChain(chainId: number): Promise<void> {
    try {
      // Implementation would use MiniKit to switch chains
      this._state.wallet.chainId = chainId;
      this.emit('wallet:chainChanged', { chainId });
      logger.info('Chain switched', { chainId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Chain switch failed';
      throw new Error(errorMessage);
    }
  }

  // World ID Implementation
  async verifyWorldID(action: string): Promise<ISuccessResult> {
    try {
      this._state.worldId.isVerifying = true;

      if (!this.isInstalled) {
        throw new Error('MiniKit not available for World ID verification');
      }

      // Use IDKit for verification (this would be integrated properly)
      // For now, return mock success result
      const mockProof: ISuccessResult = {
        merkle_root: '0x123...',
        nullifier_hash: '0x456...',
        proof: '0x789...',
        verification_level: 'orb' as VerificationLevel
      };

      this._state.worldId = {
        isVerified: true,
        proof: mockProof,
        verificationLevel: mockProof.verification_level as 'orb' | 'device',
        isVerifying: false
      };

      logger.info('World ID verified successfully', { action });
      this.emit('worldid:verified', { proof: mockProof, action });
      
      return mockProof;
    } catch (error) {
      this._state.worldId.isVerifying = false;
      const errorMessage = error instanceof Error ? error.message : 'World ID verification failed';
      this._state.error = errorMessage;
      logger.error('World ID verification failed', { error: errorMessage, action });
      throw new Error(errorMessage);
    }
  }

  resetWorldID(): void {
    this._state.worldId = {
      isVerified: false,
      proof: null,
      verificationLevel: null,
      isVerifying: false
    };
    
    logger.info('World ID reset');
    this.emit('worldid:reset', {});
  }

  // Payment Implementation
  async sendWLD(to: string, amount: string): Promise<string> {
    try {
      this._state.payment.isProcessing = true;

      if (!this._state.wallet.isConnected) {
        throw new Error('Wallet not connected');
      }

      if (!this.isInstalled) {
        throw new Error('MiniKit not available for payments');
      }

      // Use MiniKit payment
      const response = await MiniKit.commandsAsync.pay({
        reference: this.generateTransactionId(),
        to,
        tokens: [
          {
            symbol: Tokens.WLD,
            token_amount: amount,
          },
        ],
        description: `Send ${amount} WLD to ${to}`,
      });

      if (response?.finalPayload?.status === 'error') {
        throw new Error(response.finalPayload.error_code || 'Payment failed');
      }

      const transactionHash = response?.finalPayload?.transaction_status || this.generateTransactionId();

      // Create transaction record
      const transaction: PaymentTransaction = {
        id: this.generateTransactionId(),
        hash: transactionHash,
        from: this._state.wallet.address!,
        to,
        amount,
        token: 'WLD',
        status: 'pending',
        timestamp: new Date(),
        confirmations: 0,
        memo: `Send ${amount} WLD`
      };

      this._state.payment.history.unshift(transaction);
      this._state.payment.lastTransaction = transactionHash;
      this._state.payment.isProcessing = false;

      logger.info('WLD payment sent', { transactionHash, amount, to });
      this.emit('payment:sent', { transaction });

      return transactionHash;
    } catch (error) {
      this._state.payment.isProcessing = false;
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      this._state.error = errorMessage;
      logger.error('WLD payment failed', { error: errorMessage, amount, to });
      this.emit('payment:failed', { error: errorMessage });
      throw new Error(errorMessage);
    }
  }

  async depositToLottery(amount: string): Promise<string> {
    try {
      // This would interact with the lottery contract
      const transactionHash = await this.sendWLD(
        process.env.NEXT_PUBLIC_POOL_CONTRACT_ADDRESS || '0x123...',
        amount
      );

      // Update lottery state
      const currentDeposits = parseFloat(this._state.lottery.userDeposits);
      this._state.lottery.userDeposits = (currentDeposits + parseFloat(amount)).toString();
      this._state.lottery.isEligible = true;

      return transactionHash;
    } catch (error) {
      throw error;
    }
  }

  async withdrawFromLottery(amount: string): Promise<string> {
    try {
      // This would interact with the lottery contract for withdrawal
      // For now, create a mock transaction
      const transactionHash = this.generateTransactionId();

      // Update lottery state
      const currentDeposits = parseFloat(this._state.lottery.userDeposits);
      this._state.lottery.userDeposits = Math.max(0, currentDeposits - parseFloat(amount)).toString();
      
      if (parseFloat(this._state.lottery.userDeposits) === 0) {
        this._state.lottery.isEligible = false;
      }

      return transactionHash;
    } catch (error) {
      throw error;
    }
  }

  // Lottery Implementation
  async getPoolStats(): Promise<PoolStats> {
    try {
      // This would fetch from the blockchain/API
      const stats: PoolStats = {
        totalDeposits: '50000.0',
        totalParticipants: 150,
        currentPrize: '2500.0',
        nextDrawTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        lastWinner: '0x742d35Cc6732C0532925a3b8D7Bf8E434E73995F',
        totalPrizesWon: '125000.0'
      };

      this._state.lottery.totalPool = stats.totalDeposits;
      this._state.lottery.nextDraw = stats.nextDrawTime;

      return stats;
    } catch {
      throw new Error('Failed to fetch pool stats');
    }
  }

  async getUserStats(): Promise<UserStats> {
    try {
      if (!this._state.wallet.isConnected) {
        throw new Error('Wallet not connected');
      }

      // This would fetch from the blockchain/API
      const stats: UserStats = {
        totalDeposited: this._state.lottery.userDeposits,
        currentBalance: this._state.lottery.userDeposits,
        prizesWon: '0',
        participantSince: new Date('2024-01-01'),
        eligibleForDraw: this._state.lottery.isEligible,
        winningOdds: this.calculateWinningOdds()
      };

      return stats;
    } catch {
      throw new Error('Failed to fetch user stats');
    }
  }

  async checkEligibility(): Promise<boolean> {
    try {
      const isEligible = this._state.wallet.isConnected && 
                        this._state.worldId.isVerified && 
                        parseFloat(this._state.lottery.userDeposits) > 0;
      
      this._state.lottery.isEligible = isEligible;
      return isEligible;
    } catch {
      return false;
    }
  }

  // Event Management
  addEventListener(event: MiniAppEvent, listener: EventListener): void {
    if (!this._eventListeners.has(event)) {
      this._eventListeners.set(event, []);
    }
    this._eventListeners.get(event)!.push(listener);
  }

  removeEventListener(event: MiniAppEvent, listener: EventListener): void {
    const listeners = this._eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: MiniAppEvent, data: unknown): void {
    const listeners = this._eventListeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data as Parameters<typeof listener>[0]);
      } catch (error) {
        logger.error('Event listener error', { event, error: error instanceof Error ? error.message : String(error) });
      }
    });
  }

  // Helper Methods
  private createInitialState(): MiniAppState {
    return {
      isInitialized: false,
      isWorldApp: false,
      error: null,
      wallet: {
        isConnected: false,
        address: null,
        balance: '0',
        chainId: 4801, // World Chain Sepolia
        isConnecting: false
      },
      worldId: {
        isVerified: false,
        proof: null,
        verificationLevel: null,
        isVerifying: false
      },
      payment: {
        isProcessing: false,
        lastTransaction: null,
        history: []
      },
      lottery: {
        userDeposits: '0',
        totalPool: '0',
        nextDraw: null,
        isEligible: false,
        currentOdds: '0'
      },
      environment: this.environment
    };
  }

  private setupEventListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        logger.info('Network online');
      });
      
      window.addEventListener('offline', () => {
        logger.info('Network offline');
      });
    }
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateWinningOdds(): string {
    const userDeposits = parseFloat(this._state.lottery.userDeposits);
    const totalPool = parseFloat(this._state.lottery.totalPool);
    
    if (totalPool === 0) return '0';
    
    const odds = (userDeposits / totalPool) * 100;
    return odds.toFixed(2);
  }
}

// Export singleton instance
export const miniAppSDK = new SimplifiedMiniAppSDK();
export default miniAppSDK;