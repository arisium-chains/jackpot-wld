import { NextRequest, NextResponse } from 'next/server';
import { WORLD_APP_ID, WORLD_ID_ACTION_ID } from '@/constants';
import { logger } from '@/lib/logger';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    const { proof, nullifier_hash, merkle_root, verification_level, signal } = await request.json();

    logger.apiRequest('POST', '/api/worldid/verify', {
      hasProof: !!proof,
      hasNullifierHash: !!nullifier_hash,
      hasMerkleRoot: !!merkle_root,
      verificationLevel: verification_level,
      hasSignal: !!signal,
      component: 'WorldIDVerifyAPI',
      action: 'verificationRequest',
      requestId
    });

    // Validate required fields
    if (!proof || !nullifier_hash || !merkle_root) {
      const errorResponse = { success: false, error: 'Missing required proof fields' };
      
      logger.apiResponse('POST', '/api/worldid/verify', 400, {
        ...errorResponse,
        component: 'WorldIDVerifyAPI',
        action: 'validationError',
        requestId
      });
      
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Verify the proof with Worldcoin's cloud verification API
    logger.info('Sending verification request to Worldcoin API', {
      component: 'WorldIDVerifyAPI',
      action: 'worldcoinAPIRequest',
      requestId,
      appId: WORLD_APP_ID,
      actionId: WORLD_ID_ACTION_ID,
      verificationLevel: verification_level
    });
    
    const verifyRes = await fetch('https://developer.worldcoin.org/api/v1/verify/' + WORLD_APP_ID, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nullifier_hash,
        merkle_root,
        proof,
        verification_level,
        action: WORLD_ID_ACTION_ID,
        signal: signal || ''
      })
    });

    const verifyData = await verifyRes.json();
    
    logger.info('Received response from Worldcoin API', {
      component: 'WorldIDVerifyAPI',
      action: 'worldcoinAPIResponse',
      requestId,
      status: verifyRes.status.toString(),
      success: verifyData.success
    });

    if (verifyRes.ok && verifyData.success) {
      const successResponse = {
        success: true,
        proof: {
          nullifier_hash,
          merkle_root,
          proof,
          verification_level,
        },
      };
      
      logger.apiResponse('POST', '/api/worldid/verify', 200, {
        ...successResponse,
        component: 'WorldIDVerifyAPI',
        action: 'verificationSuccess',
        requestId
      });
      
      return NextResponse.json(successResponse);
    } else {
      const errorResponse = { success: false, error: 'Proof verification failed' };
      
      logger.apiResponse('POST', '/api/worldid/verify', 400, {
        ...errorResponse,
        component: 'WorldIDVerifyAPI',
        action: 'verificationFailed',
        requestId,
        worldcoinError: verifyData
      });
      
      return NextResponse.json(errorResponse, { status: 400 });
    }
  } catch (error) {
    const errorResponse = { success: false, error: 'Internal server error' };
    
    logger.apiResponse('POST', '/api/worldid/verify', 500, {
      ...errorResponse,
      component: 'WorldIDVerifyAPI',
      action: 'internalError',
      requestId,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}