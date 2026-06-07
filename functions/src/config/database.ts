import { Pool } from 'pg';

// Supabase PgBouncer pooler — IPv4, port 6543
// Connection params hardcoded to bypass Cloud Run env var conflicts

const pool = new Pool({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.ywqjdeebinalfezgwcfp',
  password: 'LuxeCart2026',
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

export async function query<T = any>(
  text: string,
  params?: any[],
): Promise<{ rows: T[]; rowCount: number }> {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 500) {
    console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
  }
  return { rows: result.rows as T[], rowCount: result.rowCount ?? 0 };
}

export async function transaction<T>(
  fn: (queryFn: typeof query) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
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

export default pool;
