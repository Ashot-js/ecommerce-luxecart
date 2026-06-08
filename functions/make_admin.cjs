'use strict';

const { Pool } = require('pg');

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
  try {
    const users = await pool.query("SELECT id, email, role FROM users ORDER BY created_at DESC LIMIT 5");
    console.log('Users:', JSON.stringify(users.rows, null, 2));

    if (users.rows.length === 0) {
      console.log('\nNo users found in the database.');
    } else if (users.rows.length > 1) {
      console.log('\nMultiple users found. To make a specific user admin, run:');
      console.log('  node make_admin.cjs <email>');
    } else {
      const user = users.rows[0];
      await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [user.id]);
      console.log('\nMade admin:', user.email);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
