import { NextRequest, NextResponse } from 'next/server';
import { verifyCloudProof } from '@worldcoin/idkit';
import { WORLD_APP_ID, WORLD_ID_ACTION_ID } from '@/constants';

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

    // Verify the proof with Worldcoin's cloud verification
    const verifyRes = await verifyCloudProof(
      proof,
      WORLD_APP_ID as `app_${string}`,
      WORLD_ID_ACTION_ID,
      signal || ''
    );

    if (verifyRes.success) {
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