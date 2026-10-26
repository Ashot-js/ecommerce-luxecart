// Creates all tables and seed data in an empty database.
// Usage: DATABASE_URL=postgresql://... npm run db:setup
import 'dotenv/config';
import fs from 'node:fs';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set (put it in functions/.env or the environment).');
  process.exit(1);
}

const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
const client = new pg.Client({ connectionString: url, ssl: isLocal ? false : { rejectUnauthorized: false } });
const sql = fs.readFileSync(new URL('../../database/schema.sql', import.meta.url), 'utf8');

await client.connect();
try {
  const { rowCount } = await client.query("SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'");
  if (rowCount) {
    console.log('Schema already exists, nothing to do.');
  } else {
    // A query without parameters may contain many statements, including $$-quoted function bodies.
    await client.query(sql);
    console.log('Schema and seed data created.');
  }
} finally {
  await client.end();
}
