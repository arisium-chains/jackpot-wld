#!/usr/bin/env tsx
/**
 * Draw Automation CLI Script
 * 
 * This script checks if a draw is due and triggers it automatically.
 * Usage: pnpm draw:tick [--network <network>] [--dry-run]
 */

import { createPublicClient, createWalletClient, http, parseEther, PublicClient, WalletClient, Account, Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { foundry, sepolia } from 'viem/chains';
import * as fs from 'fs';
import * as path from 'path';

// Import contract ABIs
import PrizePoolABI from '../src/abi/PrizePool.json';
import PoolContractABI from '../src/abi/PoolContract.json';

// Types
interface ContractAddresses {
  chainId: number;
  prizePool: Address;
  poolContract: Address;
  wldToken: Address;
  vrfAdapter: Address;
}

interface DrawInfo {
  nextDrawAt: bigint;
  drawInProgress: boolean;
  prizeBalance: bigint;
  lastWinner: Address;
}

// Configuration
const NETWORKS = {
  local: {
    chain: foundry,
    rpcUrl: 'http://localhost:8545',
  },
  sepolia: {
    chain: sepolia,
    rpcUrl: process.env.NEXT_PUBLIC_WORLDCHAIN_SEPOLIA_RPC_URL || '',
  },
} as const;

type NetworkName = keyof typeof NETWORKS;

// CLI Arguments
interface CLIArgs {
  network: NetworkName;
  dryRun: boolean;
  verbose: boolean;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const result: CLIArgs = {
    network: 'local',
    dryRun: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--network':
        result.network = args[++i] as NetworkName;
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
      case '--verbose':
      case '-v':
        result.verbose = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Draw Automation CLI

Usage: pnpm draw:tick [options]

Options:
  --network <name>    Network to use (local, sepolia) [default: local]
  --dry-run          Check conditions without executing draw
  --verbose, -v      Enable verbose logging
  --help, -h         Show this help message
`);
        process.exit(0);
    }
  }

  return result;
}

function loadContractAddresses(): ContractAddresses {
  const addressesPath = path.join(__dirname, '../public/addresses.json');
  
  if (!fs.existsSync(addressesPath)) {
    throw new Error('Contract addresses not found. Please deploy contracts first.');
  }

  return JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
}

function log(message: string, verbose = false, args: CLIArgs) {
  if (!verbose || args.verbose) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

async function getDrawInfo(publicClient: PublicClient, prizePoolAddress: Address): Promise<DrawInfo> {
  const [prizeInfo, drawInProgress] = await Promise.all([
    publicClient.readContract({
      address: prizePoolAddress,
      abi: PrizePoolABI.abi,
      functionName: 'getPrizeInfo',
    }),
    publicClient.readContract({
      address: prizePoolAddress,
      abi: PrizePoolABI.abi,
      functionName: 'drawInProgress',
    }),
  ]);

  const [prizeBalance, nextDrawAt, lastWinner] = prizeInfo as [bigint, bigint, Address];

  return {
    nextDrawAt: nextDrawAt,
    drawInProgress: Boolean(drawInProgress),
    prizeBalance: prizeBalance,
    lastWinner: lastWinner,
  };
}

async function getTotalTickets(publicClient: PublicClient, poolContractAddress: Address, wldTokenAddress: Address): Promise<bigint> {
  // Get the total WLD balance in the pool contract (simplified approach)
  return await publicClient.readContract({
    address: wldTokenAddress,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'balanceOf',
    args: [poolContractAddress],
  });
}

async function scheduleDraw(walletClient: WalletClient, publicClient: PublicClient, prizePoolAddress: Address, account: Account): Promise<`0x${string}`> {
  const { request } = await publicClient.simulateContract({
    address: prizePoolAddress,
    abi: PrizePoolABI.abi,
    functionName: 'scheduleDraw',
    account,
  });

  return await walletClient.writeContract(request) as `0x${string}`;
}

async function main() {
  const args = parseArgs();
  
  log('🎲 Draw Automation CLI Starting...', false, args);
  log(`Network: ${args.network}`, false, args);
  log(`Dry Run: ${args.dryRun}`, false, args);

  try {
    // Load configuration
    const network = NETWORKS[args.network];
    if (!network.rpcUrl && args.network !== 'local') {
      throw new Error(`RPC URL not configured for network: ${args.network}`);
    }

    const addresses = loadContractAddresses();
    log(`Loaded contract addresses for chain ${addresses.chainId}`, true, args);

    // Setup clients
    const publicClient = createPublicClient({
      chain: network.chain,
      transport: http(network.rpcUrl),
    });

    // Check if we need a private key for actual execution
    let walletClient: WalletClient | null = null;
    let account: Account | null = null;
    
    if (!args.dryRun) {
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable required for draw execution');
      }

      if (!privateKey.startsWith('0x')) {
        throw new Error('PRIVATE_KEY must start with 0x');
      }
      account = privateKeyToAccount(privateKey as `0x${string}`);
      walletClient = createWalletClient({
        account,
        chain: network.chain,
        transport: http(network.rpcUrl),
      });
      
      log(`Using account: ${account.address}`, true, args);
    }

    // Get current draw information
    log('📊 Fetching draw information...', false, args);
    const drawInfo = await getDrawInfo(publicClient, addresses.prizePool);
    const totalTickets = await getTotalTickets(publicClient, addresses.poolContract, addresses.wldToken);
    
    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    const timeUntilDraw = drawInfo.nextDrawAt - currentTime;
    
    log(`Current time: ${new Date().toISOString()}`, true, args);
    log(`Next draw at: ${new Date(Number(drawInfo.nextDrawAt) * 1000).toISOString()}`, false, args);
    log(`Time until draw: ${timeUntilDraw}s`, false, args);
    log(`Draw in progress: ${drawInfo.drawInProgress}`, false, args);
    log(`Prize balance: ${drawInfo.prizeBalance} wei`, false, args);
    log(`Total tickets: ${totalTickets}`, false, args);
    log(`Last winner: ${drawInfo.lastWinner}`, true, args);

    // Check if draw is needed
    const drawNeeded = currentTime >= drawInfo.nextDrawAt && !drawInfo.drawInProgress;
    
    if (!drawNeeded) {
      if (drawInfo.drawInProgress) {
        log('⏳ Draw is already in progress', false, args);
      } else {
        log(`⏰ Draw not yet due (${timeUntilDraw}s remaining)`, false, args);
      }
      return;
    }

    // Check if there are participants
    if (totalTickets === BigInt(0)) {
      log('👥 No participants in the pool, skipping draw', false, args);
      return;
    }

    // Check if there's a prize to distribute
    if (drawInfo.prizeBalance === BigInt(0)) {
      log('💰 No prize balance available, skipping draw', false, args);
      return;
    }

    log('🎯 Draw conditions met!', false, args);
    
    if (args.dryRun) {
      log('🔍 DRY RUN: Would schedule draw now', false, args);
      return;
    }

    // Execute the draw
    if (!walletClient || !account) {
      throw new Error('Wallet client and account are required for draw execution');
    }
    
    log('🚀 Scheduling draw...', false, args);
    const txHash = await scheduleDraw(walletClient, publicClient, addresses.prizePool, account);
    log(`✅ Draw scheduled! Transaction: ${txHash}`, false, args);
    
    // Wait for confirmation
    log('⏳ Waiting for transaction confirmation...', false, args);
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    
    if (receipt.status === 'success') {
      log('🎉 Draw successfully scheduled!', false, args);
    } else {
      log('❌ Transaction failed', false, args);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}