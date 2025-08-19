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

export const config = createConfig({
  chains: [worldchain, worldchainSepolia, localhost],
  connectors: [
    injected(),
  ],
  transports: {
    [worldchain.id]: http(),
    [worldchainSepolia.id]: http(),
    [localhost.id]: http('http://127.0.0.1:8545'),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}