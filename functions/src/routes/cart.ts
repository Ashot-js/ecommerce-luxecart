import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import type { CartItem, Product, AddToCartInput, UpdateCartItemInput } from '../types.js';

const router = Router();

// ---- Validation ----
const addToCartSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(99),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity must be 0 or more').max(99),
});

// ---- All cart routes require auth ----
router.use(authenticate);

// GET /api/cart
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query<CartItem>(
      `SELECT ci.*,
              p.name as product_name,
              p.price as product_price,
              p.image_url as product_image_url,
              p.stock as product_stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1 AND p.active = true
       ORDER BY ci.created_at DESC`,
      [req.user!.id],
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/cart/count
router.get('/count', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query<{ count: string }>(
      `SELECT COALESCE(SUM(ci.quantity), 0) as count
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1 AND p.active = true`,
      [req.user!.id],
    );
    res.json({ count: parseInt(result.rows[0]?.count ?? '0', 10) });
  } catch (err) {
    console.error('Get cart count error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/cart
router.post('/', validate(addToCartSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { product_id, quantity }: AddToCartInput = req.body;

    // Verify product exists and is active
    const product = await query<Product>(
      'SELECT id, stock, active FROM products WHERE id = $1',
      [product_id],
    );
    if (product.rows.length === 0 || !product.rows[0]?.active) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    if ((product.rows[0]?.stock ?? 0) < quantity) {
      res.status(400).json({ error: 'Insufficient stock' });
      return;
    }

    // Upsert cart item
    const result = await query<CartItem>(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + $3, updated_at = NOW()
       RETURNING *`,
      [req.user!.id, product_id, quantity],
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/cart/:itemId
router.patch('/:itemId', validate(updateCartItemSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const itemId = req.params.itemId as string;
    const { quantity }: UpdateCartItemInput = req.body;

    // Verify item belongs to user
    const existing = await query<CartItem>(
      'SELECT * FROM cart_items WHERE id = $1 AND user_id = $2',
      [itemId, req.user!.id],
    );
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Cart item not found' });
      return;
    }

    if (quantity === 0) {
      await query('DELETE FROM cart_items WHERE id = $1', [itemId]);
      res.json({ data: null });
      return;
    }

    // Check stock
    const product = await query<Product>(
      'SELECT stock FROM products WHERE id = $1',
      [existing.rows[0]!.product_id],
    );
    if (quantity > (product.rows[0]?.stock ?? 0)) {
      res.status(400).json({ error: 'Insufficient stock' });
      return;
    }

    const result = await query<CartItem>(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *',
      [quantity, itemId],
    );
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Update cart item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/cart/:itemId
router.delete('/:itemId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const itemId = req.params.itemId as string;
    const result = await query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
      [itemId, req.user!.id],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Cart item not found' });
      return;
    }
    res.json({ data: null });
  } catch (err) {
    console.error('Delete cart item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/cart (clear cart)
router.delete('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await query('DELETE FROM cart_items WHERE user_id = $1', [req.user!.id]);
    res.json({ data: null });
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
