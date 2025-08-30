import { createConfig, http } from 'wagmi';
import { worldchain, worldchainSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Define local development chain
const localhost = {
  id: 31337,
  name: 'Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
  },
} as const;

// Prefer environment RPCs when available
const WORLDC_MAINNET_RPC =
  process.env.NEXT_PUBLIC_WORLDCHAIN_RPC_URL || 'https://worldchain-mainnet.g.alchemy.com/public';
const WORLDC_SEPOLIA_RPC =
  process.env.NEXT_PUBLIC_WORLDCHAIN_SEPOLIA_RPC_URL ||
  process.env.NEXT_PUBLIC_RPC_URL ||
  'https://worldchain-sepolia.g.alchemy.com/public';

export const config = createConfig({
  chains: [worldchainSepolia, worldchain, localhost],
  connectors: [injected()],
  transports: {
    [worldchain.id]: http(WORLDC_MAINNET_RPC),
    [worldchainSepolia.id]: http(WORLDC_SEPOLIA_RPC),
    [localhost.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
