import { NextResponse } from 'next/server'
import { verifyMessage, isAddress } from 'viem'
import { logger } from '../../../../lib/logger'

// Types for enhanced validation
interface SIWERequest {
  address: string;
  message: string;
  signature: string;
  nonce?: string;
}



interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

// In-memory nonce store (in production, use Redis or database)
const nonceStore = new Map<string, { expiresAt: number; used: boolean }>();

// Rate limiting store
const rateLimitStore = new Map<string, { attempts: number; resetAt: number }>();

// Session store
const sessionStore = new Map<string, { address: string; issuedAt: number; expiresAt: number }>();

/**
 * Enhanced SIWE message validation according to EIP-4361
 */
function validateSIWEMessage(message: string): ValidationResult {
  try {
    logger.debug('Validating SIWE message format', { messageLength: message.length });
    
    // EIP-4361 SIWE message pattern
    const siwePattern = /^([^\n]+) wants you to sign in with your Ethereum account:\n(0x[a-fA-F0-9]{40})\n\n([^\n]*)\n\nURI: ([^\n]+)\nVersion: ([^\n]+)\nChain ID: ([^\n]+)\nNonce: ([^\n]+)\nIssued At: ([^\n]+)(?:\nExpiration Time: ([^\n]+))?(?:\nNot Before: ([^\n]+))?(?:\nRequest ID: ([^\n]+))?(?:\nResources:\n((?:- [^\n]+\n?)*))?$/;
    
    const match = message.match(siwePattern);
    if (!match) {
      return { valid: false, error: 'InvalidSIWEFormat', details: { pattern: 'EIP-4361_mismatch' } };
    }
    
    const [, domain, address, , , version, chainId, nonce, issuedAt, expirationTime] = match;
    
    // Validate domain
    if (!domain || domain.length === 0) {
      return { valid: false, error: 'InvalidDomain', details: { domain } };
    }
    
    // Validate address format
    if (!isAddress(address)) {
      return { valid: false, error: 'InvalidAddress', details: { address } };
    }
    
    // Validate version
    if (version !== '1') {
      return { valid: false, error: 'UnsupportedVersion', details: { version, supported: '1' } };
    }
    
    // Validate chain ID
    const expectedChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '480', 10);
    const chainIdNum = parseInt(chainId, 10);
    if (isNaN(chainIdNum) || chainIdNum !== expectedChainId) {
      return { valid: false, error: 'InvalidChainId', details: { provided: chainId, expected: expectedChainId.toString() } };
    }
    
    // Validate nonce format (64 character hex string)
    if (!/^[a-fA-F0-9]{64}$/.test(nonce)) {
      return { valid: false, error: 'InvalidNonceFormat', details: { nonce: nonce.substring(0, 8) + '...' } };
    }
    
    // Validate timestamp format
    const issuedAtDate = new Date(issuedAt);
    if (isNaN(issuedAtDate.getTime())) {
      return { valid: false, error: 'InvalidTimestamp', details: { issuedAt } };
    }
    
    // Check if message is not too old (max 15 minutes)
    const messageAge = Date.now() - issuedAtDate.getTime();
    if (messageAge > 15 * 60 * 1000) {
      return { valid: false, error: 'MessageExpired', details: { ageMinutes: Math.floor(messageAge / 60000) } };
    }
    
    // Check if message is not from future (allow 5 minute clock skew)
    if (issuedAtDate.getTime() > Date.now() + 5 * 60 * 1000) {
      return { valid: false, error: 'MessageFromFuture', details: { issuedAt } };
    }
    
    // Validate expiration time if present
    if (expirationTime) {
      const expDate = new Date(expirationTime);
      if (isNaN(expDate.getTime())) {
        return { valid: false, error: 'InvalidExpirationTime', details: { expirationTime } };
      }
      if (expDate.getTime() < Date.now()) {
        return { valid: false, error: 'MessageExpired', details: { expirationTime } };
      }
    }
    
    return { valid: true };
  } catch (error) {
    logger.error('SIWE message validation error', { error: String(error) });
    return { valid: false, error: 'ValidationError', details: { error: String(error) } };
  }
}

/**
 * Validate nonce and mark as used
 */
function validateAndConsumeNonce(nonce: string): ValidationResult {
  const nonceData = nonceStore.get(nonce);
  
  if (!nonceData) {
    return { valid: false, error: 'NonceNotFound', details: { nonce: nonce.substring(0, 8) + '...' } };
  }
  
  if (nonceData.used) {
    return { valid: false, error: 'NonceAlreadyUsed', details: { nonce: nonce.substring(0, 8) + '...' } };
  }
  
  if (Date.now() > nonceData.expiresAt) {
    nonceStore.delete(nonce);
    return { valid: false, error: 'NonceExpired', details: { nonce: nonce.substring(0, 8) + '...' } };
  }
  
  // Mark nonce as used
  nonceData.used = true;
  
  return { valid: true };
}

/**
 * Check rate limiting
 */
