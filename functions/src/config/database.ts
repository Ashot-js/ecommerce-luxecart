import pg, { Pool } from 'pg';
import type { QueryParam } from '../types.js';

// NUMERIC (prices, totals) arrives as a string by default; the API returns numbers.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, parseFloat);

let pool: Pool | null = null;

// Created on first query so scripts can import this module without DATABASE_URL.
function getPool(): Pool {
  if (pool) return pool;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  pool = new Pool({
    connectionString: url,
    // Hosted Postgres (Neon / Supabase) requires TLS; a local dev database usually has none.
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  pool.on('error', (err) => console.error('PostgreSQL pool error:', err.message));
  return pool;
}

export type QueryFn = <T = unknown>(
  text: string,
  params?: QueryParam[],
) => Promise<{ rows: T[]; rowCount: number }>;

export const query: QueryFn = async (text, params) => {
  const start = Date.now();
  const result = await getPool().query(text, params);
  const duration = Date.now() - start;
  if (duration > 500) console.warn(`Slow query (${duration}ms):`, text.slice(0, 100));
  return { rows: result.rows, rowCount: result.rowCount ?? 0 };
};

export async function transaction<T>(fn: (txn: QueryFn) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(async (text, params) => {
      const r = await client.query(text, params);
      return { rows: r.rows, rowCount: r.rowCount ?? 0 };
    });
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
