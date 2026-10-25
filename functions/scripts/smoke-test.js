// End-to-end check of the API against a running server and its database.
// Usage: API_BASE=http://localhost:5000/api DATABASE_URL=... npm run smoke
// Creates two throwaway users and one order; the second user is made admin directly in the DB.
import 'dotenv/config';
import pg from 'pg';

const API = process.env.API_BASE || `http://localhost:${process.env.PORT || 5000}/api`;
let failed = 0;

function check(name, ok, extra = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` ${extra}`}`);
  if (!ok) failed++;
}

async function call(method, path, { token, body, raw } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(API + path, { method, headers, body: raw ?? (body && JSON.stringify(body)) });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

const stamp = Date.now();
const customer = { email: `Smoke-${stamp}@Example.com`, password: 'correct-horse-1', first_name: 'Smoke', last_name: 'Test' };

// ---- Public catalogue ----
check('health', (await call('GET', '/health')).status === 200);
const list = await call('GET', '/products?limit=5&sort_by=price_asc');
check('products list', list.status === 200 && list.json.data.length === 5 && typeof list.json.data[0].price === 'number');
check('products sorted', list.json.data.every((p, i, a) => i === 0 || a[i - 1].price <= p.price));
check('search escapes %', (await call('GET', '/products?search=%25%25')).json.data.length === 0);
check('bad sort rejected', (await call('GET', '/products?sort_by=price;drop')).status === 400);
check('featured', (await call('GET', '/products/featured')).json.data.length > 0);
check('categories', (await call('GET', '/products/categories')).json.data.length > 0);
const product = list.json.data.find((p) => p.stock >= 3);
check('product by slug', (await call('GET', `/products/${product.slug}`)).json.data.id === product.id);
check('unknown product 404', (await call('GET', '/products/nope')).status === 404);

// ---- Auth ----
const reg = await call('POST', '/auth/register', { body: customer });
check('register', reg.status === 201 && reg.json.token && !('password_hash' in reg.json.user));
check('email normalised', reg.json.user.email === customer.email.toLowerCase());
check('duplicate register 409', (await call('POST', '/auth/register', { body: customer })).status === 409);
check('short password 400', (await call('POST', '/auth/register', { body: { ...customer, email: `x${stamp}@e.com`, password: '1' } })).status === 400);
check('wrong password 401', (await call('POST', '/auth/login', { body: { email: customer.email, password: 'wrong-pass' } })).status === 401);
const login = await call('POST', '/auth/login', { body: { email: customer.email, password: customer.password } });
check('login', login.status === 200 && login.json.token);
const token = login.json.token;
check('me', (await call('GET', '/auth/me', { token })).json.user.first_name === 'Smoke');
check('no token 401', (await call('GET', '/auth/me')).status === 401);
check('forged token 401', (await call('GET', '/auth/me', { token: token.slice(0, -2) + 'xx' })).status === 401);
const prof = await call('PATCH', '/auth/profile', { token, body: { first_name: 'Renamed', city: 'Yerevan' } });
check('profile saves name', prof.json.user.first_name === 'Renamed' && prof.json.user.city === 'Yerevan');
check('profile too long 400', (await call('PATCH', '/auth/profile', { token, body: { city: 'x'.repeat(500) } })).status === 400);

// ---- Cart ----
const add = await call('POST', '/cart', { token, body: { product_id: product.id, quantity: 2 } });
check('add to cart', add.status === 201);
check('over-stock add 400', (await call('POST', '/cart', { token, body: { product_id: product.id, quantity: 99 } })).status === 400);
const cart = await call('GET', '/cart', { token });
check('cart has item', cart.json.data.length === 1 && typeof cart.json.data[0].product_price === 'number');
check('cart count', (await call('GET', '/cart/count', { token })).json.count === 2);
const itemId = cart.json.data[0].id;
check('update qty', (await call('PATCH', `/cart/${itemId}`, { token, body: { quantity: 1 } })).status === 200);
check('bad item id 404', (await call('PATCH', '/cart/not-a-uuid', { token, body: { quantity: 1 } })).status === 404);
check('invalid JSON 400', (await call('POST', '/cart', { token, raw: '{bad' })).status === 400);

// ---- Checkout ----
const shipping = {
  shipping_name: 'Smoke Test', shipping_email: 'smoke@example.com', shipping_line1: '1 Main St',
  shipping_city: 'Yerevan', shipping_state: 'Yerevan', shipping_zip: '0010',
};
const order = await call('POST', '/orders', { token, body: shipping });
check('create order', order.status === 201 && order.json.data.items.length === 1 && typeof order.json.data.total === 'number');
const after = (await call('GET', `/products/${product.slug}`)).json.data;
check('stock decremented', after.stock === product.stock - 1);
check('cart cleared', (await call('GET', '/cart/count', { token })).json.count === 0);
check('empty cart order 400', (await call('POST', '/orders', { token, body: shipping })).status === 400);
check('my orders', (await call('GET', '/orders', { token })).json.data.length === 1);
check('order detail', (await call('GET', `/orders/${order.json.data.id}`, { token })).json.data.items.length === 1);

// ---- Admin ----
check('customer not admin 403', (await call('GET', '/admin/stats', { token })).status === 403);
const admin = { ...customer, email: `admin-${stamp}@example.com` };
const adminToken = (await call('POST', '/auth/register', { body: admin })).json.token;
const db = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: /@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false } });
await db.connect();
await db.query("UPDATE users SET role = 'admin' WHERE email = $1", [admin.email]);
await db.end();

const stats = await call('GET', '/admin/stats', { token: adminToken });
check('admin stats', stats.status === 200 && stats.json.data.total_orders >= 1 && typeof stats.json.data.total_revenue === 'number');
const aprods = await call('GET', '/admin/products?limit=100', { token: adminToken });
check('admin products', aprods.json.data.length > 0);
const patched = await call('PATCH', `/admin/products/${product.id}`, { token: adminToken, body: { price: 12.5 } });
check('admin patch price', patched.json.data.price === 12.5 && patched.json.data.name === product.name);
await call('PATCH', `/admin/products/${product.id}`, { token: adminToken, body: { price: product.price } });
const aorders = await call('GET', '/admin/orders?search=Smoke', { token: adminToken });
check('admin orders with items', aorders.json.data.some((o) => o.id === order.json.data.id && o.items.length === 1));
const cancel = await call('PATCH', `/admin/orders/${order.json.data.id}/status`, { token: adminToken, body: { status: 'cancelled' } });
check('cancel order', cancel.json.data.status === 'cancelled');
check('cancel restocks', (await call('GET', `/products/${product.slug}`)).json.data.stock === product.stock);
await call('PATCH', `/admin/orders/${order.json.data.id}/status`, { token: adminToken, body: { status: 'processing' } });
check('reopen takes stock', (await call('GET', `/products/${product.slug}`)).json.data.stock === product.stock - 1);
const bad = await call('POST', '/admin/products', { token: adminToken, body: { name: 'x', slug: 'Bad Slug!', price: 1, stock: 1 } });
check('bad slug 400', bad.status === 400);

console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
