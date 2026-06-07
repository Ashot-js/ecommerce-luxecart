import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { SafeUser, UserRole } from '../types.js';

// Read JWT_SECRET at call time (NOT at module load — Firebase injects it asynchronously)
function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Check Firebase Secret Manager or .env file.');
  }
  return secret;
}

// Extend Express Request to carry authenticated user
export interface AuthRequest extends Request {
  user?: SafeUser;
}

export interface TokenPayload {
  sub: string;   // user id
  email: string;
  role: UserRole;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getSecret()) as TokenPayload;
}

// Middleware: require a valid JWT
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed authorization header' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      first_name: '',
      last_name: '',
      role: payload.role,
      phone: null,
      address_line1: null,
      address_line2: null,
      city: null,
      state: null,
      zip_code: null,
      country: null,
      created_at: '',
      updated_at: '',
    };
    next();
  } catch (err: any) {
    console.error('Auth error:', err?.message || err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Middleware: require admin role
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

// Optional auth — sets req.user if token is present, but doesn't reject
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      first_name: '',
      last_name: '',
      role: payload.role,
      phone: null,
      address_line1: null,
      address_line2: null,
      city: null,
      state: null,
      zip_code: null,
      country: null,
      created_at: '',
      updated_at: '',
    };
  } catch {
    // Token invalid — just continue without user
  }
  next();
}
