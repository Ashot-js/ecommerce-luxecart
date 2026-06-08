import { useParams, Link } from 'react-router';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Minus, Plus, Truck, Shield, RotateCcw, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { useGetProductQuery } from '../store/api/productsApi';
import { useAddToCartMutation } from '../store/slices/cartSlice';
import { PLACEHOLDER_IMAGE } from '../constants';
import './ProductDetail.scss';

export default function ProductDetail() {
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const { data, isLoading, isError } = useGetProductQuery(slugOrId!);
  const [addToCart, { isLoading: adding }] = useAddToCartMutation();
  const [quantity, setQuantity] = useState(1);

  const product = data?.data;

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart({ product_id: product.id, quantity }).unwrap();
      toast.success(`${product.name} added to cart`);
    } catch {
      toast.error('Please sign in to add items to cart');
    }
  };

  if (isLoading) {
    return (
      <div className="product-detail">
        <div className="container">
          <div className="product-detail__loading">Loading...</div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="product-detail">
        <div className="container">
          <div className="product-detail__error">
            <h2>Product Not Found</h2>
            <Link to="/products">Back to Shop</Link>
          </div>
        </div>
      </div>
    );
  }

  const discount = product.compare_price
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : 0;

  return (
    <div className="product-detail">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="product-detail__breadcrumb">
          <Link to="/products">
            <ChevronLeft size={16} /> Back to Shop
          </Link>
          {product.category_name && (
            <>
              <span>/</span>
              <Link to={`/products?category=${product.category_slug}`}>
                {product.category_name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="product-detail__breadcrumb-current">{product.name}</span>
        </nav>

        <motion.div
          className="product-detail__main"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Image */}
          <div className="product-detail__image-wrap">
            <img
              src={product.image_url || PLACEHOLDER_IMAGE}
              alt={product.name}
              className="product-detail__image"
              fetchPriority="high"
              decoding="async"
            />
            {discount > 0 && (
              <span className="product-detail__discount-badge">-{discount}%</span>
            )}
          </div>

          {/* Info */}
          <div className="product-detail__info">
            {product.category_name && (
              <Link to={`/products?category=${product.category_slug}`} className="product-detail__category">
                {product.category_name}
              </Link>
            )}

            <h1 className="product-detail__name">{product.name}</h1>

            <div className="product-detail__rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  fill={star <= (product.rating ?? 0) ? '#C41E3A' : 'none'}
                  stroke={star <= (product.rating ?? 0) ? '#C41E3A' : '#6B6B6B'}
                />
              ))}
              <span>{product.rating?.toFixed(1) ?? '0.0'} ({product.review_count} reviews)</span>
            </div>

            <div className="product-detail__price">
              <span className="product-detail__price-current">${product.price.toFixed(2)}</span>
              {product.compare_price && (
                <span className="product-detail__price-compare">${product.compare_price.toFixed(2)}</span>
              )}
              {discount > 0 && (
                <span className="product-detail__price-save">Save ${(product.compare_price! - product.price).toFixed(2)}</span>
              )}
            </div>

            <p className="product-detail__description">{product.description}</p>

            <div className="product-detail__stock">
              {product.stock > 0 ? (
                <span className="product-detail__stock-in">
                  <span className="product-detail__stock-dot product-detail__stock-dot--in" />
                  In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="product-detail__stock-out">Out of Stock</span>
              )}
            </div>

            {product.stock > 0 && (
              <div className="product-detail__actions">
                <div className="product-detail__qty">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>
                    <Minus size={16} />
                  </button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={quantity >= product.stock}>
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  className="product-detail__add-btn"
                  onClick={handleAddToCart}
                  disabled={adding}
                >
                  <ShoppingCart size={18} />
                  {adding ? 'Adding...' : 'Add to Cart'}
                </button>
              </div>
            )}

            {/* Features */}
            <div className="product-detail__features">
              <div className="product-detail__feature">
                <Truck size={18} />
                <div>
                  <p className="product-detail__feature-title">Free Shipping</p>
                  <p className="product-detail__feature-sub">On orders over $100</p>
                </div>
              </div>
              <div className="product-detail__feature">
                <Shield size={18} />
                <div>
                  <p className="product-detail__feature-title">2 Year Warranty</p>
                  <p className="product-detail__feature-sub">Full coverage included</p>
                </div>
              </div>
              <div className="product-detail__feature">
                <RotateCcw size={18} />
                <div>
                  <p className="product-detail__feature-title">30-Day Returns</p>
                  <p className="product-detail__feature-sub">Hassle-free returns</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
