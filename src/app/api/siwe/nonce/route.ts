import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { logger } from '../../../../lib/logger'

// Import nonce store from verify endpoint to maintain consistency
import { nonceStore } from '../verify/route'

// Types for nonce management
interface NonceResponse {
  nonce: string;
  expirationTime: string;
  requestId: string;
}



// Rate limiting for nonce generation
const nonceRateLimitStore = new Map<string, { attempts: number; resetAt: number }>();

/**
 * Check rate limiting for nonce generation
 */
function checkNonceRateLimit(identifier: string): { allowed: boolean; resetAt?: number } {
  const now = Date.now();
  const rateData = nonceRateLimitStore.get(identifier);
  
  if (!rateData || now > rateData.resetAt) {
    // Reset or create new rate limit entry - more generous for nonce generation
    nonceRateLimitStore.set(identifier, { attempts: 1, resetAt: now + 15 * 60 * 1000 }); // 15 minutes
    return { allowed: true };
  }
  
  if (rateData.attempts >= 20) { // Allow more nonce generations than verification attempts
    return { allowed: false, resetAt: rateData.resetAt };
  }
  
  rateData.attempts++;
  return { allowed: true };
}

/**
 * Clean up expired nonces periodically
 */
function cleanupExpiredNonces(): void {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [nonce, data] of nonceStore.entries()) {
    if (now > data.expiresAt) {
      nonceStore.delete(nonce);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    logger.debug('Cleaned up expired nonces', { count: cleanedCount, remaining: nonceStore.size });
  }
}

/**
 * Enhanced nonce generation endpoint
 */
export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  
  try {
    // Extract client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    
    logger.apiRequest('GET', '/api/siwe/nonce', { requestId, clientIP });
    
    // Check rate limiting
    const rateLimitResult = checkNonceRateLimit(clientIP);
    if (!rateLimitResult.allowed) {
      logger.apiResponse('GET', '/api/siwe/nonce', 429, { 
        error: 'RateLimitExceeded', 
        resetAt: rateLimitResult.resetAt,
        requestId
      });
      return NextResponse.json({
        error: 'Rate limit exceeded',
        details: 'Too many nonce requests',
        resetAt: rateLimitResult.resetAt
      }, { status: 429 });
    }
    
    // Clean up expired nonces before generating new one
    cleanupExpiredNonces();
    
    // Generate a cryptographically secure nonce (32 bytes = 64 hex characters)
    const nonce = randomBytes(32).toString('hex');
    
    // Set expiration time (15 minutes from now)
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000);
    
    // Store nonce with metadata
    nonceStore.set(nonce, {
      expiresAt: expirationTime.getTime(),
      used: false
    });
    
    const response: NonceResponse = {
      nonce,
      expirationTime: expirationTime.toISOString(),
      requestId
    };
    
    logger.apiResponse('GET', '/api/siwe/nonce', 200, { 
      nonce: nonce.substring(0, 8) + '...', // Log only first 8 chars for security
      expirationTime: response.expirationTime,
      requestId,
      totalNonces: nonceStore.size
    });
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'ServerError';
    logger.apiResponse('GET', '/api/siwe/nonce', 500, { 
      error: errorMessage,
      requestId,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({
      error: 'Failed to generate nonce',
      details: 'Internal server error',
      requestId
    }, { status: 500 });
  }
}

/**
 * Optional: Handle OPTIONS request for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}