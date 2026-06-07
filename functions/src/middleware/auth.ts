import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { SafeUser, UserRole } from '../types.js';

// JWT_SECRET is set as a Firebase secret
const JWT_SECRET = process.env.JWT_SECRET || '';

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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
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
  } catch {
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
