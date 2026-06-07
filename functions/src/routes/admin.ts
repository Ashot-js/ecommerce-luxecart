import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database.js';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import type {
  Product, Category, Order, OrderItem,
  UpdateOrderStatusInput, AdminStats,
} from '../types.js';

const router = Router();

// All admin routes require auth + admin role
router.use(authenticate);
router.use(requireAdmin);

// ---- Validation ----
const productSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(300),
  description: z.string().min(1),
  price: z.number().min(0),
  compare_price: z.number().min(0).nullable().optional(),
  stock: z.number().int().min(0),
  category_id: z.string().uuid().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  images: z.array(z.string().url()).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
});

// ---- GET /api/admin/stats ----
router.get('/stats', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [products, orders, users, revenue, recent, lowStock] = await Promise.all([
      query<{ count: string }>('SELECT COUNT(*) as count FROM products WHERE active = true'),
      query<{ count: string }>('SELECT COUNT(*) as count FROM orders'),
      query<{ count: string }>('SELECT COUNT(*) as count FROM users'),
      query<{ sum: string }>(
        `SELECT COALESCE(SUM(total), 0) as sum FROM orders
         WHERE status != 'cancelled'`,
      ),
      query<Order>(
        `SELECT * FROM orders ORDER BY created_at DESC LIMIT 5`,
      ),
      query<Product>(
        `SELECT * FROM products WHERE stock <= 5 AND active = true ORDER BY stock ASC LIMIT 10`,
      ),
    ]);

    const stats: AdminStats = {
      total_products: parseInt(products.rows[0]?.count ?? '0', 10),
      total_orders: parseInt(orders.rows[0]?.count ?? '0', 10),
      total_users: parseInt(users.rows[0]?.count ?? '0', 10),
      total_revenue: parseFloat(revenue.rows[0]?.sum ?? '0'),
      recent_orders: recent.rows,
      low_stock_products: lowStock.rows,
    };

    res.json({ data: stats });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---- GET /api/admin/orders ----
router.get('/orders', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const status = req.query.status as string | undefined;
    const offset = (page - 1) * limit;

    let where = '';
    const params: any[] = [];
    if (status && ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      where = 'WHERE status = $1';
      params.push(status);
    }

    const [orders, countResult] = await Promise.all([
      query<Order>(
        `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset],
      ),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM orders ${where}`, params),
    ]);

    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    res.json({
      data: orders.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Admin orders error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---- GET /api/admin/orders/:orderId ----
router.get('/orders/:orderId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const order = await query<Order>('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (order.rows.length === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const items = await query<OrderItem>(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId],
    );

    res.json({ data: { ...order.rows[0]!, items: items.rows } });
  } catch (err) {
    console.error('Admin get order error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---- PATCH /api/admin/orders/:orderId/status ----
router.patch(
  '/orders/:orderId/status',
  validate(updateOrderStatusSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { status }: UpdateOrderStatusInput = req.body;

      const result = await query<Order>(
        'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
        [status, orderId],
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      res.json({ data: result.rows[0] });
    } catch (err) {
      console.error('Update order status error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// ---- POST /api/admin/products ----
router.post('/products', validate(productSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const p = req.body as z.infer<typeof productSchema>;

    const result = await query<Product>(
      `INSERT INTO products
       (name, slug, description, price, compare_price, stock,
        category_id, image_url, images, featured, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        p.name, p.slug, p.description, p.price,
        p.compare_price ?? null, p.stock,
        p.category_id ?? null, p.image_url ?? null,
        JSON.stringify(p.images ?? []),
        p.featured ?? false, p.active ?? true,
      ],
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err: any) {
    if (err?.code === '23505') {
      res.status(409).json({ error: 'A product with this slug already exists' });
      return;
    }
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---- PUT /api/admin/products/:productId ----
router.put('/products/:productId', validate(productSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const p = req.body as z.infer<typeof productSchema>;

    const result = await query<Product>(
      `UPDATE products SET
        name = $1, slug = $2, description = $3,
        price = $4, compare_price = $5, stock = $6,
        category_id = $7, image_url = $8, images = $9,
        featured = $10, active = $11
       WHERE id = $12
       RETURNING *`,
      [
        p.name, p.slug, p.description, p.price,
        p.compare_price ?? null, p.stock,
        p.category_id ?? null, p.image_url ?? null,
        JSON.stringify(p.images ?? []),
        p.featured ?? false, p.active ?? true,
        productId,
      ],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ data: result.rows[0] });
  } catch (err: any) {
    if (err?.code === '23505') {
      res.status(409).json({ error: 'A product with this slug already exists' });
      return;
    }
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---- DELETE /api/admin/products/:productId ----
router.delete('/products/:productId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    // Soft-delete by marking inactive
    const result = await query<Product>(
      'UPDATE products SET active = false WHERE id = $1 RETURNING *',
      [productId],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---- GET /api/admin/categories ----
router.get('/categories', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query<Category>('SELECT * FROM categories ORDER BY sort_order ASC');
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Admin categories error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
