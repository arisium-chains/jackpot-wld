import { NextRequest, NextResponse } from 'next/server';
import { WORLD_APP_ID, WORLD_ID_ACTION_ID } from '@/constants';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { proof, nullifier_hash, merkle_root, verification_level, signal } = await request.json();

    // Validate required fields
    if (!proof || !nullifier_hash || !merkle_root) {
      return NextResponse.json(
        { success: false, error: 'Missing required proof fields' },
        { status: 400 }
      );
    }

    // Verify the proof with Worldcoin's cloud verification API
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

    if (verifyRes.ok && verifyData.success) {
      // Store nullifier hash to prevent reuse (in production, use a database)
      // For now, we'll just return success
      return NextResponse.json({
        success: true,
        proof: {
          nullifier_hash,
          merkle_root,
          proof,
          verification_level,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Proof verification failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('World ID verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}