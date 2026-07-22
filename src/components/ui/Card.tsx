import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../app/providers';
import { hoverLift } from '../../lib/framer';

interface CardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export const Card: React.FC<CardProps> = ({ product, onQuickView }) => {
  const { role, addToCart, toggleWishlist, wishlist } = useApp();
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const isLiked = wishlist.some((p) => p.id === product.id);

  const handleCardClick = () => {
    if (role === 'guest') {
      navigate('/login');
    } else {
      navigate(`/product/${product.id}`);
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (role === 'guest') {
      navigate('/login');
    } else {
      toggleWishlist(product);
    }
  };

  const handleCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (role === 'guest') {
      navigate('/login');
    } else {
      addToCart(product, 1);
    }
  };

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (role === 'guest') {
      navigate('/login');
    } else if (onQuickView) {
      onQuickView(product);
    }
  };

  return (
    <motion.div
      variants={hoverLift}
      whileHover="whileHover"
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="glass-panel popular-card"
      style={{
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        border: '1px solid var(--glass-border)',
      }}
    >
      {/* Product Image Container */}
      <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '1.25/1' }}>
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease',
            opacity: isHovered && product.hoverImage ? 0 : 1,
            transform: isHovered ? 'scale(1.06)' : 'scale(1)',
          }}
          className="product-card-img-element"
        />
        {product.hoverImage && (
          <img
            src={product.hoverImage}
            alt={`${product.name} alternate view`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease',
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'scale(1.06)' : 'scale(1)',
              pointerEvents: 'none',
            }}
          />
        )}
        
        {/* Overlay Action Buttons */}
        <div
          className="product-card-actions"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 2,
          }}
        >
          <button
            onClick={handleWishlistClick}
            aria-label="Add to Wishlist"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: isLiked ? 'var(--rose-gold)' : 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isLiked ? '#fff' : 'var(--cream)',
              transition: 'background 0.3s, color 0.3s',
            }}
          >
            <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          
          <button
            onClick={handleQuickViewClick}
            aria-label="Quick View"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cream)',
              transition: 'background 0.3s, color 0.3s',
            }}
          >
            <Eye size={16} />
          </button>
        </div>

        {/* Product Badge */}
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
              letterSpacing: '1px',
              padding: '4px 10px',
              borderRadius: '2px',
              zIndex: 2,
            }}
          >
            {product.badge}
          </span>
        )}
      </div>

      {/* Product Info */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          justifyContent: 'space-between',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontFamily: 'var(--font-body)',
              display: 'block',
              marginBottom: '4px',
            }}
          >
            {product.category} Collection
          </span>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.15rem',
              fontWeight: 600,
              color: 'var(--cream)',
              marginBottom: '4px',
              lineHeight: 1.3,
            }}
          >
            {product.name}
          </h3>
          <p
            style={{
              fontSize: '0.82rem',
              color: 'var(--grey-light)',
              fontFamily: 'var(--font-elegant)',
              lineHeight: 1.4,
              marginBottom: '10px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.description}
          </p>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--cream)' }}>
                ₹{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--grey-light)',
                    textDecoration: 'line-through',
                  }}
                >
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--gold)' }}>★</span>
              <span>{product.rating}</span>
            </div>
          </div>

          <button
            onClick={handleCartClick}
            style={{
              width: '100%',
              padding: '8px 0',
              background: 'transparent',
              color: 'var(--gold)',
              border: '1px solid var(--gold)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transition: 'background 0.3s, color 0.3s',
            }}
            className="product-card-cart-btn"
          >
            <ShoppingBag size={14} />
            Add to Cart
          </button>
        </div>
      </div>
    </motion.div>
  );
};
