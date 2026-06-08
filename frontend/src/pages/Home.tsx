import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { Star, ShoppingCart, ArrowRight, ChevronRight, AlertTriangle } from 'lucide-react';
import { useGetFeaturedProductsQuery, useGetCategoriesQuery } from '../store/api/productsApi';
import type { Product } from '../types';
import { MOCK_FEATURED, MOCK_CATEGORIES } from '../data/mockData';
import { PLACEHOLDER_IMAGE } from '../constants';
import './Home.scss';

// ---- Animation variants ----
const fadeInUp = {
  hidden: { opacity: 0, y: 48 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

// ---- Rating Stars ----
function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="product-card__stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={`product-card__star ${
            i < Math.round(rating) ? 'product-card__star--filled' : ''
          }`}
        />
      ))}
    </span>
  );
}

// ---- ProductCard ----
function ProductCard({ product, index }: { product: Product; index: number }) {
  const imageSrc = product.image_url || PLACEHOLDER_IMAGE;

  return (
    <motion.div
      className="product-card"
      variants={fadeInUp}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/products/${product.slug}`} className="product-card__image-wrap">
        <img
          src={imageSrc}
          alt={product.name}
          className="product-card__image"
          loading={index < 4 ? 'eager' : 'lazy'}
          decoding="async"
        />
        {product.category_name && (
          <span className="product-card__badge">{product.category_name}</span>
        )}
        <div className="product-card__overlay" />
      </Link>

      <div className="product-card__body">
        <RatingStars rating={product.rating} />

        <Link to={`/products/${product.slug}`} className="product-card__name">
          {product.name}
        </Link>

        <div className="product-card__pricing">
          <span className="product-card__price">${product.price.toFixed(2)}</span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="product-card__compare-price">
              ${product.compare_price.toFixed(2)}
            </span>
          )}
        </div>

        <button
          className="product-card__cart-btn"
          aria-label={`Add ${product.name} to cart`}
          disabled={product.stock === 0}
        >
          <ShoppingCart size={16} />
          <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
        </button>
      </div>
    </motion.div>
  );
}

// ---- CategoryCard ----
function CategoryCard({ name, slug, imageUrl }: { name: string; slug: string; imageUrl: string | null }) {
  const bgImage = imageUrl || '/placeholder-category.svg';

  return (
    <motion.div className="category-card" variants={fadeInUp}>
      <Link to={`/products?category=${slug}`} className="category-card__link">
        <div
          className="category-card__bg"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        <div className="category-card__overlay" />
        <div className="category-card__content">
          <h3 className="category-card__name">{name}</h3>
          <span className="category-card__cta">
            Shop Now <ArrowRight size={14} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

// ---- Home Page ----
export default function Home() {
  const {
    data: featuredData,
    isLoading: featuredLoading,
    isError: featuredError,
  } = useGetFeaturedProductsQuery();

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    isError: catError,
  } = useGetCategoriesQuery();

  const featured = featuredError ? MOCK_FEATURED : (featuredData?.data ?? []);
  const categories = catError ? MOCK_CATEGORIES : (categoriesData?.data ?? []);
  const isOffline = featuredError || catError;

  return (
    <main className="home">
      {/* Offline banner */}
      {isOffline && (
        <div className="offline-banner">
          <AlertTriangle size={16} /> Backend not connected — showing demo data.
        </div>
      )}
      {/* ==================== HERO ==================== */}
      <section className="hero">
        <div className="hero__overlay" />
        <motion.div
          className="hero__content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="hero__accent" />
          <h1 className="hero__heading">Elevate Your Lifestyle</h1>
          <p className="hero__subtext">
            Discover a curated collection of premium products designed for the modern connoisseur.
            Quality that speaks, style that stands.
          </p>
          <Link to="/products" className="hero__cta">
            Explore Collection
            <ChevronRight size={18} />
          </Link>
        </motion.div>
        <div className="hero__scroll-indicator">
          <span>↓</span>
        </div>
      </section>

      {/* ==================== FEATURED PRODUCTS ==================== */}
      <section className="featured">
        <div className="featured__container">
          <motion.div
            className="featured__header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            <motion.h2 className="featured__title" variants={fadeInUp}>
              Featured Products
            </motion.h2>
            <motion.div className="featured__divider" variants={fadeInUp}>
              <span className="featured__divider-accent" />
            </motion.div>
            <motion.p className="featured__subtitle" variants={fadeInUp}>
              Hand-picked selections we think you'll love
            </motion.p>
          </motion.div>

          {featuredLoading && (
            <div className="featured__grid">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="product-card product-card--skeleton">
                  <div className="product-card__skeleton-img" />
                  <div className="product-card__skeleton-body">
                    <div className="product-card__skeleton-line product-card__skeleton-line--short" />
                    <div className="product-card__skeleton-line" />
                    <div className="product-card__skeleton-line product-card__skeleton-line--short" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {featuredError && (
            <div className="featured__error">
              <p>Unable to load featured products. Please try again later.</p>
            </div>
          )}

          {!featuredLoading && !featuredError && featured.length > 0 && (
            <motion.div
              className="featured__grid"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={staggerContainer}
            >
              {featured.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </motion.div>
          )}

          {!featuredLoading && !featuredError && featured.length === 0 && (
            <p className="featured__empty">No featured products available at the moment.</p>
          )}

          <motion.div
            className="featured__more"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Link to="/products" className="featured__more-link">
              View All Products <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ==================== CATEGORIES ==================== */}
      <section className="categories">
        <div className="categories__container">
          <motion.div
            className="categories__header"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
          >
            <motion.h2 className="categories__title" variants={fadeInUp}>
              Shop by Category
            </motion.h2>
            <motion.div className="categories__divider" variants={fadeInUp}>
              <span className="categories__divider-accent" />
            </motion.div>
          </motion.div>

          {categoriesLoading && (
            <div className="categories__grid">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="category-card category-card--skeleton">
                  <div className="category-card__skeleton-bg" />
                  <div className="category-card__skeleton-line" />
                </div>
              ))}
            </div>
          )}

          {!categoriesLoading && categories.length > 0 && (
            <motion.div
              className="categories__grid"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={staggerContainer}
            >
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  name={cat.name}
                  slug={cat.slug}
                  imageUrl={cat.image_url}
                />
              ))}
            </motion.div>
          )}

          {!categoriesLoading && categories.length === 0 && (
            <p className="categories__empty">No categories available.</p>
          )}
        </div>
      </section>
    </main>
  );
}
