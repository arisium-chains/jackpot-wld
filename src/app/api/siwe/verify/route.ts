import { NextResponse } from 'next/server'
import { verifyMessage } from 'viem'
import { createPublicClient, http } from 'viem'
import { defineChain } from 'viem/utils'
import { logger } from '../../../../lib/logger'

const worldSepolia = defineChain({
  id: 4801,
  name: 'World Chain Sepolia',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.WORLDC_SEPOLIA_RPC_URL || 'https://worldchain-sepolia.g.alchemy.com/v2/demo']
    }
  }
})

export async function POST(req: Request) {
  try {
    const { address, message, signature } = await req.json()
    
    logger.apiRequest('POST', '/api/siwe/verify', { address, message, signature })

    if (!address || !message || !signature) {
      logger.apiResponse('POST', '/api/siwe/verify', 400, { error: 'BadRequest' })
      return NextResponse.json({ ok: false, error: 'BadRequest' }, { status: 400 })
    }
    const client = createPublicClient({ chain: worldSepolia, transport: http() })
    const verified = await verifyMessage({ address, message, signature })
    if (!verified) {
      logger.apiResponse('POST', '/api/siwe/verify', 401, { error: 'SignatureInvalid', address })
      return NextResponse.json({ ok: false, error: 'SignatureInvalid' }, { status: 401 })
    }
    // TODO: persist session / rate-limit per address
    logger.apiResponse('POST', '/api/siwe/verify', 200, { ok: true, address })
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'ServerError'
    logger.apiResponse('POST', '/api/siwe/verify', 500, { error: errorMessage })
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 })
  }
}