-- LuxeCart E-Commerce Database Schema
-- PostgreSQL (Supabase free tier: 500MB)
-- Run this via Supabase SQL Editor or psql after creating the project

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('customer', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  role          user_role NOT NULL DEFAULT 'customer',
  phone         VARCHAR(30),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city          VARCHAR(100),
  state         VARCHAR(100),
  zip_code      VARCHAR(20),
  country       VARCHAR(100) DEFAULT 'US',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(100) UNIQUE NOT NULL,
  slug        VARCHAR(120) UNIQUE NOT NULL,
  description TEXT,
  image_url   TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  slug          VARCHAR(300) UNIQUE NOT NULL,
  description   TEXT NOT NULL,
  price         NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  compare_price NUMERIC(10, 2) CHECK (compare_price IS NULL OR compare_price >= 0),
  stock         INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url     TEXT,
  images        JSONB DEFAULT '[]'::jsonb,
  featured      BOOLEAN NOT NULL DEFAULT false,
  active        BOOLEAN NOT NULL DEFAULT true,
  rating        NUMERIC(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count  INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX idx_products_active ON products(active) WHERE active = true;
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

-- ============================================================
-- CART ITEMS (persisted cart, linked to user)
-- ============================================================
CREATE TABLE cart_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_cart_items_user ON cart_items(user_id);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          order_status NOT NULL DEFAULT 'pending',
  total           NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  subtotal        NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  tax             NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_cost   NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_name   VARCHAR(200) NOT NULL,
  shipping_email  VARCHAR(255) NOT NULL,
  shipping_phone  VARCHAR(30),
  shipping_line1  VARCHAR(255) NOT NULL,
  shipping_line2  VARCHAR(255),
  shipping_city   VARCHAR(100) NOT NULL,
  shipping_state  VARCHAR(100) NOT NULL,
  shipping_zip    VARCHAR(20) NOT NULL,
  shipping_country VARCHAR(100) NOT NULL DEFAULT 'US',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE SET NULL,
  name       VARCHAR(255) NOT NULL,
  price      NUMERIC(10, 2) NOT NULL,
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  image_url  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================================
-- STORED PROCEDURES / TRIGGERS
-- ============================================================

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED DATA: Categories
-- ============================================================
INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Electronics', 'electronics', 'Phones, laptops, audio, and accessories', 1),
  ('Clothing', 'clothing', 'Apparel, shoes, and accessories', 2),
  ('Home & Garden', 'home-garden', 'Furniture, decor, and outdoor', 3),
  ('Sports', 'sports', 'Fitness, outdoor, and recreation', 4),
  ('Books', 'books', 'Fiction, non-fiction, and educational', 5);

-- ============================================================
-- SEED DATA: Products
-- ============================================================
INSERT INTO products (name, slug, description, price, compare_price, stock, category_id, image_url, featured, rating, review_count) VALUES
  (
    'Wireless Noise-Cancelling Headphones',
    'wireless-noise-cancelling-headphones',
    'Premium over-ear wireless headphones with active noise cancellation, 30-hour battery life, and ultra-comfortable memory foam ear cushions.',
    249.99, 349.99, 50,
    (SELECT id FROM categories WHERE slug = 'electronics'),
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
    true, 4.7, 128
  ),
  (
    'Slim Fit Merino Wool Sweater',
    'slim-fit-merino-wool-sweater',
    'Luxuriously soft 100% merino wool crew neck sweater. Temperature regulating, breathable, and machine washable.',
    89.99, 119.99, 120,
    (SELECT id FROM categories WHERE slug = 'clothing'),
    'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600',
    true, 4.5, 64
  ),
  (
    'Ceramic Pour-Over Coffee Set',
    'ceramic-pour-over-coffee-set',
    'Handcrafted ceramic pour-over dripper with matching 600ml carafe and 4 reusable filters. Elevate your morning ritual.',
    44.99, null, 80,
    (SELECT id FROM categories WHERE slug = 'home-garden'),
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
    true, 4.9, 41
  ),
  (
    'Ultra-Light Running Shoes',
    'ultra-light-running-shoes',
    'Engineered mesh upper with responsive foam cushioning. At only 198g, these are our lightest running shoes yet.',
    129.99, 159.99, 200,
    (SELECT id FROM categories WHERE slug = 'sports'),
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
    true, 4.3, 215
  ),
  (
    'USB-C Universal Dock',
    'usb-c-universal-dock',
    'Single-cable docking station with dual 4K HDMI, 100W pass-through charging, 3 USB-A, SD card reader, and gigabit ethernet.',
    79.99, 99.99, 65,
    (SELECT id FROM categories WHERE slug = 'electronics'),
    'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=600',
    false, 4.6, 89
  ),
  (
    'Linen Blend Blazer',
    'linen-blend-blazer',
    'Tailored unstructured blazer in a breathable linen-cotton blend. Notch lapel, patch pockets, and natural stretch.',
    159.99, 199.99, 45,
    (SELECT id FROM categories WHERE slug = 'clothing'),
    'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600',
    false, 4.4, 37
  ),
  (
    'Smart LED Floor Lamp',
    'smart-led-floor-lamp',
    'Voice-controlled floor lamp with 16M colors, tunable white, and sunset timer. Works with Alexa, Google Home, and Apple HomeKit.',
    119.99, null, 35,
    (SELECT id FROM categories WHERE slug = 'home-garden'),
    'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600',
    false, 4.8, 53
  ),
  (
    'Yoga Mat Premium 6mm',
    'yoga-mat-premium-6mm',
    'Non-slip natural rubber yoga mat with alignment lines. Eco-friendly, odorless, and comes with a carrying strap.',
    68.99, 84.99, 150,
    (SELECT id FROM categories WHERE slug = 'sports'),
    'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600',
    false, 4.6, 92
  );