function checkRateLimit(identifier: string): ValidationResult {
  const now = Date.now();
  const rateData = rateLimitStore.get(identifier);
  
  if (!rateData || now > rateData.resetAt) {
    // Reset or create new rate limit entry
    rateLimitStore.set(identifier, { attempts: 1, resetAt: now + 15 * 60 * 1000 }); // 15 minutes
    return { valid: true };
  }
  
  if (rateData.attempts >= 10) {
    return { valid: false, error: 'RateLimitExceeded', details: { resetAt: rateData.resetAt } };
  }
  
  rateData.attempts++;
  return { valid: true };
}

/**
 * Create authenticated session
 */
function createSession(address: string): string {
  const sessionId = crypto.randomUUID();
  const now = Date.now();
  
  sessionStore.set(sessionId, {
    address,
    issuedAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000 // 24 hours
  });
  
  return sessionId;
}

/**
 * Enhanced SIWE verification endpoint
 */
export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  
  try {
    const requestData: SIWERequest = await req.json();
    const { address, message, signature, nonce } = requestData;
    
    logger.apiRequest('POST', '/api/siwe/verify', { 
      address, 
      messageLength: message?.length,
      hasSignature: !!signature,
      hasNonce: !!nonce,
      requestId 
    });

    // 1. Validate input parameters
    if (!address || !message || !signature) {
      logger.apiResponse('POST', '/api/siwe/verify', 400, { 
        error: 'BadRequest', 
        missing: { address: !address, message: !message, signature: !signature },
        requestId
      });
      return NextResponse.json({ 
        ok: false, 
        error: 'BadRequest',
        details: 'Missing required fields: address, message, or signature'
      }, { status: 400 });
    }

    // 2. Check rate limiting
    const rateLimitResult = checkRateLimit(address);
    if (!rateLimitResult.valid) {
      logger.apiResponse('POST', '/api/siwe/verify', 429, { 
        error: rateLimitResult.error, 
        address,
        requestId
      });
      return NextResponse.json({ 
        ok: false, 
        error: rateLimitResult.error,
        details: rateLimitResult.details
      }, { status: 429 });
    }

    // 3. Validate SIWE message format
    const messageValidation = validateSIWEMessage(message);
    if (!messageValidation.valid) {
      logger.apiResponse('POST', '/api/siwe/verify', 400, { 
        error: messageValidation.error, 
        details: messageValidation.details,
        address,
        requestId
      });
      return NextResponse.json({ 
        ok: false, 
        error: messageValidation.error,
        details: messageValidation.details
      }, { status: 400 });
    }

    // 4. Extract and validate nonce from message
    const nonceMatch = message.match(/Nonce: ([a-fA-F0-9]{64})/);
    const messageNonce = nonceMatch?.[1];
    
    if (!messageNonce) {
      logger.apiResponse('POST', '/api/siwe/verify', 400, { 
        error: 'NonceNotFound', 
        address,
        requestId
      });
      return NextResponse.json({ 
        ok: false, 
        error: 'NonceNotFound',
        details: 'Could not extract nonce from SIWE message'
      }, { status: 400 });
    }

    // 5. Validate and consume nonce
    const nonceValidation = validateAndConsumeNonce(messageNonce);
    if (!nonceValidation.valid) {
      logger.apiResponse('POST', '/api/siwe/verify', 400, { 
        error: nonceValidation.error, 
        address,
        requestId
      });
      return NextResponse.json({ 
        ok: false, 
        error: nonceValidation.error,
        details: nonceValidation.details
      }, { status: 400 });
    }

    // 6. Verify signature cryptographically
    logger.debug('Verifying signature', { address, requestId });
    
    const verified = await verifyMessage({ 
      address: address as `0x${string}`, 
      message, 
      signature: signature as `0x${string}` 
    });
    
    if (!verified) {
      logger.apiResponse('POST', '/api/siwe/verify', 401, { 
        error: 'SignatureInvalid', 
        address,
        requestId
      });
      return NextResponse.json({ 
        ok: false, 
        error: 'SignatureInvalid',
        details: 'Cryptographic signature verification failed'
      }, { status: 401 });
    }

    // 7. Create authenticated session
    const sessionId = createSession(address);
    
    logger.apiResponse('POST', '/api/siwe/verify', 200, { 
      ok: true, 
      address,
      sessionId,
      requestId
    });
    
    return NextResponse.json({ 
      ok: true, 
      sessionId,
      address
    }, {
      status: 200,
      headers: {
        'Set-Cookie': `session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`
      }
    });
    
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : 'ServerError';
    logger.apiResponse('POST', '/api/siwe/verify', 500, { 
      error: errorMessage,
      requestId,
      stack: e instanceof Error ? e.stack : undefined
    });
    return NextResponse.json({ 
      ok: false, 
      error: 'ServerError',
      details: 'Internal server error during verification'
    }, { status: 500 });
  }
}

// Export nonce store functions for nonce endpoint to use
export { nonceStore };