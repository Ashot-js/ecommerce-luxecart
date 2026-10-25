// Gives an existing user the admin role.
// Usage: DATABASE_URL=postgresql://... npm run make-admin -- user@example.com
import 'dotenv/config';
import pg from 'pg';

const url = process.env.DATABASE_URL;
const email = process.argv[2]?.trim().toLowerCase();
if (!url || !email) {
  console.error('Usage: DATABASE_URL=... npm run make-admin -- user@example.com');
  process.exit(1);
}

const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
const client = new pg.Client({ connectionString: url, ssl: isLocal ? false : { rejectUnauthorized: false } });

await client.connect();
try {
  const { rowCount } = await client.query("UPDATE users SET role = 'admin' WHERE email = $1", [email]);
  console.log(rowCount ? `${email} is now an admin.` : `No user with email ${email}. Register first.`);
} finally {
  await client.end();
}
