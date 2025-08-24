import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Generate a cryptographically secure nonce for SIWE authentication
 * Following EIP-4361 Sign-In with Ethereum specification
 */
export async function GET() {
  try {
    // Generate a cryptographically secure random nonce using Web Crypto API
    // Using 32 bytes (256 bits) for high entropy
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const nonce = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // In production, you should store this nonce with an expiration time
    // and associate it with the user's session to prevent replay attacks
    
    return NextResponse.json({
      success: true,
      nonce,
      // Nonce expires in 10 minutes (600 seconds)
      expiresAt: Date.now() + 600000
    });
  } catch (error) {
    console.error('Nonce generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Nonce generation failed',
        message: 'Authentication service temporarily unavailable. Please try again.' 
      },
      { status: 500 }
    );
  }
}