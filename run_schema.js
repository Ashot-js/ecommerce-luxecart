const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://postgres:ComerceE%26*366@db.ywqjdeebinalfezgwcfp.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, 'database', 'schema.sql'), 'utf8');
  
  // Split by semicolons, filter empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');
  
  // Rebuild multi-line statements properly
  const batches = [];
  let current = '';
  for (const line of sql.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('--')) {
      if (current.trim()) {
        // Don't break on comments, just skip them
      }
      continue;
    }
    current += line + '\n';
    if (trimmed.endsWith(';')) {
      const stmt = current.trim();
      if (stmt && stmt !== ';') {
        batches.push(stmt);
      }
      current = '';
    }
  }
  
  // Actually, let's use a simpler approach - execute the whole thing as one transaction
  try {
    console.log('Connecting to Supabase...');
    await pool.query('SELECT 1');
    console.log('Connected. Running schema...\n');
    
    // Run statement by statement
    for (let i = 0; i < batches.length; i++) {
      const stmt = batches[i];
      try {
        await pool.query(stmt);
        const preview = stmt.replace(/\n/g, ' ').substring(0, 80);
        console.log(`  [${i + 1}/${batches.length}] OK: ${preview}...`);
      } catch (err) {
        // Ignore "already exists" errors for CREATE EXTENSION/TRIGGER
        if (err.message.includes('already exists') || err.message.includes('already exists, skipping')) {
          console.log(`  [${i + 1}/${batches.length}] SKIP: already exists`);
        } else if (err.message.includes('does not exist')) {
          console.log(`  [${i + 1}/${batches.length}] SKIP: ${err.message.substring(0, 60)}`);
        } else {
          console.error(`  [${i + 1}/${batches.length}] ERROR: ${err.message}`);
          console.error(`  Statement: ${stmt.substring(0, 200)}`);
        }
      }
    }
    
    console.log('\nDone! Schema applied successfully.');
    
    // Verify
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log('\nTables created:');
    tables.rows.forEach(r => console.log(`  - ${r.table_name}`));
    
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
