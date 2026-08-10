import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Heart, ShoppingBag, Plus, Minus, Check } from 'lucide-react';
import { useApp } from '../../app/providers';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { pageTransition } from '../../lib/framer';

import { getImageUrl } from '../../utils/imageUrl';

type TabType = 'description' | 'ingredients' | 'nutrition';

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, cart, addToCart, updateCartQuantity, removeFromCart, wishlist, toggleWishlist, role } = useApp();

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
      setActiveImage(getImageUrl(prod.image));
      setQuantity(1);
      setActiveTab('description');
    } else {
      navigate('/404');
    }
  }, [id, products, navigate]);


  if (!product) return null;

  const isLiked = wishlist.some((p) => p.id === product.id);
  const cartItem = cart.find((item) => item.product.id === product.id);
  const inCart = !!cartItem;
  
  const displayQuantity = inCart ? cartItem.quantity : quantity;

  // Handlers for quantity
  const handleIncrement = () => {
    if (inCart) {
      updateCartQuantity(product.id, cartItem.quantity + 1);
    } else {
      setQuantity((q) => q + 1);
    }
  };
  const handleDecrement = () => {
    if (inCart) {
      if (cartItem.quantity > 1) {
        updateCartQuantity(product.id, cartItem.quantity - 1);
      } else {
        removeFromCart(product.id);
      }
    } else {
      setQuantity((q) => Math.max(1, q - 1));
    }
  };

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

  // Buy now trigger — adds product with selected quantity to cart and navigates to existing checkout flow
  const handleBuyNow = async () => {
    if (role === 'guest') {
      navigate('/login');
    } else {
      await addToCart(product, quantity);
      navigate('/checkout');
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

  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => {
    if (product) {
      import('../../services/productService').then(({ productService }) => {
        productService.getRelatedProducts(product.id, 4).then(setRelatedProducts);
      });
    }
  }, [product]);

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
          <div className="gallery-container" style={{ position: 'relative' }}>
            <div
              className="main-image-wrapper"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              style={{ position: 'relative' }}
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
              {/* Navigation Arrows for Carousel */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const allImages = [product.image, ...(product.images || [])].filter((v, i, a) => a.indexOf(v) === i);
                  const currentIndex = allImages.findIndex(img => getImageUrl(img) === activeImage);
                  const prevIndex = (currentIndex - 1 + allImages.length) % allImages.length;
                  setActiveImage(getImageUrl(allImages[prevIndex]));
                }}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--gold)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--gold)', cursor: 'pointer', zIndex: 10 }}
              >
                &larr;
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const allImages = [product.image, ...(product.images || [])].filter((v, i, a) => a.indexOf(v) === i);
                  const currentIndex = allImages.findIndex(img => getImageUrl(img) === activeImage);
                  const nextIndex = (currentIndex + 1) % allImages.length;
                  setActiveImage(getImageUrl(allImages[nextIndex]));
                }}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--gold)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--gold)', cursor: 'pointer', zIndex: 10 }}
              >
                &rarr;
              </button>
            </div>

            {/* Thumbnails row */}
            <div className="thumbnail-row" style={{ display: 'flex', gap: '10px', marginTop: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
              {[product.image, ...(product.images || [])]
                .filter((v, i, a) => a.indexOf(v) === i) // Unique images
                .map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(getImageUrl(img))}
                    className={`thumbnail-btn ${activeImage === getImageUrl(img) ? 'active' : ''}`}
                    style={{ flexShrink: 0, width: '80px', height: '80px', padding: 0, border: activeImage === getImageUrl(img) ? '2px solid var(--gold)' : '2px solid transparent', borderRadius: '4px', overflow: 'hidden', cursor: 'pointer' }}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`Product view ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                ))
              }
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
                  {displayQuantity}
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
                <Button 
                  variant={inCart ? "secondary" : "gold"} 
                  size="lg" 
                  fullWidth 
                  onClick={() => inCart ? navigate('/cart') : handleAddToCart()} 
                  glow={!inCart}
                >
                  <ShoppingBag size={18} />
                  {inCart ? 'Go to Cart' : 'Add to Cart'}
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
            {(['description', 'ingredients', 'nutrition'] as TabType[]).map((tab) => (
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '20px' }}>
                {product.nutrition && Object.entries(product.nutrition).map(([key, val]) => (
                  val ? (
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
                        {key === 'servingSize' ? 'Serving Size' :
                         key === 'totalFat' ? 'Total Fat' :
                         key === 'saturatedFat' ? 'Saturated Fat' :
                         key === 'transFat' ? 'Trans Fat' :
                         key === 'cholesterol' ? 'Cholesterol' :
                         key === 'sodium' ? 'Sodium' :
                         key === 'totalCarb' ? 'Total Carbohydrates' :
                         key === 'dietaryFiber' ? 'Dietary Fiber' :
                         key === 'totalSugars' ? 'Total Sugars' :
                         key === 'addedSugars' ? 'Added Sugars' :
                         key === 'calories' ? 'Calories' :
                         key === 'protein' ? 'Protein' :
                         key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--cream)' }}>{val}</span>
                    </div>
                  ) : null
                ))}
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
              Related Products
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
              {relatedProducts.map((prod) => (
                <Card key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
export default ProductDetails;

/* =============================================================
   REVIEWS TAB SECTION COMPONENT
   ============================================================= */

import { productService } from '../../services/productService';
import { Loader2, MessageSquarePlus, AlertCircle } from 'lucide-react';

interface ReviewsTabSectionProps {
  productId: string;
  user: any;
  role: string;
  onReviewAdded: () => void;
}

const ReviewsTabSection: React.FC<ReviewsTabSectionProps> = ({ productId, user, role, onReviewAdded }) => {
  const navigate = useNavigate();
  const [reviewsData, setReviewsData] = useState<{
    reviews: any[];
    average_rating: number;
    total_reviews: number;
    star_breakdown: { [key: number]: number };
  }>({
    reviews: [],
    average_rating: 0,
    total_reviews: 0,
    star_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);

  // Review Form State
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadReviews = () => {
    setLoading(true);
    productService
      .getProductReviewsWithSummary(productId)
      .then((data) => {
        if (data && Array.isArray(data.reviews)) {
          setReviewsData(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText) return;
    if (role === 'guest') {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await productService.createProductReview(productId, {
        author: user?.name || user?.full_name || 'Verified Customer',
        rating,
        text: reviewText,
      });
      setSuccessMessage('Thank you! Your review has been submitted.');
      setReviewText('');
      setShowForm(false);
      loadReviews();
      onReviewAdded();
    } catch (err: any) {
      setErrorMessage(
        err?.detail || err?.message || 'Failed to submit review. Only customers who purchased this product can review.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const { average_rating, total_reviews, star_breakdown, reviews } = reviewsData;

  return (
    <div>
      {/* ── Rating Summary Banner ── */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          border: '1px solid var(--glass-border)',
          borderRadius: '8px',
          marginBottom: '32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          alignItems: 'center',
        }}
      >
        {/* Big Rating Score */}
        <div style={{ textAlign: 'center', borderRight: '1px solid var(--glass-border)', paddingRight: '20px' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 800, color: 'var(--gold)', lineHeight: 1 }}>
            {total_reviews > 0 ? average_rating.toFixed(1) : '—'}
          </span>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', color: 'var(--gold)', margin: '8px 0' }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={16}
                fill={s <= Math.round(average_rating) && total_reviews > 0 ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--beige)' }}>
            {total_reviews > 0 ? `Based on ${total_reviews} review${total_reviews > 1 ? 's' : ''}` : 'No reviews yet'}
          </span>
        </div>

        {/* Star Rating Breakdown Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = star_breakdown?.[star] || 0;
            const pct = total_reviews > 0 ? Math.round((count / total_reviews) * 100) : 0;
            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: 'var(--beige)' }}>
                <span style={{ width: '30px', textAlign: 'right' }}>{star} ★</span>
                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--gold)', transition: 'width 0.3s' }} />
                </div>
                <span style={{ width: '30px', color: 'var(--grey-light)' }}>{count}</span>
              </div>
            );
          })}
        </div>

        {/* Write Review Trigger */}
        <div style={{ textAlign: 'center' }}>
          <Button
            variant="gold"
            glow
            onClick={() => {
              if (role === 'guest') navigate('/login');
              else setShowForm(!showForm);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
          >
            <MessageSquarePlus size={16} /> {showForm ? 'Cancel Review' : 'Write a Review'}
          </Button>
        </div>
      </div>

      {/* Error or Success Alert */}
      {errorMessage && (
        <div style={{ padding: '12px 16px', borderRadius: '4px', background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', color: '#f07070', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {errorMessage}
        </div>
      )}
      {successMessage && (
        <div style={{ padding: '12px 16px', borderRadius: '4px', background: 'rgba(90,190,90,0.1)', border: '1px solid rgba(90,190,90,0.3)', color: '#6fbf6f', fontSize: '0.85rem', marginBottom: '20px' }}>
          {successMessage}
        </div>
      )}

      {/* ── Review Form ── */}
      {showForm && (
        <form
          onSubmit={handleSubmitReview}
          className="glass-panel"
          style={{ padding: '24px', border: '1px solid var(--gold)', borderRadius: '8px', marginBottom: '32px', background: 'rgba(200,160,60,0.03)' }}
        >
          <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--gold)', marginBottom: '16px', margin: '0 0 16px 0' }}>
            Write Your Product Review
          </h4>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--beige)', display: 'block', marginBottom: '8px' }}>Rating *</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setRating(s)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: s <= rating ? 'var(--gold)' : 'var(--glass-border)' }}
                >
                  <Star size={24} fill={s <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--beige)', display: 'block', marginBottom: '6px' }}>Your Review *</label>
            <textarea
              placeholder="How was your experience with this chocolate? Share flavor profile, packaging, etc..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={3}
              required
              style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--cream)', padding: '12px', fontSize: '0.9rem', fontFamily: 'var(--font-body)', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <Button variant="gold" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Submit Review'}
          </Button>
        </form>
      )}

      {/* ── Reviews List ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gold)' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : reviews.length === 0 ? (
        <p style={{ color: 'var(--grey-light)', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
          No reviews for this product yet. Be the first to review!
        </p>
      ) : (
        reviews.map((rev) => (
          <div key={rev.id} className="review-item" style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--chocolate-brown)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.85rem', border: '1px solid var(--gold)' }}>
                  {rev.avatar || rev.author?.substring(0, 2).toUpperCase() || 'U'}
                </div>
                <div>
                  <h5 style={{ color: 'var(--cream)', margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{rev.author}</h5>
                  <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>{rev.date}</span>
                </div>
              </div>
              <div style={{ display: 'flex', color: 'var(--gold)', gap: '2px' }}>
                {Array.from({ length: Math.round(rev.rating) }).map((_, i) => (
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
  );
};

