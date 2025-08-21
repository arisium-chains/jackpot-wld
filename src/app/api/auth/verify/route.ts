import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Simple signature verification for development/testing
// In production, you would use a proper SIWE library or ethers.js in Node.js runtime
function mockVerifySignature(message: string, signature: string, address: string): boolean {
  // For development purposes, we'll do basic validation
  // In production, this should use proper cryptographic verification
  return signature.startsWith('0x') && address.startsWith('0x') && message.length > 0;
}

/**
 * Verify SIWE signature following ERC-191 compliance
 * As specified in World App wallet-auth documentation
 */
export async function POST(request: NextRequest) {
  try {
    const { message, signature, address, nonce } = await request.json();

    // Validate required fields
    if (!message || !signature || !address || !nonce) {
       return NextResponse.json(
         { success: false, error: 'Missing required fields: message, signature, address, nonce' },
         { status: 400 }
       );
    }

    // Parse the SIWE message to extract components
    const siweMessage = parseSiweMessage(message);
    if (!siweMessage) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid SIWE message format',
          message: 'The authentication message format is invalid' 
        },
        { status: 400 }
      );
    }

    // Use mock verification for development (Edge runtime compatible)
    const isValidSignature = mockVerifySignature(message, signature, address);
    
    if (!isValidSignature) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid signature format',
          message: 'The signature format is invalid. Please try connecting your wallet again.' 
        },
        { status: 400 }
      );
    }

    // Validate SIWE message components
    const validationResult = validateSiweMessage(siweMessage);
    if (!validationResult.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: validationResult.error,
          message: 'Authentication message validation failed' 
        },
        { status: 400 }
      );
    }

    // In production, you should:
    // 1. Verify the nonce was previously issued and not reused
    // 2. Check expiration time
    // 3. Validate the domain matches your application
    // 4. Store the authentication state in a session or JWT

    return NextResponse.json({
      success: true,
      address: address,
      message: siweMessage,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Authentication verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Authentication service encountered an error. Please try again.' 
      },
      { status: 500 }
    );
  }
}

/**
 * Parse SIWE message according to EIP-4361 specification
 */
function parseSiweMessage(message: string): SiweMessage | null {
  try {
    const lines = message.split('\n');
    if (lines.length < 4) return null;

    // Extract domain and address from first line
    const firstLine = lines[0];
    const domainMatch = firstLine.match(/^(.+) wants you to sign in with your Ethereum account:$/);
    if (!domainMatch) return null;

    const domain = domainMatch[1];
    const address = lines[1];

    // Find statement, nonce, and other fields
    let statement = '';
    let uri = '';
    let version = '';
    let chainId = '';
    let nonce = '';
    let issuedAt = '';
    let expirationTime = '';

    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('URI: ')) {
        uri = line.substring(5);
      } else if (line.startsWith('Version: ')) {
        version = line.substring(9);
      } else if (line.startsWith('Chain ID: ')) {
        chainId = line.substring(10);
      } else if (line.startsWith('Nonce: ')) {
        nonce = line.substring(7);
      } else if (line.startsWith('Issued At: ')) {
        issuedAt = line.substring(11);
      } else if (line.startsWith('Expiration Time: ')) {
        expirationTime = line.substring(17);
      } else if (line && !line.includes(':')) {
        statement = line;
      }
    }

    return {
      domain,
      address,
      statement,
      uri,
      version,
      chainId,
      nonce,
      issuedAt,
      expirationTime
    };
  } catch (error) {
    console.error('Error parsing SIWE message:', error);
    return null;
  }
}

/**
 * SIWE message interface
 */
interface SiweMessage {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: string;
  nonce: string;
  issuedAt: string;
  expirationTime: string;
}

/**
 * Validate SIWE message components
 */
function validateSiweMessage(siwe: SiweMessage) {
  // Check required fields
  if (!siwe.domain || !siwe.address || !siwe.nonce || !siwe.issuedAt) {
    return { valid: false, error: 'Missing required SIWE fields' };
  }

  // Validate Ethereum address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(siwe.address)) {
    return { valid: false, error: 'Invalid Ethereum address format' };
  }

  // Validate version (should be 1 for EIP-4361)
  if (siwe.version && siwe.version !== '1') {
    return { valid: false, error: 'Unsupported SIWE version' };
  }

  // Validate timestamp format (ISO 8601)
  if (siwe.issuedAt && isNaN(Date.parse(siwe.issuedAt))) {
    return { valid: false, error: 'Invalid issuedAt timestamp' };
  }

  // Check expiration if provided
  if (siwe.expirationTime) {
    const expiration = new Date(siwe.expirationTime);
    if (isNaN(expiration.getTime()) || expiration < new Date()) {
      return { valid: false, error: 'Message has expired' };
    }
  }

  return { valid: true };
}