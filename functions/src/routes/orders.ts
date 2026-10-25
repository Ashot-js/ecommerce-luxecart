import { Router, type Response } from 'express';
import { z } from 'zod';
import { query, transaction } from '../config/database.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { validate, uuidParam } from '../middleware/validate.js';
import type { Order, OrderItem } from '../types.js';

const router = Router();

const TAX_RATE = 0.08;
const FREE_SHIPPING_FROM = 100;
const SHIPPING_COST = 9.99;

const text = (max: number) => z.string().trim().min(1).max(max);
const createOrderSchema = z.object({
  shipping_name: text(200),
  shipping_email: z.string().trim().email('Invalid email').max(255),
  shipping_phone: z.string().trim().max(30).optional(),
  shipping_line1: text(255),
  shipping_line2: z.string().trim().max(255).optional(),
  shipping_city: text(100),
  shipping_state: text(100),
  shipping_zip: text(20),
  shipping_country: text(100).default('US'),
  notes: z.string().trim().max(1000).optional(),
});

const round2 = (n: number) => Math.round(n * 100) / 100;

class CheckoutError extends Error {}

router.use(authenticate);

// GET /api/orders
router.get('/', async (req: AuthRequest, res: Response) => {
  const { rows } = await query<Order>(
    'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
    [req.user!.id],
  );
  res.json({ data: rows });
});

// GET /api/orders/:orderId
router.get('/:orderId', uuidParam('orderId'), async (req: AuthRequest, res: Response) => {
  const orderId = req.params.orderId as string;
  const order = await query<Order>('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [orderId, req.user!.id]);
  if (!order.rows[0]) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  const items = await query<OrderItem>('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
  res.json({ data: { ...order.rows[0], items: items.rows } });
});

// POST /api/orders: turns the cart into an order.
// Everything runs in one transaction with the product rows locked, so two
// simultaneous checkouts cannot both buy the last item.
router.post('/', validate(createOrderSchema), async (req: AuthRequest, res: Response) => {
  const input = req.body as z.infer<typeof createOrderSchema>;
  const userId = req.user!.id;

  try {
    const order = await transaction(async (txn) => {
      const { rows: cart } = await txn<{
        product_id: string; quantity: number; name: string; price: number;
        image_url: string | null; stock: number; active: boolean;
      }>(
        `SELECT ci.product_id, ci.quantity, p.name, p.price,
                p.image_url, p.stock, p.active
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         WHERE ci.user_id = $1
         ORDER BY p.id
         FOR UPDATE OF p`,
        [userId],
      );

      if (cart.length === 0) throw new CheckoutError('Cart is empty');
      for (const item of cart) {
        if (!item.active) throw new CheckoutError(`"${item.name}" is no longer available`);
        if (item.quantity > item.stock) {
          throw new CheckoutError(`Insufficient stock for "${item.name}". Available: ${item.stock}`);
        }
      }

      const subtotal = round2(cart.reduce((sum, i) => sum + i.price * i.quantity, 0));
      const tax = round2(subtotal * TAX_RATE);
      const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;
      const total = round2(subtotal + tax + shipping);

      const { rows } = await txn<Order>(
        `INSERT INTO orders
         (user_id, subtotal, tax, shipping_cost, total,
          shipping_name, shipping_email, shipping_phone,
          shipping_line1, shipping_line2, shipping_city,
          shipping_state, shipping_zip, shipping_country, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING *`,
        [
          userId, subtotal, tax, shipping, total,
          input.shipping_name, input.shipping_email, input.shipping_phone || null,
          input.shipping_line1, input.shipping_line2 || null, input.shipping_city,
          input.shipping_state, input.shipping_zip, input.shipping_country,
          input.notes || null,
        ],
      );
      const newOrder = rows[0]!;

      for (const item of cart) {
        await txn(
          `INSERT INTO order_items (order_id, product_id, name, price, quantity, image_url)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [newOrder.id, item.product_id, item.name, item.price, item.quantity, item.image_url],
        );
        await txn('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.product_id]);
      }
      await txn('DELETE FROM cart_items WHERE user_id = $1', [userId]);

      const items = await txn<OrderItem>('SELECT * FROM order_items WHERE order_id = $1', [newOrder.id]);
      return { ...newOrder, items: items.rows };
    });

    res.status(201).json({ data: order });
  } catch (err) {
    if (err instanceof CheckoutError) {
      res.status(400).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
