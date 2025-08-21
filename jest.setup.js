import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock MiniKit globally for tests
global.MiniKit = {
  isInstalled: jest.fn(() => true),
  commandsAsync: {
    walletAuth: jest.fn(),
  },
  walletAddress: '0x1234567890123456789012345678901234567890',
}

// Mock window.MiniKit
Object.defineProperty(window, 'MiniKit', {
  value: global.MiniKit,
  writable: true,
})

// Mock fetch globally
global.fetch = jest.fn()

// Mock process.env
process.env.NEXT_PUBLIC_DEV_MODE = 'false'