import { Router, type Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database.js';
import { validateQuery } from '../middleware/validate.js';
import type { Product, Category, PaginatedResponse, QueryParam } from '../types.js';

const router = Router();

export const PRODUCT_COLUMNS = `
  p.id, p.name, p.slug, p.description,
  p.price, p.compare_price,
  p.stock, p.category_id, p.image_url, p.images,
  p.featured, p.active, p.rating, p.review_count,
  p.created_at, p.updated_at,
  c.name AS category_name, c.slug AS category_slug`;

const SORTS = {
  price_asc: 'p.price ASC',
  price_desc: 'p.price DESC',
  rating: 'p.rating DESC',
  name: 'p.name ASC',
  newest: 'p.created_at DESC',
} as const;

const productQuerySchema = z.object({
  category: z.string().max(120).optional(),
  search: z.string().trim().max(100).optional(),
  min_price: z.coerce.number().min(0).optional(),
  max_price: z.coerce.number().min(0).optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort_by: z.enum(Object.keys(SORTS) as [keyof typeof SORTS]).default('newest'),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Escapes LIKE wildcards so a search for "100%" matches literally.
const likePattern = (s: string) => `%${s.replace(/[\\%_]/g, '\\$&')}%`;

// GET /api/products
router.get('/', validateQuery(productQuerySchema), async (_req, res: Response) => {
  const f = res.locals.query as z.infer<typeof productQuerySchema>;
  const conditions = ['p.active = true'];
  const params: QueryParam[] = [];
  const add = (sql: (n: string) => string, value: QueryParam) => {
    params.push(value);
    conditions.push(sql(`$${params.length}`));
  };

  if (f.category) add((n) => `c.slug = ${n}`, f.category);
  if (f.search) add((n) => `(p.name ILIKE ${n} OR p.description ILIKE ${n})`, likePattern(f.search));
  if (f.min_price !== undefined) add((n) => `p.price >= ${n}`, f.min_price);
  if (f.max_price !== undefined) add((n) => `p.price <= ${n}`, f.max_price);
  if (f.featured) add((n) => `p.featured = ${n}`, f.featured === 'true');

  const from = `FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE ${conditions.join(' AND ')}`;
  const offset = (f.page - 1) * f.limit;

  const [count, products] = await Promise.all([
    query<{ count: string }>(`SELECT COUNT(*) AS count ${from}`, params),
    query<Product>(
      `SELECT ${PRODUCT_COLUMNS} ${from}
       ORDER BY ${SORTS[f.sort_by]}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, f.limit, offset],
    ),
  ]);
  const total = parseInt(count.rows[0]?.count ?? '0', 10);

  const response: PaginatedResponse<Product> = {
    data: products.rows,
    total,
    page: f.page,
    limit: f.limit,
    totalPages: Math.ceil(total / f.limit),
  };
  res.json(response);
});

// GET /api/products/featured
router.get('/featured', async (_req, res: Response) => {
  const { rows } = await query<Product>(
    `SELECT ${PRODUCT_COLUMNS}
     FROM products p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.featured = true AND p.active = true
     ORDER BY p.rating DESC
     LIMIT 8`,
  );
  res.json({ data: rows });
});

// GET /api/products/categories
router.get('/categories', async (_req, res: Response) => {
  const { rows } = await query<Category>('SELECT * FROM categories ORDER BY sort_order ASC');
  res.json({ data: rows });
});

// GET /api/products/:slugOrId
router.get('/:slugOrId', async (req, res: Response) => {
  const { rows } = await query<Product>(
    `SELECT ${PRODUCT_COLUMNS}
     FROM products p LEFT JOIN categories c ON p.category_id = c.id
     WHERE (p.slug = $1 OR p.id::text = $1) AND p.active = true
     LIMIT 1`,
    [req.params.slugOrId],
  );
  if (!rows[0]) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  res.json({ data: rows[0] });
});

export default router;
