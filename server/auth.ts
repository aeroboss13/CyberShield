import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import type { Request, Response, NextFunction } from 'express';
import type { User } from '@shared/schema';

const scryptAsync = promisify(scrypt);

// Session storage (in-memory for simplicity)
interface Session {
  userId: number;
  createdAt: Date;
  lastAccessed: Date;
}

const sessions = new Map<string, Session>();

// Hash password using scrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await scryptAsync(password, salt, 32) as Buffer;
  return `scrypt:${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

// Verify password against hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [algorithm, saltHex, keyHex] = hash.split(':');
  
  if (algorithm !== 'scrypt' || !saltHex || !keyHex) {
    return false;
  }
  
  const salt = Buffer.from(saltHex, 'hex');
  const storedKey = Buffer.from(keyHex, 'hex');
  const derivedKey = await scryptAsync(password, salt, 32) as Buffer;
  
  return timingSafeEqual(storedKey, derivedKey);
}

// Generate session token
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

// Create session
export function createSession(userId: number): string {
  const token = generateSessionToken();
  const session: Session = {
    userId,
    createdAt: new Date(),
    lastAccessed: new Date()
  };
  
  sessions.set(token, session);
  return token;
}

// Get session
export function getSession(token: string): Session | undefined {
  const session = sessions.get(token);
  if (session) {
    session.lastAccessed = new Date();
  }
  return session;
}

// Delete session
export function deleteSession(token: string): boolean {
  return sessions.delete(token);
}

// Clean up expired sessions (older than 30 days)
export function cleanupExpiredSessions(): void {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  sessions.forEach((session, token) => {
    if (session.lastAccessed < thirtyDaysAgo) {
      sessions.delete(token);
    }
  });
}

// Extract session token from request (from cookie or Authorization header)
export function extractSessionToken(req: Request): string | undefined {
  // First try cookie
  const cookieToken = req.headers.cookie?.split(';')
    .find(c => c.trim().startsWith('session='))
    ?.split('=')[1];
  
  if (cookieToken) {
    return cookieToken;
  }
  
  // Then try Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return undefined;
}

// Middleware: require authentication
export function requireAuth(req: Request & { user?: User }, res: Response, next: NextFunction) {
  const token = extractSessionToken(req);
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  
  // Add user info to request (will be populated by loadCurrentUser middleware)
  (req as any).sessionUserId = session.userId;
  next();
}

// Middleware: load current user into req.user (use after requireAuth)
export function loadCurrentUser(storage: any) {
  return async (req: Request & { user?: User }, res: Response, next: NextFunction) => {
    const sessionUserId = (req as any).sessionUserId;
    
    if (sessionUserId) {
      try {
        const user = await storage.getUser(sessionUserId);
        if (user) {
          req.user = user;
        }
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    }
    
    next();
  };
}

// Middleware: require admin role
export function requireAdmin(req: Request & { user?: User }, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Set session cookie
export function setSessionCookie(res: Response, token: string): void {
  res.cookie('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
}

// Clear session cookie
export function clearSessionCookie(res: Response): void {
  res.clearCookie('session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
}

// Cleanup expired sessions every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);