const { Pool } = require('pg');

const pool = new Pool({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.ywqjdeebinalfezgwcfp',
  password: 'LuxeCart2026',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    const users = await pool.query("SELECT id, email, role FROM users ORDER BY created_at DESC LIMIT 5");
    console.log('Users:', JSON.stringify(users.rows, null, 2));
    
    if (users.rows.length === 1) {
      const user = users.rows[0];
      await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [user.id]);
      console.log('\nMade admin:', user.email);
    } else if (users.rows.length > 1) {
      console.log('\nMultiple users found. Specify email to make admin.');
    } else {
      console.log('No users found.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
