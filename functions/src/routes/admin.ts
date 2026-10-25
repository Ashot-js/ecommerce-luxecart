import { Router, type Response } from 'express';
import { z } from 'zod';
import { query, transaction } from '../config/database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate, validateQuery, uuidParam } from '../middleware/validate.js';
import { PRODUCT_COLUMNS } from './products.js';
import type { Product, Category, Order, OrderStatus, AdminStats, QueryParam } from '../types.js';

const router = Router();

router.use(authenticate, requireAdmin);

const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
const LOW_STOCK = 5;

const productSchema = z.object({
  name: z.string().trim().min(1).max(255),
  slug: z.string().trim().min(1).max(300).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, digits and dashes'),
  description: z.string().max(5000).default(''),
  price: z.number().min(0).max(99_999_999),
  compare_price: z.number().min(0).max(99_999_999).nullable().default(null),
  stock: z.number().int().min(0).max(1_000_000),
  category_id: z.string().uuid().nullable().default(null),
  image_url: z.string().url().max(2000).nullable().default(null),
  images: z.array(z.string().url().max(2000)).max(10).default([]),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
});
// Partial update: only the fields that were sent change.
const productPatchSchema = productSchema.partial().refine((p) => Object.keys(p).length > 0, 'Nothing to update');
type ProductInput = z.infer<typeof productSchema>;
const PRODUCT_FIELDS = Object.keys(productSchema.shape) as (keyof ProductInput)[];

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(ORDER_STATUSES).optional(),
  search: z.string().trim().max(100).optional(),
});

const orderStatusSchema = z.object({ status: z.enum(ORDER_STATUSES) });

class StockError extends Error {}

const productValue =(field: keyof ProductInput, value: unknown): QueryParam =>
  field === 'images' ? JSON.stringify(value) : (value as QueryParam);

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}

// Order rows with their items as a JSON array, so the admin list needs one query.
const ORDER_WITH_ITEMS = `
  SELECT o.*,
         COALESCE(
           (SELECT json_agg(json_build_object(
              'id', oi.id, 'product_id', oi.product_id, 'name', oi.name,
              'price', oi.price, 'quantity', oi.quantity, 'image_url', oi.image_url))
            FROM order_items oi WHERE oi.order_id = o.id),
           '[]') AS items
  FROM orders o`;

// GET /api/admin/stats
router.get('/stats', async (_req, res: Response) => {
  const [counts, recent, lowStock] = await Promise.all([
    query<{ products: number; orders: number; users: number; revenue: number }>(
      `SELECT (SELECT COUNT(*) FROM products WHERE active)::int AS products,
              (SELECT COUNT(*) FROM orders)::int AS orders,
              (SELECT COUNT(*) FROM users)::int AS users,
              (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status <> 'cancelled') AS revenue`,
    ),
    query<Order>(`${ORDER_WITH_ITEMS} ORDER BY o.created_at DESC LIMIT 5`),
    query<Product>(
      `SELECT ${PRODUCT_COLUMNS}
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.stock <= $1 AND p.active ORDER BY p.stock ASC LIMIT 10`,
      [LOW_STOCK],
    ),
  ]);
  const c = counts.rows[0]!;
  const stats: AdminStats = {
    total_products: c.products,
    total_orders: c.orders,
    total_users: c.users,
    total_revenue: c.revenue,
    recent_orders: recent.rows,
    low_stock_products: lowStock.rows,
  };
  res.json({ data: stats });
});

// GET /api/admin/products: every product, including hidden ones
router.get('/products', validateQuery(listQuerySchema), async (_req, res: Response) => {
  const { page, limit, search } = res.locals.query as z.infer<typeof listQuerySchema>;
  const params: QueryParam[] = [];
  let where = '';
  if (search) {
    params.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`);
    where = 'WHERE p.name ILIKE $1';
  }
  const from = `FROM products p LEFT JOIN categories c ON p.category_id = c.id ${where}`;
  const [rows, count] = await Promise.all([
    query<Product>(
      `SELECT ${PRODUCT_COLUMNS} ${from} ORDER BY p.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, (page - 1) * limit],
    ),
    query<{ count: number }>(`SELECT COUNT(*)::int AS count ${from}`, params),
  ]);
  const total = count.rows[0]?.count ?? 0;
  res.json({ data: rows.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
});

// POST /api/admin/products
router.post('/products', validate(productSchema), async (req, res: Response) => {
  const p = req.body as ProductInput;
  try {
    const { rows } = await query<Product>(
      `INSERT INTO products (${PRODUCT_FIELDS.join(', ')})
       VALUES (${PRODUCT_FIELDS.map((_, i) => `$${i + 1}`).join(', ')})
       RETURNING *`,
      PRODUCT_FIELDS.map((f) => productValue(f, p[f])),
    );
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    res.status(409).json({ error: 'A product with this slug already exists' });
  }
});

