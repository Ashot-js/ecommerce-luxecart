import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Star, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useGetProductsQuery, useGetCategoriesQuery } from '../store/api/productsApi';
import { useAddToCartMutation } from '../store/slices/cartSlice';
import { toast } from 'react-toastify';
import type { Product } from '../types';
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from '../data/mockData';
import { PLACEHOLDER_IMAGE } from '../constants';
import './Products.scss';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);

  const category = searchParams.get('category') || undefined;
  const featured = searchParams.get('featured') === 'true' || undefined;
  const sortBy = (searchParams.get('sort_by') as any) || 'newest';
  const searchQuery = searchParams.get('search') || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { data, isLoading, isError } = useGetProductsQuery({
    category, search: searchQuery, featured, sort_by: sortBy, page, limit: 12,
  });
  const { data: categoriesData, isError: catError } = useGetCategoriesQuery();
  const [addToCart, { isLoading: isAdding }] = useAddToCartMutation();

  // Fallback to mock data when API is down
  const mockFiltered = useMemo(() => {
    let result = [...MOCK_PRODUCTS];
    if (featured) result = result.filter((p) => p.featured);
    if (category) result = result.filter((p) => p.category_slug === category);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    return result;
  }, [featured, category, searchQuery]);

  const products = isError ? mockFiltered : (data?.data ?? []);
  const categories = catError ? MOCK_CATEGORIES : (categoriesData?.data ?? []);
  const totalPages = isError ? Math.ceil(mockFiltered.length / 12) : (data?.totalPages ?? 1);
  const isOffline = isError || catError;

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.delete('page');
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('search', search || null);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart({ product_id: product.id, quantity: 1 }).unwrap();
      toast.success(`${product.name} added to cart`);
    } catch {
      toast.error('Please sign in to add items to cart');
    }
  };



  return (
    <div className="products-page">
      {/* Offline banner */}
      {isOffline && (
        <div className="offline-banner">
          <AlertTriangle size={16} /> Backend not connected — showing demo data. <a href="https://console.firebase.google.com/project/ecommerce-luxecart/usage/details" target="_blank">Enable Blaze plan</a> and deploy functions.
        </div>
      )}

      {/* Header */}
      <section className="products-page__header">
        <div className="container">
          <h1 className="products-page__title">
            {featured ? 'Featured Products' : searchQuery ? `Search: "${searchQuery}"` : category ? categories.find(c => c.slug === category)?.name || 'Products' : 'Shop All Products'}
          </h1>
          <div className="divider-accent" />
          <p className="products-page__subtitle">
            {products.length} products
          </p>
          {(category || featured || searchQuery) && (
            <button className="products-page__clear-filters" onClick={() => setSearchParams({})}>
              Clear Filters
            </button>
          )}
        </div>
      </section>

      {/* Filters */}
      <div className="products-page__toolbar container">
        <form className="products-page__search" onSubmit={handleSearch}>
          <Search size={18} />
          <input
            type="text" placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <button
          className="products-page__filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={16} /> Filters
        </button>

        <select
          className="products-page__sort"
          value={sortBy}
          onChange={(e) => updateFilter('sort_by', e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      <div className="products-page__body container">
        {/* Filter sidebar */}
        {showFilters && (
          <motion.aside
            className="products-page__filters"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3 className="products-page__filter-heading">Categories</h3>
            <div className="products-page__filter-list">
              <button
                className={`products-page__filter-btn${!category ? ' products-page__filter-btn--active' : ''}`}
                onClick={() => updateFilter('category', null)}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`products-page__filter-btn${category === cat.slug ? ' products-page__filter-btn--active' : ''}`}
                  onClick={() => updateFilter('category', cat.slug)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </motion.aside>
        )}

        {/* Product grid */}
        <div className="products-page__grid">
          {isLoading && products.length === 0 ? (
            <div className="products-page__loading">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="products-page__empty">
              <p>No products found matching your criteria.</p>
              <button onClick={() => setSearchParams({})}>Clear Filters</button>
            </div>
          ) : (
            products.map((product, i) => (
              <motion.div
                key={product.id}
                className="product-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <Link to={`/products/${product.slug}`} className="product-card__image-wrap">
                  <img
                    src={product.image_url || PLACEHOLDER_IMAGE.replace('w=600', 'w=400')}
                    alt={product.name}
                    className="product-card__image"
                    loading="lazy"
                    decoding="async"
                  />
                  {product.compare_price && (
                    <span className="product-card__sale-badge">
                      -{Math.round((1 - product.price / product.compare_price) * 100)}%
                    </span>
                  )}
                </Link>

                <div className="product-card__body">
                  {product.category_name && (
                    <Link to={`/products?category=${product.category_slug}`} className="product-card__category">
                      {product.category_name}
                    </Link>
                  )}
                  <Link to={`/products/${product.slug}`} className="product-card__name">
                    {product.name}
                  </Link>

                  <div className="product-card__rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        fill={star <= (product.rating ?? 0) ? '#C41E3A' : 'none'}
                        stroke={star <= (product.rating ?? 0) ? '#C41E3A' : '#6B6B6B'}
                      />
                    ))}
                    <span>({product.review_count})</span>
                  </div>

                  <div className="product-card__price">
                    <span className="product-card__price-current">${product.price.toFixed(2)}</span>
                    {product.compare_price && (
                      <span className="product-card__price-compare">${product.compare_price.toFixed(2)}</span>
                    )}
                  </div>

                  <button
                    className="product-card__add-btn"
                    onClick={() => handleAddToCart(product)}
                    disabled={isAdding}
                  >
                    <ShoppingCart size={16} />
                    {isAdding ? 'Adding...' : 'Add to Cart'}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="products-page__pagination container">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={`products-page__page-btn${page === i + 1 ? ' products-page__page-btn--active' : ''}`}
              onClick={() => updateFilter('page', String(i + 1))}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
