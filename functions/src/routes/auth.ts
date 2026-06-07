import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../config/database.js';
import { authenticate, signToken, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import type { User, SafeUser, AuthResponse } from '../types.js';

const router = Router();

// ---- Validation schemas ----
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ---- Helpers ----
function toSafeUser(user: User): SafeUser {
  const { password_hash, ...safe } = user;
  return safe;
}

// ---- Routes ----

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, first_name, last_name } = req.body;

    // Check existing user
    const existing = await query<User>('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'A user with this email already exists' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await query<User>(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [email, password_hash, first_name, last_name],
    );

    const user = toSafeUser(result.rows[0]!);
    const token = signToken({ sub: user.id, email: user.email, role: user.role });

    const response: AuthResponse = { token, user };
    res.status(201).json(response);
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await query<User>('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const user = result.rows[0]!;
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const safe = toSafeUser(user);
    const token = signToken({ sub: safe.id, email: safe.email, role: safe.role });

    const response: AuthResponse = { token, user: safe };
    res.json(response);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query<User>('SELECT * FROM users WHERE id = $1', [req.user!.id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: toSafeUser(result.rows[0]!) });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/auth/profile
router.patch('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { phone, address_line1, address_line2, city, state, zip_code, country } = req.body;
    const result = await query<User>(
      `UPDATE users
       SET phone = COALESCE($1, phone),
           address_line1 = COALESCE($2, address_line1),
           address_line2 = COALESCE($3, address_line2),
           city = COALESCE($4, city),
           state = COALESCE($5, state),
           zip_code = COALESCE($6, zip_code),
           country = COALESCE($7, country)
       WHERE id = $8
       RETURNING *`,
      [phone ?? null, address_line1 ?? null, address_line2 ?? null, city ?? null, state ?? null, zip_code ?? null, country ?? null, req.user!.id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: toSafeUser(result.rows[0]!) });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