// PATCH /api/admin/products/:productId
router.patch('/products/:productId', uuidParam('productId'), validate(productPatchSchema), async (req, res: Response) => {
  const patch = req.body as Partial<ProductInput>;
  // Column names come from the schema whitelist, values are parameters.
  const fields = PRODUCT_FIELDS.filter((f) => patch[f] !== undefined);
  try {
    const { rows } = await query<Product>(
      `UPDATE products SET ${fields.map((f, i) => `${f} = $${i + 1}`).join(', ')}
       WHERE id = $${fields.length + 1}
       RETURNING *`,
      [...fields.map((f) => productValue(f, patch[f])), req.params.productId as string],
    );
    if (!rows[0]) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ data: rows[0] });
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    res.status(409).json({ error: 'A product with this slug already exists' });
  }
});

// DELETE /api/admin/products/:productId: hides the product; past orders keep referring to it
router.delete('/products/:productId', uuidParam('productId'), async (req, res: Response) => {
  const { rows } = await query<Product>('UPDATE products SET active = false WHERE id = $1 RETURNING *', [
    req.params.productId as string,
  ]);
  if (!rows[0]) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json({ data: rows[0] });
});

// GET /api/admin/categories
router.get('/categories', async (_req, res: Response) => {
  const { rows } = await query<Category>('SELECT * FROM categories ORDER BY sort_order ASC');
  res.json({ data: rows });
});

// GET /api/admin/orders
router.get('/orders', validateQuery(listQuerySchema), async (_req, res: Response) => {
  const { page, limit, status, search } = res.locals.query as z.infer<typeof listQuerySchema>;
  const conditions: string[] = [];
  const params: QueryParam[] = [];
  if (status) {
    params.push(status);
    conditions.push(`o.status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`);
    const n = `$${params.length}`;
    conditions.push(`(o.id::text ILIKE ${n} OR o.shipping_name ILIKE ${n} OR o.shipping_email ILIKE ${n})`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [orders, count] = await Promise.all([
    query<Order>(
      `${ORDER_WITH_ITEMS} ${where} ORDER BY o.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, (page - 1) * limit],
    ),
    query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM orders o ${where}`, params),
  ]);
  const total = count.rows[0]?.count ?? 0;
  res.json({ data: orders.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
});

// GET /api/admin/orders/:orderId
router.get('/orders/:orderId', uuidParam('orderId'), async (req, res: Response) => {
  const { rows } = await query<Order>(`${ORDER_WITH_ITEMS} WHERE o.id = $1`, [req.params.orderId as string]);
  if (!rows[0]) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json({ data: rows[0] });
});

// PATCH /api/admin/orders/:orderId/status
// Cancelling returns the items to stock; un-cancelling takes them again (if still available).
router.patch('/orders/:orderId/status', uuidParam('orderId'), validate(orderStatusSchema), async (req, res: Response) => {
  const { status } = req.body as { status: OrderStatus };
  const orderId = req.params.orderId as string;

  const result = await transaction(async (txn) => {
    const current = await txn<{ status: OrderStatus }>('SELECT status FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
    const prev = current.rows[0]?.status;
    if (!prev) return 'not_found' as const;

    const restock = prev !== 'cancelled' && status === 'cancelled';
    const takeStock = prev === 'cancelled' && status !== 'cancelled';
    if (restock || takeStock) {
      const sign = restock ? '+' : '-';
      const updated = await txn(
        `UPDATE products p SET stock = p.stock ${sign} oi.quantity
         FROM order_items oi
         WHERE oi.order_id = $1 AND p.id = oi.product_id
           ${takeStock ? 'AND p.stock >= oi.quantity' : ''}`,
        [orderId],
      );
      const items = await txn('SELECT 1 FROM order_items WHERE order_id = $1 AND product_id IS NOT NULL', [orderId]);
      if (takeStock && updated.rowCount < items.rowCount) throw new StockError();
    }

    await txn('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
    const { rows } = await txn<Order>(`${ORDER_WITH_ITEMS} WHERE o.id = $1`, [orderId]);
    return rows[0]!;
  }).catch((err) => {
    if (err instanceof StockError) return 'no_stock' as const;
    throw err;
  });

  if (result === 'not_found') res.status(404).json({ error: 'Order not found' });
  else if (result === 'no_stock') res.status(400).json({ error: 'Not enough stock to reopen this order' });
  else res.json({ data: result });
});

export default router;
