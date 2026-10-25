import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import type { UserRole } from '../types.js';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

export function signToken(user: AuthUser): string {
  const payload: TokenPayload = { sub: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, getSecret(), { algorithm: 'HS256', expiresIn: '7d' });
}

function userFromHeader(header: string | undefined): AuthUser | null {
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const p = jwt.verify(header.slice(7), getSecret(), { algorithms: ['HS256'] }) as TokenPayload;
    return { id: p.sub, email: p.email, role: p.role };
  } catch {
    return null;
  }
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const user = userFromHeader(req.headers.authorization);
  if (!user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  req.user = user;
  next();
}

// Sets req.user when a valid token is present, never rejects.
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  req.user = userFromHeader(req.headers.authorization) ?? undefined;
  next();
}

// The role is re-read from the database: a demoted admin loses access immediately,
// not when their 7-day token expires.
export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const { rows } = await query<{ role: UserRole }>('SELECT role FROM users WHERE id = $1', [req.user!.id]);
  if (rows[0]?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
