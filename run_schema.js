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
  const sqlPath = path.join(__dirname, 'database', 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Parse SQL into individual statements.
  // Handles single quotes ('...''...') and dollar-quoted strings ($$...$$ / $tag$...$tag$),
  // so plpgsql function bodies containing ';' do not split incorrectly.
  const batches = [];
  let current = '';
  let i = 0;
  const src = sql;
  while (i < src.length) {
    const c = src[i];
    const rest = src.slice(i);

    // Line comment
    if (c === '-' && src[i + 1] === '-') {
      const nl = src.indexOf('\n', i);
      if (nl === -1) break;
      i = nl + 1;
      continue;
    }

    // Single-quoted string ('' is an escaped quote)
    if (c === "'") {
      current += c;
      i++;
      while (i < src.length) {
        if (src[i] === "'" && src[i + 1] === "'") {
          current += "''";
          i += 2;
        } else if (src[i] === "'") {
          current += "'";
          i++;
          break;
        } else {
          current += src[i];
          i++;
        }
      }
      continue;
    }

    // Dollar-quoted string: $$...$$ or $tag$...$tag$
    if (c === '$') {
      const m = rest.match(/^\$[A-Za-z_0-9]*\$/);
      if (m) {
        const delim = m[0];
        const endIdx = src.indexOf(delim, i + delim.length);
        if (endIdx === -1) {
          current += rest;
          i = src.length;
        } else {
          current += src.slice(i, endIdx + delim.length);
          i = endIdx + delim.length;
        }
        continue;
      }
    }

    // Statement terminator outside of quotes
    if (c === ';') {
      const stmt = current.trim();
      if (stmt && stmt !== ';') {
        batches.push(stmt);
      }
      current = '';
      i++;
      continue;
    }

    current += c;
    i++;
  }
  // Catch any trailing statement without semicolon
  if (current.trim()) batches.push(current.trim());

  try {
    console.log('Connecting to database...');
    await pool.query('SELECT 1');
    console.log('Connected. Running', batches.length, 'statements...\n');

    for (let i = 0; i < batches.length; i++) {
      const stmt = batches[i];
      try {
        await pool.query(stmt);
        const preview = stmt.replace(/\n/g, ' ').substring(0, 80);
        console.log(`  [${i + 1}/${batches.length}] OK: ${preview}...`);
      } catch (err) {
        const msg = err.message || '';
        if (msg.includes('already exists') || msg.includes('does not exist')) {
          console.log(`  [${i + 1}/${batches.length}] SKIP: already exists`);
        } else {
          console.error(`  [${i + 1}/${batches.length}] ERROR: ${msg}`);
          console.error(`  Statement: ${stmt.substring(0, 200)}`);
        }
      }
    }

    console.log('\nDone! Schema applied successfully.\n');

    // Verify
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log('Tables created:');
    tables.rows.forEach(r => console.log(`  - ${r.table_name}`));

  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
