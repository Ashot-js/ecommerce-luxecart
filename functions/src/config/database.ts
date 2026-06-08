import { Pool } from 'pg';
import type { QueryParam } from '../types.js';

// Lazy pool — created on first query, not at module load.
// Firebase needs to analyse the code at deploy time without DATABASE_URL set.
// In production, set the secret before the first request:
//   firebase functions:secrets:set DATABASE_URL

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Check Firebase Secret Manager.');
  }

  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err.message);
  });

  return pool;
}

export async function query<T = unknown>(
  text: string,
  params?: QueryParam[],
): Promise<{ rows: T[]; rowCount: number }> {
  const start = Date.now();
  const result = await getPool().query(text, params);
  const duration = Date.now() - start;
  if (duration > 500) {
    console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
  }
  return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
}

export async function transaction<T>(
  fn: (queryFn: typeof query) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const clientQuery: typeof query = async (text, params) => {
      const result = await client.query(text, params);
      return { rows: result.rows, rowCount: result.rowCount ?? 0 };
    };
    const result = await fn(clientQuery);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export default getPool;
