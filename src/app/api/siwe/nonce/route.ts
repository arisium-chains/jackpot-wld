import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { logger } from '../../../../lib/logger'

export async function GET() {
  try {
    logger.apiRequest('GET', '/api/siwe/nonce')
    
    // Generate a cryptographically secure nonce
    const nonce = randomBytes(32).toString('hex')
    
    // Set expiration time (15 minutes from now)
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    
    const response = {
      nonce,
      expirationTime
    }
    
    logger.apiResponse('GET', '/api/siwe/nonce', 200, { nonce })
    return NextResponse.json(response)
  } catch (error) {
    logger.apiResponse('GET', '/api/siwe/nonce', 500, { error })
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    )
  }
}