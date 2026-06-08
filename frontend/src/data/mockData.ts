import type { Product, Category } from '../types';

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Electronics', slug: 'electronics', description: null, image_url: null, sort_order: 1 },
  { id: 'cat-2', name: 'Clothing', slug: 'clothing', description: null, image_url: null, sort_order: 2 },
  { id: 'cat-3', name: 'Home & Garden', slug: 'home-garden', description: null, image_url: null, sort_order: 3 },
  { id: 'cat-4', name: 'Sports', slug: 'sports', description: null, image_url: null, sort_order: 4 },
  { id: 'cat-5', name: 'Books', slug: 'books', description: null, image_url: null, sort_order: 5 },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1', name: 'Wireless Noise-Cancelling Headphones', slug: 'wireless-noise-cancelling-headphones',
    description: 'Premium over-ear wireless headphones with active noise cancellation.',
    price: 249.99, compare_price: 349.99, stock: 50, category_id: 'cat-1', category_name: 'Electronics', category_slug: 'electronics',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', images: [],
    featured: true, active: true, rating: 4.7, review_count: 128, created_at: '', updated_at: '',
  },
  {
    id: 'p2', name: 'Slim Fit Merino Wool Sweater', slug: 'slim-fit-merino-wool-sweater',
    description: 'Luxuriously soft 100% merino wool crew neck sweater.',
    price: 89.99, compare_price: 119.99, stock: 120, category_id: 'cat-2', category_name: 'Clothing', category_slug: 'clothing',
    image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600', images: [],
    featured: true, active: true, rating: 4.5, review_count: 64, created_at: '', updated_at: '',
  },
  {
    id: 'p3', name: 'Ceramic Pour-Over Coffee Set', slug: 'ceramic-pour-over-coffee-set',
    description: 'Handcrafted ceramic pour-over dripper with carafe.',
    price: 44.99, compare_price: null, stock: 80, category_id: 'cat-3', category_name: 'Home & Garden', category_slug: 'home-garden',
    image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600', images: [],
    featured: true, active: true, rating: 4.9, review_count: 41, created_at: '', updated_at: '',
  },
  {
    id: 'p4', name: 'Ultra-Light Running Shoes', slug: 'ultra-light-running-shoes',
    description: 'Engineered mesh upper with responsive foam cushioning.',
    price: 129.99, compare_price: 159.99, stock: 200, category_id: 'cat-4', category_name: 'Sports', category_slug: 'sports',
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', images: [],
    featured: true, active: true, rating: 4.3, review_count: 215, created_at: '', updated_at: '',
  },
  {
    id: 'p5', name: 'USB-C Universal Dock', slug: 'usb-c-universal-dock',
    description: 'Single-cable docking station with dual 4K HDMI.',
    price: 79.99, compare_price: 99.99, stock: 65, category_id: 'cat-1', category_name: 'Electronics', category_slug: 'electronics',
    image_url: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=600', images: [],
    featured: false, active: true, rating: 4.6, review_count: 89, created_at: '', updated_at: '',
  },
  {
    id: 'p6', name: 'Linen Blend Blazer', slug: 'linen-blend-blazer',
    description: 'Tailored unstructured blazer in breathable linen-cotton.',
    price: 159.99, compare_price: 199.99, stock: 45, category_id: 'cat-2', category_name: 'Clothing', category_slug: 'clothing',
    image_url: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600', images: [],
    featured: false, active: true, rating: 4.4, review_count: 37, created_at: '', updated_at: '',
  },
  {
    id: 'p7', name: 'Smart LED Floor Lamp', slug: 'smart-led-floor-lamp',
    description: 'Voice-controlled floor lamp with 16M colors.',
    price: 119.99, compare_price: null, stock: 35, category_id: 'cat-3', category_name: 'Home & Garden', category_slug: 'home-garden',
    image_url: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=600', images: [],
    featured: false, active: true, rating: 4.8, review_count: 53, created_at: '', updated_at: '',
  },
  {
    id: 'p8', name: 'Yoga Mat Premium 6mm', slug: 'yoga-mat-premium-6mm',
    description: 'Non-slip natural rubber yoga mat with alignment lines.',
    price: 68.99, compare_price: 84.99, stock: 150, category_id: 'cat-4', category_name: 'Sports', category_slug: 'sports',
    image_url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600', images: [],
    featured: false, active: true, rating: 4.6, review_count: 92, created_at: '', updated_at: '',
  },
];

export const MOCK_FEATURED = MOCK_PRODUCTS.filter((p) => p.featured);
