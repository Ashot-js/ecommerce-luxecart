/**
 * E2E registration test for LuxeCart API.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... JWT_SECRET=test-secret node test_register.js
 */

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:5001/api';

async function testRegister() {
  const testEmail = `test-${Date.now()}@example.com`;

  console.log('Testing POST /api/auth/register...');

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'testpass123',
        first_name: 'Test',
        last_name: 'User',
      }),
    });

    const data = await res.json();

    if (res.ok && data.token) {
      console.log('OK — Registration successful');
      console.log(`  Email: ${testEmail}`);
      console.log(`  Token received: ${data.token.slice(0, 20)}...`);
    } else {
      console.log('FAIL — Registration failed');
      console.log(`  Status: ${res.status}`);
      console.log(`  Body: ${JSON.stringify(data)}`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

testRegister();
