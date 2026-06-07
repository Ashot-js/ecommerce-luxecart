// ============================================================
// Shared TypeScript types for the e-commerce platform
// These mirror the PostgreSQL schema
// ============================================================

// ---- Enums ----
export type UserRole = 'customer' | 'admin';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

// ---- DB Models ----
export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_price: number | null;
  stock: number;
  category_id: string | null;
  image_url: string | null;
  images: string[];
  featured: boolean;
  active: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  product_name?: string;
  product_price?: number;
  product_image_url?: string | null;
  product_stock?: number;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string | null;
  shipping_line1: string;
  shipping_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  created_at: string;
}

// ---- API Request / Response types ----
export interface RegisterInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: SafeUser;
}

export type SafeUser = Omit<User, 'password_hash'>;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  details?: any;
}

export interface AddToCartInput {
  product_id: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export interface CreateOrderInput {
  shipping_name: string;
  shipping_email: string;
  shipping_phone?: string;
  shipping_line1: string;
  shipping_line2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country?: string;
  notes?: string;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  featured?: boolean;
  sort_by?: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'name';
  page?: number;
  limit?: number;
}

export interface AdminStats {
  total_products: number;
  total_orders: number;
  total_users: number;
  total_revenue: number;
  recent_orders: Order[];
  low_stock_products: Product[];
}
