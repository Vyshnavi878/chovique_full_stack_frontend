import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Heart, ShoppingBag, Plus, Minus, Check } from 'lucide-react';
import { useApp } from '../../app/providers';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { pageTransition } from '../../lib/framer';

type TabType = 'description' | 'ingredients' | 'nutrition' | 'reviews';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, cart, addToCart, wishlist, toggleWishlist, role } = useApp();

  const [product, setProduct] = useState(products.find((p) => p.id === id));
  const [activeTab, setActiveTab] = useState<TabType>('description');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState('');
  const [addedToCartAlert, setAddedToCartAlert] = useState(false);

  // --- Zoom logic ---
  const [zoomOrigin, setZoomOrigin] = useState('center center');
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setProduct(prod);
      setActiveImage(prod.image);
      setQuantity(1);
      setActiveTab('description');
    } else {
      navigate('/404');
    }
  }, [id, products, navigate]);

  if (!product) return null;

  const isLiked = wishlist.some((p) => p.id === product.id);

  // Handlers for quantity
  const handleIncrement = () => setQuantity((q) => q + 1);
  const handleDecrement = () => setQuantity((q) => Math.max(1, q - 1));

  // Add to cart trigger
  const handleAddToCart = () => {
    if (role === 'guest') {
      navigate('/login');
    } else {
      addToCart(product, quantity);
      setAddedToCartAlert(true);
      setTimeout(() => setAddedToCartAlert(false), 2500);
    }
  };

  // Buy now trigger
  const handleBuyNow = () => {
    if (role === 'guest') {
      navigate('/login');
    } else {
      addToCart(product, quantity);
      navigate('/cart');
    }
  };

  const handleWishlistClick = () => {
    if (role === 'guest') {
      navigate('/login');
    } else {
      toggleWishlist(product);
    }
  };

  // Magnifier coordinates calculator
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  // Related products
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  // Recently viewed products mock list
  const recentlyViewed = products.filter((p) => p.id !== product.id).slice(0, 2);

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="details-page"
    >
      <div className="container">
        {/* Back Link */}
        <Link to="/shop" className="details-back-link">
          <ArrowLeft size={16} />
          Back to Boutique
        </Link>

        {/* Core Layout Grid */}
        <div className="details-grid">
          {/* Gallery Column */}
          <div className="gallery-container">
            <div
              className="main-image-wrapper"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
            >
              <img
                src={activeImage}
                alt={product.name}
                className="zoom-image"
                style={{
                  transform: isZoomed ? 'scale(1.8)' : 'scale(1)',
                  transformOrigin: zoomOrigin,
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1548907040-4d42b52115ca?auto=format&fit=crop&w=800&q=80';
                }}
              />
            </div>

            {/* Thumbnails row */}
            <div className="thumbnail-row">
              <button
                onClick={() => setActiveImage(product.image)}
                className={`thumbnail-btn ${activeImage === product.image ? 'active' : ''}`}
              >
                <img
                  src={product.image}
                  alt="Product view 1"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
              {/* Extra mock thumbnail 1 */}
              <button
                onClick={() =>
                  setActiveImage(
                    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80'
                  )
                }
                className={`thumbnail-btn ${
                  activeImage ===
                  'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80'
                    ? 'active'
                    : ''
                }`}
              >
                <img
                  src="https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=100&q=80"
                  alt="Product view 2"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
              {/* Extra mock thumbnail 2 */}
              <button
                onClick={() =>
                  setActiveImage(
                    'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?auto=format&fit=crop&w=400&q=80'
                  )
                }
                className={`thumbnail-btn ${
                  activeImage ===
                  'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?auto=format&fit=crop&w=400&q=80'
                    ? 'active'
                    : ''
                }`}
              >
                <img
                  src="https://images.unsplash.com/photo-1587132137056-bfbf0166836e?auto=format&fit=crop&w=100&q=80"
                  alt="Product view 3"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </button>
            </div>
          </div>

          {/* Info Details Column */}
          <div className="details-info-column">
            <div>
              {product.badge && (
                <span
                  style={{
                    background: 'var(--gold)',
                    color: 'var(--dark-chocolate)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                    padding: '4px 10px',
                    borderRadius: '2px',
                    display: 'inline-block',
                    marginBottom: '10px',
                  }}
                >
                  {product.badge}
                </span>
              )}
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: 'var(--cream)',
                  lineHeight: 1.15,
                  marginBottom: '10px',
                }}
              >
                {product.name}
              </h1>
              <div className="details-meta-row" style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--gold)' }}>
                  <Star size={16} fill="currentColor" />
                  <span style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '0.95rem' }}>
                    {product.rating}
                  </span>
                  <span style={{ color: 'var(--grey-light)', fontSize: '0.9rem' }}>
                    ({product.ratingsCount} reviews)
                  </span>
                </div>
                <span style={{ color: 'var(--glass-border)' }}>|</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {product.weight}
                </span>
              </div>

              <div className="details-price-row" style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--cream)' }}>
                  ₹{product.price.toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span
                    style={{
                      fontSize: '1.2rem',
                      color: 'var(--grey-light)',
                      textDecoration: 'line-through',
                    }}
                  >
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              <p className="details-description">
                {product.description}
              </p>
            </div>

            {/* Quantity Selector & Wishlist */}
            <div className="details-actions-row">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '4px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  height: '48px',
                }}
              >
                <button
                  onClick={handleDecrement}
                  style={{ padding: '0 16px', color: 'var(--beige)', transition: 'color 0.3s' }}
                >
                  <Minus size={16} />
                </button>
                <span style={{ width: '40px', textAlign: 'center', fontWeight: 600, color: 'var(--cream)' }}>
                  {quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  style={{ padding: '0 16px', color: 'var(--beige)', transition: 'color 0.3s' }}
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                onClick={handleWishlistClick}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '4px',
                  border: '1px solid var(--glass-border)',
                  background: isLiked ? 'var(--rose-gold)' : 'rgba(255, 255, 255, 0.03)',
                  color: isLiked ? 'white' : 'var(--cream)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.3s',
                }}
              >
                <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Action buttons */}
            <div className="details-action-buttons">
              <div style={{ display: 'flex', gap: '15px' }}>
                <Button variant="gold" size="lg" fullWidth onClick={handleAddToCart} glow>
                  <ShoppingBag size={18} />
                  Add to Cart
                </Button>
                <Button variant="glass" size="lg" fullWidth onClick={handleBuyNow}>
                  Buy Now
                </Button>
              </div>

              {addedToCartAlert && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    background: 'rgba(201, 168, 76, 0.1)',
                    border: '1px solid var(--gold)',
                    color: 'var(--gold-light)',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  <Check size={16} />
                  <span>Successfully added to your shopping cart!</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible Tabs details */}
        <div>
          <div className="details-tabs-header">
            {(['description', 'ingredients', 'nutrition', 'reviews'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`details-tab-btn ${activeTab === tab ? 'active' : ''}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ minHeight: '160px', paddingBottom: '40px', borderBottom: '1px solid var(--glass-border)' }}>
            {activeTab === 'description' && (
              <p style={{ color: 'var(--beige)', lineHeight: 1.7, fontSize: '0.98rem' }}>
                {product.description} Crafted with single-origin beans sourced directly from certified organic farms, ensuring a consistent premium taste profile. Slow-tempered under the precise watch of master chocolatiers to create that signature velvet crunch and clean snap.
              </p>
            )}

            {activeTab === 'ingredients' && (
              <p style={{ color: 'var(--beige)', lineHeight: 1.7, fontSize: '0.98rem' }}>
                {product.ingredients}
              </p>
            )}

            {activeTab === 'nutrition' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '20px' }}>
                {Object.entries(product.nutrition).map(([key, val]) => (
                  <div
                    key={key}
                    className="glass-panel"
                    style={{ padding: '16px', textAlign: 'center', border: '1px solid var(--glass-border)' }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--gold)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        display: 'block',
                        marginBottom: '4px',
                      }}
                    >
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--cream)' }}>{val}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                {product.reviews.length === 0 ? (
                  <p style={{ color: 'var(--grey-light)', fontStyle: 'italic' }}>
                    No reviews for this product yet.
                  </p>
                ) : (
                  product.reviews.map((rev) => (
                    <div key={rev.id} className="review-item">
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'var(--chocolate-brown)',
                              color: 'var(--gold)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              border: '1px solid var(--gold)',
                            }}
                          >
                            {rev.avatar || 'U'}
                          </div>
                          <div>
                            <h5 style={{ color: 'var(--cream)', margin: 0, fontWeight: 600 }}>{rev.author}</h5>
                            <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>{rev.date}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', color: 'var(--gold)', gap: '2px' }}>
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} size={12} fill="currentColor" />
                          ))}
                        </div>
                      </div>
                      <p style={{ color: 'var(--beige)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                        "{rev.text}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: '50px' }}>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.8rem',
                color: 'var(--cream)',
                marginBottom: '30px',
              }}
            >
              Related Creations
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
              {relatedProducts.map((prod) => (
                <Card key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        )}

        {/* Recently viewed products */}
        <div style={{ marginTop: '60px' }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              color: 'var(--beige)',
              marginBottom: '20px',
            }}
          >
            Recently Viewed
          </h3>
          <div style={{ display: 'flex', gap: '20px' }}>
            {recentlyViewed.map((prod) => (
              <Link
                key={prod.id}
                to={`/product/${prod.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--glass-border)',
                  padding: '10px 20px',
                  borderRadius: '4px',
                }}
              >
                <img
                  src={prod.image}
                  alt={prod.name}
                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '2px' }}
                />
                <div>
                  <h5 style={{ color: 'var(--cream)', margin: 0, fontSize: '0.9rem' }}>{prod.name}</h5>
                  <span style={{ color: 'var(--gold)', fontSize: '0.8rem' }}>₹{prod.price}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default ProductDetails;
