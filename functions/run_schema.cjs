'use strict';

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  console.error('Create a .env file: DATABASE_URL=postgresql://user:password@host:5432/dbname');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const sqlPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const batches = [];
  let current = '';
  for (const line of sql.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('--')) continue;
    current += line + '\n';
    if (trimmed.endsWith(';')) {
      batches.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) batches.push(current.trim());

  try {
    console.log('Connecting to database...');
    await pool.query('SELECT 1');
    console.log('Connected. Running', batches.length, 'statements...\n');

    for (let i = 0; i < batches.length; i++) {
      const stmt = batches[i];
      try {
        await pool.query(stmt);
        const preview = stmt.replace(/\n/g, ' ').substring(0, 70);
        console.log('[' + (i + 1) + '/' + batches.length + '] OK: ' + preview + '...');
      } catch (err) {
        const msg = err.message || '';
        if (msg.includes('already exists') || msg.includes('does not exist')) {
          console.log('[' + (i + 1) + '/' + batches.length + '] SKIP: already exists');
        } else {
          console.error('[' + (i + 1) + '/' + batches.length + '] ERROR: ' + msg);
          console.error('  Statement: ' + stmt.substring(0, 200));
        }
      }
    }

    console.log('\n--- Schema applied ---\n');

    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('Tables:');
    tables.rows.forEach(r => console.log('  - ' + r.table_name));

    const cats = await pool.query('SELECT count(*) as cnt FROM categories');
    const prods = await pool.query('SELECT count(*) as cnt FROM products');
    console.log('\nSeed data: ' + cats.rows[0].cnt + ' categories, ' + prods.rows[0].cnt + ' products');

  } catch (err) {
    console.error('Fatal: ' + err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
