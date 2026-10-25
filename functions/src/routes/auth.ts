import { Router, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { query } from '../config/database.js';
import { authenticate, signToken, type AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import type { User, SafeUser, AuthResponse } from '../types.js';

const router = Router();

// Slows down password guessing: 10 login/register attempts per IP per 15 minutes.
const authLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, skipSuccessfulRequests: true });

const email = z.string().trim().toLowerCase().email('Invalid email address').max(255);

const registerSchema = z.object({
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  first_name: z.string().trim().min(1, 'First name is required').max(100),
  last_name: z.string().trim().min(1, 'Last name is required').max(100),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(72),
});

// Empty string clears an optional field; an omitted field keeps its value.
const optional = (max: number) => z.string().trim().max(max).optional();
const profileSchema = z.object({
  first_name: z.string().trim().min(1).max(100).optional(),
  last_name: z.string().trim().min(1).max(100).optional(),
  phone: optional(30),
  address_line1: optional(255),
  address_line2: optional(255),
  city: optional(100),
  state: optional(100),
  zip_code: optional(20),
  country: optional(100),
});

const PROFILE_FIELDS = Object.keys(profileSchema.shape) as (keyof z.infer<typeof profileSchema>)[];

// Compared against when the email is unknown, so both cases take the same time.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser', 12);

function toSafeUser(user: User): SafeUser {
  const { password_hash: _, ...safe } = user;
  return safe;
}

function authResponse(user: User): AuthResponse {
  const safe = toSafeUser(user);
  return { token: signToken(safe), user: safe };
}

// POST /api/auth/register
router.post('/register', authLimiter, validate(registerSchema), async (req, res: Response) => {
  const { email, password, first_name, last_name } = req.body as z.infer<typeof registerSchema>;
  const password_hash = await bcrypt.hash(password, 12);

  const result = await query<User>(
    `INSERT INTO users (email, password_hash, first_name, last_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING
     RETURNING *`,
    [email, password_hash, first_name, last_name],
  );
  if (result.rowCount === 0) {
    res.status(409).json({ error: 'A user with this email already exists' });
    return;
  }
  res.status(201).json(authResponse(result.rows[0]!));
});

// POST /api/auth/login
router.post('/login', authLimiter, validate(loginSchema), async (req, res: Response) => {
  const { email, password } = req.body as z.infer<typeof loginSchema>;
  const { rows } = await query<User>('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];

  const valid = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }
  res.json(authResponse(user));
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const { rows } = await query<User>('SELECT * FROM users WHERE id = $1', [req.user!.id]);
  if (!rows[0]) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user: toSafeUser(rows[0]) });
});

// PATCH /api/auth/profile
router.patch('/profile', authenticate, validate(profileSchema), async (req: AuthRequest, res: Response) => {
  const input = req.body as z.infer<typeof profileSchema>;
  const fields = PROFILE_FIELDS.filter((f) => input[f] !== undefined);
  if (fields.length === 0) {
    res.status(400).json({ error: 'Nothing to update' });
    return;
  }

  // Column names come from the fixed whitelist above, values are parameters.
  const set = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = fields.map((f) => input[f] || null);
  const { rows } = await query<User>(
    `UPDATE users SET ${set} WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, req.user!.id],
  );
  if (!rows[0]) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user: toSafeUser(rows[0]) });
});

export default router;
