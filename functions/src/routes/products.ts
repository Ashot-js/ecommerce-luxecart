import { Router, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/database.js';
import { optionalAuth, AuthRequest } from '../middleware/auth.js';
import { validateQuery } from '../middleware/validate.js';
import type { Product, Category, PaginatedResponse, ProductFilters } from '../types.js';

const router = Router();

// ---- Validation ----
const productQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  min_price: z.coerce.number().optional(),
  max_price: z.coerce.number().optional(),
  featured: z.enum(['true', 'false']).optional(),
  sort_by: z.enum(['price_asc', 'price_desc', 'newest', 'rating', 'name']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ---- Routes ----

// GET /api/products
router.get('/', validateQuery(productQuerySchema), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, search, min_price, max_price, featured, sort_by, page, limit } = req.query as unknown as ProductFilters;
    const conditions: string[] = ['p.active = true'];
    const params: any[] = [];
    let paramIdx = 1;

    if (category) {
      conditions.push(`c.slug = $${paramIdx++}`);
      params.push(category);
    }

    if (search) {
      conditions.push(`(p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (min_price !== undefined) {
      conditions.push(`p.price >= $${paramIdx++}`);
      params.push(min_price);
    }

    if (max_price !== undefined) {
      conditions.push(`p.price <= $${paramIdx++}`);
      params.push(max_price);
    }

    if (featured !== undefined) {
      conditions.push(`p.featured = $${paramIdx++}`);
      params.push(featured);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sorting
    let orderBy = 'p.created_at DESC';
    switch (sort_by) {
      case 'price_asc': orderBy = 'p.price ASC'; break;
      case 'price_desc': orderBy = 'p.price DESC'; break;
      case 'newest': orderBy = 'p.created_at DESC'; break;
      case 'rating': orderBy = 'p.rating DESC'; break;
      case 'name': orderBy = 'p.name ASC'; break;
    }

    const offset = ((page ?? 1) - 1) * (limit ?? 20);

    // Count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${where}`,
      params,
    );
    const total = parseInt(countResult.rows[0]?.count ?? '0', 10);

    // Fetch
    const products = await query<Product>(
      `SELECT p.id, p.name, p.slug, p.description,
              p.price::float8 as price, p.compare_price::float8 as "compare_price",
              p.stock, p.category_id, p.image_url, p.images,
              p.featured, p.active, p.rating::float8 as rating, p.review_count,
              p.created_at, p.updated_at,
              c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       ${where}
       ORDER BY ${orderBy}
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset],
    );

    const response: PaginatedResponse<Product & { category_name?: string; category_slug?: string }> = {
      data: products.rows,
      total,
      page: page ?? 1,
      limit: limit ?? 20,
      totalPages: Math.ceil(total / (limit ?? 20)),
    };
    res.json(response);
  } catch (err: any) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Internal server error', details: err?.message || String(err) });
  }
});

// GET /api/products/featured
router.get('/featured', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query<Product>(
      `SELECT p.id, p.name, p.slug, p.description,
              p.price::float8 as price, p.compare_price::float8 as "compare_price",
              p.stock, p.category_id, p.image_url, p.images,
              p.featured, p.active, p.rating::float8 as rating, p.review_count,
              p.created_at, p.updated_at,
              c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.featured = true AND p.active = true
       ORDER BY p.rating DESC
       LIMIT 8`,
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Get featured error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/categories
router.get('/categories', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await query<Category>(
      'SELECT * FROM categories ORDER BY sort_order ASC',
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/:slugOrId
router.get('/:slugOrId', optionalAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slugOrId } = req.params;

    // Try by slug first, then by UUID
    const result = await query<Product>(
      `SELECT p.id, p.name, p.slug, p.description,
              p.price::float8 as price, p.compare_price::float8 as "compare_price",
              p.stock, p.category_id, p.image_url, p.images,
              p.featured, p.active, p.rating::float8 as rating, p.review_count,
              p.created_at, p.updated_at,
              c.name as category_name, c.slug as category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE (p.slug = $1 OR p.id::text = $1) AND p.active = true
       LIMIT 1`,
      [slugOrId],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({ data: result.rows[0] });
  } catch (err: any) {
    console.error('Get product error:', err);
    res.status(500).json({ error: 'Internal server error', details: err?.message || String(err) });
  }
});

export default router;
