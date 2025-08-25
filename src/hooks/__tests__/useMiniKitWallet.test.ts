import { renderHook, act, waitFor } from '@testing-library/react'
import { useMiniKitWallet } from '../useMiniKitWallet'

// Mock the isWorldApp utility
jest.mock('../../lib/utils', () => ({
  isWorldApp: jest.fn(() => true),
}))

// Extend global type to include MiniKit
declare global {
  var MiniKit: {
    isInstalled: jest.MockedFunction<() => boolean>
    walletAddress: string
    commandsAsync: {
      walletAuth: jest.MockedFunction<(params: unknown) => Promise<unknown>>
    }
  }
}

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
const mockWalletAuth = global.MiniKit.commandsAsync.walletAuth

describe('useMiniKitWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
    mockWalletAuth.mockClear()
    
    // Reset MiniKit mock state
    global.MiniKit.isInstalled = jest.fn(() => true)
    global.MiniKit.walletAddress = '0x1234567890123456789012345678901234567890'
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useMiniKitWallet())

    expect(result.current.status).toBe('ready')
    expect(result.current.address).toBe('0x1234567890123456789012345678901234567890')
    expect(result.current.error).toBeNull()
    expect(result.current.inWorldApp).toBe(true)
  })

  it('should handle MiniKit not installed', () => {
    global.MiniKit.isInstalled = jest.fn(() => false)
    
    const { result } = renderHook(() => useMiniKitWallet())

    expect(result.current.status).toBe('unavailable')
    expect(result.current.address).toBeNull()
    expect(result.current.error).toBe('MiniKit is not installed')
  })

  it('should handle successful authentication', async () => {
    // Mock successful nonce fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ nonce: 'test-nonce-123' }),
    } as Response)

    // Mock successful wallet auth
    mockWalletAuth.mockResolvedValueOnce({
      finalPayload: {
        status: 'success',
        message: 'test-message',
        signature: 'test-signature',
      },
    })

    // Mock successful verification
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    const { result } = renderHook(() => useMiniKitWallet())

    await act(async () => {
      await result.current.beginAuth()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/siwe/nonce')
    expect(mockWalletAuth).toHaveBeenCalledWith({
      nonce: 'test-nonce-123',
      requestId: expect.any(String),
      expirationTime: expect.any(String),
      notBefore: expect.any(String),
      statement: expect.any(String),
    })
  })

  it('should handle authentication failure', async () => {
    // Mock successful nonce fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ nonce: 'test-nonce-123' }),
    } as Response)

    // Mock failed wallet auth
    mockWalletAuth.mockResolvedValueOnce({
      finalPayload: {
        status: 'error',
        error: 'User rejected',
      },
    })

    const { result } = renderHook(() => useMiniKitWallet())

    await act(async () => {
      await result.current.beginAuth()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })

    expect(result.current.error).toBe('User rejected')
  })

  it('should handle nonce fetch failure', async () => {
    // Mock failed nonce fetch
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    const { result } = renderHook(() => useMiniKitWallet())

    await act(async () => {
      await result.current.beginAuth()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })

    expect(result.current.error).toBe('Failed to fetch nonce')
  })

  it('should reset state correctly', () => {
    const { result } = renderHook(() => useMiniKitWallet())

    // Set some error state first
    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe('ready')
    expect(result.current.error).toBeNull()
  })

  it('should handle verification step correctly', async () => {
    // Mock successful nonce fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ nonce: 'test-nonce-123' }),
    } as Response)

    // Mock successful wallet auth
    mockWalletAuth.mockResolvedValueOnce({
      finalPayload: {
        status: 'success',
        message: 'test-message',
        signature: 'test-signature',
      },
    })

    // Mock successful verification
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    const { result } = renderHook(() => useMiniKitWallet())

    await act(async () => {
      await result.current.beginAuth()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })

    // Verify that verification endpoint was called
    expect(mockFetch).toHaveBeenCalledWith('/api/siwe/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: '0x1234567890123456789012345678901234567890',
        message: 'test-message',
        signature: 'test-signature',
        nonce: undefined, // nonce extraction will fail for 'test-message'
      }),
    })
  })

  it('should handle verification failure', async () => {
    // Mock successful nonce fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ nonce: 'test-nonce-123' }),
    } as Response)

    // Mock successful wallet auth
    mockWalletAuth.mockResolvedValueOnce({
      finalPayload: {
        status: 'success',
        message: 'test-message',
        signature: 'test-signature',
      },
    })

    // Mock failed verification
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    } as Response)

    const { result } = renderHook(() => useMiniKitWallet())

    await act(async () => {
      await result.current.beginAuth()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
    })

    expect(result.current.error).toBe('Signature verification failed')
  })
})