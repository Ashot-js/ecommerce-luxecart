import { Router, type Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { validate, uuidParam } from '../middleware/validate.js';
import type { CartItem } from '../types.js';

const router = Router();

const MAX_QTY = 99;

const addToCartSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').max(MAX_QTY),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity must be 0 or more').max(MAX_QTY),
});

router.use(authenticate);

// GET /api/cart
router.get('/', async (req: AuthRequest, res: Response) => {
  const { rows } = await query<CartItem>(
    `SELECT ci.*,
            p.name AS product_name,
            p.price AS product_price,
            p.image_url AS product_image_url,
            p.stock AS product_stock
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.user_id = $1 AND p.active = true
     ORDER BY ci.created_at DESC`,
    [req.user!.id],
  );
  res.json({ data: rows });
});

// GET /api/cart/count
router.get('/count', async (req: AuthRequest, res: Response) => {
  const { rows } = await query<{ count: number }>(
    `SELECT COALESCE(SUM(ci.quantity), 0)::int AS count
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.user_id = $1 AND p.active = true`,
    [req.user!.id],
  );
  res.json({ count: rows[0]?.count ?? 0 });
});

// POST /api/cart: adds to the existing quantity; the total may not exceed stock.
router.post('/', validate(addToCartSchema), async (req: AuthRequest, res: Response) => {
  const { product_id, quantity } = req.body as z.infer<typeof addToCartSchema>;

  const product = await query<{ stock: number }>(
    'SELECT stock FROM products WHERE id = $1 AND active = true',
    [product_id],
  );
  const stock = product.rows[0]?.stock;
  if (stock === undefined) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  // The WHERE on the upsert rejects the update when the new total would exceed stock.
  const { rows } = await query<CartItem>(
    `INSERT INTO cart_items (user_id, product_id, quantity)
     SELECT $1::uuid, $2::uuid, $3::int WHERE $3::int <= $4::int
     ON CONFLICT (user_id, product_id)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
       WHERE cart_items.quantity + EXCLUDED.quantity <= LEAST($4::int, ${MAX_QTY})
     RETURNING *`,
    [req.user!.id, product_id, quantity, stock],
  );
  if (!rows[0]) {
    res.status(400).json({ error: 'Insufficient stock' });
    return;
  }
  res.status(201).json({ data: rows[0] });
});

// PATCH /api/cart/:itemId: quantity 0 removes the item.
router.patch('/:itemId', uuidParam('itemId'), validate(updateCartItemSchema), async (req: AuthRequest, res: Response) => {
  const { quantity } = req.body as z.infer<typeof updateCartItemSchema>;
  const itemId = req.params.itemId as string;

  if (quantity === 0) {
    const del = await query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [itemId, req.user!.id]);
    if (del.rowCount === 0) {
      res.status(404).json({ error: 'Cart item not found' });
      return;
    }
    res.json({ data: null });
    return;
  }

  const { rows } = await query<CartItem & { stock: number }>(
    `UPDATE cart_items ci SET quantity = $1
     FROM products p
     WHERE ci.id = $2 AND ci.user_id = $3 AND p.id = ci.product_id AND p.stock >= $1
     RETURNING ci.*`,
    [quantity, itemId, req.user!.id],
  );
  if (rows[0]) {
    res.json({ data: rows[0] });
    return;
  }
  const exists = await query('SELECT 1 FROM cart_items WHERE id = $1 AND user_id = $2', [itemId, req.user!.id]);
  if (exists.rowCount === 0) res.status(404).json({ error: 'Cart item not found' });
  else res.status(400).json({ error: 'Insufficient stock' });
});

// DELETE /api/cart/:itemId
router.delete('/:itemId', uuidParam('itemId'), async (req: AuthRequest, res: Response) => {
  const result = await query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [
    req.params.itemId as string,
    req.user!.id,
  ]);
  if (result.rowCount === 0) {
    res.status(404).json({ error: 'Cart item not found' });
    return;
  }
  res.json({ data: null });
});

// DELETE /api/cart: clears the cart
router.delete('/', async (req: AuthRequest, res: Response) => {
  await query('DELETE FROM cart_items WHERE user_id = $1', [req.user!.id]);
  res.json({ data: null });
});

export default router;
