import { NextResponse } from 'next/server';
import { logger } from '../../../../lib/logger';

// Types for session management
interface SessionData {
  address: string;
  issuedAt: number;
  expiresAt: number;
  lastActivity: number;
  isWorldIDVerified: boolean;
  permissions: string[];
  ipAddress?: string;
  userAgent?: string;
}

interface SessionValidationResult {
  valid: boolean;
  session?: SessionData;
  error?: string;
}

// In-memory session store (in production, use Redis or database)
const sessionStore = new Map<string, SessionData>();

// Session cleanup interval (5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start session cleanup interval
 */
function startSessionCleanup(): void {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    cleanExpiredSessions();
  }, CLEANUP_INTERVAL);
}

/**
 * Clean expired sessions
 */
function cleanExpiredSessions(): void {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [sessionId, session] of sessionStore.entries()) {
    if (now > session.expiresAt) {
      sessionStore.delete(sessionId);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    logger.debug('Cleaned expired sessions', { 
      count: cleanedCount, 
      remaining: sessionStore.size 
    });
  }
}

/**
 * Validate session and update last activity
 */
function validateSession(sessionId: string): SessionValidationResult {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    return { valid: false, error: 'SessionNotFound' };
  }
  
  const now = Date.now();
  
  if (now > session.expiresAt) {
    sessionStore.delete(sessionId);
    return { valid: false, error: 'SessionExpired' };
  }
  
  // Update last activity
  session.lastActivity = now;
  
  return { valid: true, session };
}

/**
 * Create new session
 */
function createSession(
  address: string, 
  duration: number = 24 * 60 * 60 * 1000, // 24 hours default
  options: Partial<SessionData> = {}
): string {
  const sessionId = crypto.randomUUID();
  const now = Date.now();
  
  const sessionData: SessionData = {
    address,
    issuedAt: now,
    expiresAt: now + duration,
    lastActivity: now,
    isWorldIDVerified: false,
    permissions: ['basic'],
    ...options
  };
  
  sessionStore.set(sessionId, sessionData);
  
  // Start cleanup if not already running
  startSessionCleanup();
  
  logger.info('Session created', { 
    sessionId: sessionId.substring(0, 8) + '...', 
    address, 
    expiresAt: new Date(sessionData.expiresAt).toISOString() 
  });
  
  return sessionId;
}

/**
 * Update session data
 */
function updateSession(sessionId: string, updates: Partial<SessionData>): boolean {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    return false;
  }
  
  Object.assign(session, updates);
  session.lastActivity = Date.now();
  
  return true;
}

/**
 * GET /api/auth/session - Get current session info
 */
export async function GET(req: Request) {
  const requestId = crypto.randomUUID();
  
  try {
    // Extract session ID from cookie or Authorization header
    const cookies = req.headers.get('cookie') || '';
    const sessionCookie = cookies.split(';')
      .find(c => c.trim().startsWith('session='));
    
    const authHeader = req.headers.get('authorization');
    const sessionId = sessionCookie?.split('=')[1] || 
                     (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);
    
    if (!sessionId) {
      return NextResponse.json({
        authenticated: false,
        error: 'NoSession'
      }, { status: 401 });
    }
    
    const validation = validateSession(sessionId);
    
    if (!validation.valid) {
      return NextResponse.json({
        authenticated: false,
        error: validation.error
      }, { status: 401 });
    }
    
    const session = validation.session!;
    
    // Return session info (without sensitive data)
    return NextResponse.json({
      authenticated: true,
      session: {
        address: session.address,
        issuedAt: session.issuedAt,
        expiresAt: session.expiresAt,
        lastActivity: session.lastActivity,
        isWorldIDVerified: session.isWorldIDVerified,
        permissions: session.permissions
      }
    });
    
  } catch (error) {
    logger.error('Session validation error', { 
      error: String(error), 
      requestId 
    });
    
    return NextResponse.json({
      authenticated: false,
      error: 'ServerError'
    }, { status: 500 });
  }
}

/**
 * POST /api/auth/session - Create new session (called by SIWE verify)
 */
export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  
  try {
    const body = await req.json();
    const { address, duration, isWorldIDVerified, permissions } = body;
    
    if (!address) {
      return NextResponse.json({
        success: false,
        error: 'Address required'
      }, { status: 400 });
    }
    
    // Extract client info for session tracking
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    const sessionId = createSession(address, duration, {
      isWorldIDVerified: isWorldIDVerified || false,
      permissions: permissions || ['basic'],
      ipAddress: clientIP,
      userAgent
    });
    
    return NextResponse.json({
      success: true,
      sessionId
    }, {
      status: 201,
      headers: {
        'Set-Cookie': `session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/`
      }
    });
    
  } catch (error) {
    logger.error('Session creation error', { 
      error: String(error), 
      requestId 
    });
    
    return NextResponse.json({
      success: false,
      error: 'ServerError'
    }, { status: 500 });
  }
}

/**
 * PUT /api/auth/session - Update session data
 */
export async function PUT(req: Request) {
  const requestId = crypto.randomUUID();
  
  try {
    const body = await req.json();
    const { isWorldIDVerified, permissions } = body;
    
    // Extract session ID
    const cookies = req.headers.get('cookie') || '';
    const sessionCookie = cookies.split(';')
      .find(c => c.trim().startsWith('session='));
    
    const sessionId = sessionCookie?.split('=')[1];
    
    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'NoSession'
      }, { status: 401 });
    }
    
    const validation = validateSession(sessionId);
    
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 401 });
    }
    
    // Update session
    const updates: Partial<SessionData> = {};
    if (typeof isWorldIDVerified === 'boolean') {
      updates.isWorldIDVerified = isWorldIDVerified;
    }
    if (Array.isArray(permissions)) {
      updates.permissions = permissions;
    }
    
    const updated = updateSession(sessionId, updates);
    
    if (!updated) {
      return NextResponse.json({
        success: false,
        error: 'UpdateFailed'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      session: sessionStore.get(sessionId)
    });
    
  } catch (error) {
    logger.error('Session update error', { 
      error: String(error), 
      requestId 
    });
    
    return NextResponse.json({
      success: false,
      error: 'ServerError'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/session - Destroy session (logout)
 */
export async function DELETE(req: Request) {
  const requestId = crypto.randomUUID();
  
  try {
    // Extract session ID
    const cookies = req.headers.get('cookie') || '';
    const sessionCookie = cookies.split(';')
      .find(c => c.trim().startsWith('session='));
    
    const sessionId = sessionCookie?.split('=')[1];
    
    if (sessionId) {
      const session = sessionStore.get(sessionId);
      sessionStore.delete(sessionId);
      
      if (session) {
        logger.info('Session destroyed', { 
          sessionId: sessionId.substring(0, 8) + '...', 
          address: session.address 
        });
      }
    }
    
    return NextResponse.json({
      success: true
    }, {
      status: 200,
      headers: {
        'Set-Cookie': 'session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/'
      }
    });
    
  } catch (error) {
    logger.error('Session destruction error', { 
      error: String(error), 
      requestId 
    });
    
    return NextResponse.json({
      success: false,
      error: 'ServerError'
    }, { status: 500 });
  }
}

// Export for use in other modules
export { sessionStore, validateSession, createSession, updateSession };