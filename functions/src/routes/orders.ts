import { Router, Response } from 'express';
import { z } from 'zod';
import { query, transaction } from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import type { CartItem, Order, OrderItem, CreateOrderInput } from '../types.js';

const router = Router();

// ---- Validation ----
const createOrderSchema = z.object({
  shipping_name: z.string().min(1, 'Name is required').max(200),
  shipping_email: z.string().email('Invalid email'),
  shipping_phone: z.string().optional(),
  shipping_line1: z.string().min(1, 'Address is required').max(255),
  shipping_line2: z.string().optional(),
  shipping_city: z.string().min(1, 'City is required').max(100),
  shipping_state: z.string().min(1, 'State is required').max(100),
  shipping_zip: z.string().min(1, 'ZIP code is required').max(20),
  shipping_country: z.string().max(100).default('US'),
  notes: z.string().optional(),
});

// ---- All order routes require auth ----
router.use(authenticate);

// GET /api/orders
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query<Order>(
      `SELECT * FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user!.id],
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/orders/:orderId
router.get('/:orderId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    const order = await query<Order>(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, req.user!.id],
    );
    if (order.rows.length === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const items = await query<OrderItem>(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId],
    );

    const fullOrder = { ...order.rows[0]!, items: items.rows };
    res.json({ data: fullOrder });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/orders
router.post('/', validate(createOrderSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const input: CreateOrderInput = req.body;

    // Fetch cart items with product details
    const cartItems = await query<CartItem & { product_name: string; product_price: number; product_image_url: string | null; product_stock: number }>(
      `SELECT ci.*,
              p.name as product_name,
              p.price as product_price,
              p.image_url as product_image_url,
              p.stock as product_stock,
              p.active as product_active
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1`,
      [req.user!.id],
    );

    if (cartItems.rows.length === 0) {
      res.status(400).json({ error: 'Cart is empty' });
      return;
    }

    // Validate stock for all items
    for (const item of cartItems.rows) {
      if (item.quantity > (item.product_stock ?? 0)) {
        res.status(400).json({
          error: `Insufficient stock for "${item.product_name}". Available: ${item.product_stock}`,
        });
        return;
      }
    }

    // Calculate totals
    const subtotal = cartItems.rows.reduce(
      (sum, item) => sum + (item.product_price ?? 0) * item.quantity,
      0,
    );
    const TAX_RATE = 0.08; // 8%
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const shipping_cost = subtotal >= 100 ? 0 : 9.99; // Free shipping over $100
    const total = Math.round((subtotal + tax + shipping_cost) * 100) / 100;

    // Create order in transaction
    const order = await transaction(async (txn) => {
      const orderResult = await txn<Order>(
        `INSERT INTO orders
         (user_id, subtotal, tax, shipping_cost, total,
          shipping_name, shipping_email, shipping_phone,
          shipping_line1, shipping_line2, shipping_city,
          shipping_state, shipping_zip, shipping_country, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING *`,
        [
          req.user!.id, subtotal, tax, shipping_cost, total,
          input.shipping_name, input.shipping_email, input.shipping_phone ?? null,
          input.shipping_line1, input.shipping_line2 ?? null, input.shipping_city,
          input.shipping_state, input.shipping_zip, input.shipping_country ?? 'US',
          input.notes ?? null,
        ],
      );

      const newOrder = orderResult.rows[0]!;

      // Insert order items
      for (const item of cartItems.rows) {
        await txn(
          `INSERT INTO order_items (order_id, product_id, name, price, quantity, image_url)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newOrder.id, item.product_id, item.product_name, item.product_price, item.quantity, item.product_image_url],
        );

        // Deduct stock
        await txn(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.quantity, item.product_id],
        );
      }

      // Clear cart
      await txn('DELETE FROM cart_items WHERE user_id = $1', [req.user!.id]);

      return newOrder;
    });

    // Fetch full order with items
    const items = await query<OrderItem>(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.id],
    );

    res.status(201).json({ data: { ...order, items: items.rows } });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
