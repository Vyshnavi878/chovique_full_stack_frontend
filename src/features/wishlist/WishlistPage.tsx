import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useApp } from '../../app/providers';
import { Button } from '../../components/ui/Button';
import { pageTransition, hoverLift } from '../../lib/framer';

export const WishlistPage: React.FC = () => {
  const { wishlist, moveToCart, toggleWishlist } = useApp();
  const navigate = useNavigate();

  if (wishlist.length === 0) {
    return (
      <motion.div
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          paddingTop: '120px',
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          background: 'var(--gradient-hero)',
        }}
      >
        <Heart size={64} style={{ color: 'var(--rose-gold)', marginBottom: '24px' }} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--cream)', marginBottom: '10px' }}>
          Your Wishlist is Empty
        </h2>
        <p style={{ color: 'var(--beige)', marginBottom: '30px', maxWidth: '400px' }}>
          Save your favorite Belgian dark truffles or praline assortments to purchase them later.
        </p>
        <Link to="/shop">
          <Button variant="gold" size="lg" glow>
            Start Exploring
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        paddingTop: '120px',
        minHeight: '100vh',
        background: 'var(--gradient-hero)',
        paddingBottom: '60px',
      }}
    >
      <div className="container">
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.5rem',
            fontWeight: 700,
            color: 'var(--cream)',
            borderBottom: '1px solid var(--glass-border)',
            paddingBottom: '15px',
            marginBottom: '30px',
          }}
        >
          My Wishlist
        </h1>

        {/* Wishlist grid with layout transitions */}
        <motion.div
          layout
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '30px',
          }}
        >
          <AnimatePresence mode="popLayout">
            {wishlist.map((product) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                variants={hoverLift}
                whileHover="whileHover"
                className="glass-panel"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  overflow: 'hidden',
                  border: '1px solid var(--glass-border)',
                }}
              >
                {/* Product image */}
                <div
                  onClick={() => navigate(`/product/${product.id}`)}
                  style={{ position: 'relative', aspectRatio: '1/1', cursor: 'pointer', overflow: 'hidden' }}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1548907040-4d42b52115ca?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  {product.badge && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        background: 'var(--gold)',
                        color: 'var(--dark-chocolate)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '4px 10px',
                      }}
                    >
                      {product.badge}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                  <div>
                    <h3
                      onClick={() => navigate(`/product/${product.id}`)}
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.2rem',
                        color: 'var(--cream)',
                        margin: '0 0 8px 0',
                        cursor: 'pointer',
                      }}
                    >
                      {product.name}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--beige)', marginBottom: '15px' }}>
                      ₹{product.price.toLocaleString()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => toggleWishlist(product)}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '4px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--rose-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                    <Button variant="gold" size="sm" fullWidth onClick={() => moveToCart(product)}>
                      <ShoppingBag size={14} />
                      Move to Cart
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};
export default WishlistPage;
