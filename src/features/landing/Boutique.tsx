import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../app/providers';
import { Card } from '../../components/ui/Card';
import { fadeInUp } from '../../lib/framer';

export const Boutique: React.FC = () => {
  const { products } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section
      id="store"
      style={{
        padding: 'var(--section-padding) 0',
        background: 'var(--gradient-section-3)',
      }}
    >
      <div className="container">
        {/* Header */}
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-100px' }}
          variants={fadeInUp}
          style={{
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <span className="section-label" style={{ justifyContent: 'center' }}>
            The Chocolate Boutique
          </span>
          <h2 className="section-title">
            Explore Our <span className="gold">Collection</span>
          </h2>
          <p className="section-subtitle">
            Browse our complete range of artisanal chocolates — from single-origin bars to luxurious gift hampers.
          </p>
        </motion.div>

        {/* Inline CSS to hide scrollbars */}
        <style>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          @media (max-width: 640px) {
            .boutique-carousel-wrapper {
              padding: 0 40px !important;
            }
            .boutique-card-item {
              flex: 0 0 250px !important;
              width: 250px !important;
            }
          }
        `}</style>

        {/* Slider Container Wrapper */}
        <div className="boutique-carousel-wrapper" style={{ position: 'relative', width: '100%', padding: '0 50px' }}>
          {/* Left Arrow Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              scroll('left');
            }}
            aria-label="Scroll Left"
            style={{
              position: 'absolute',
              left: '0px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cream)',
              zIndex: 10,
              boxShadow: 'var(--glass-shadow)',
              backdropFilter: 'blur(5px)',
              transition: 'background 0.3s, color 0.3s, border-color 0.3s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold)';
              e.currentTarget.style.color = 'var(--gold)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.color = 'var(--cream)';
            }}
          >
            <ChevronLeft size={24} />
          </button>

          {/* Slider content */}
          <div
            ref={scrollRef}
            style={{
              display: 'flex',
              gap: '24px',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
              padding: '10px 0 30px 0',
            }}
            className="hide-scrollbar"
          >
            <AnimatePresence mode="popLayout">
              {products.length > 0 ? (
                products.map((product) => (
                  <motion.div
                    layout
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="boutique-card-item"
                    style={{
                      flex: '0 0 280px',
                      width: '280px',
                      maxWidth: '280px',
                      scrollSnapAlign: 'start',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Card product={product} />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    flex: '1',
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--beige)',
                    opacity: 0.6,
                    fontFamily: 'var(--font-elegant)',
                    fontSize: '1.1rem',
                  }}
                >
                  No products in the collection yet.
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              scroll('right');
            }}
            aria-label="Scroll Right"
            style={{
              position: 'absolute',
              right: '0px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--cream)',
              zIndex: 10,
              boxShadow: 'var(--glass-shadow)',
              backdropFilter: 'blur(5px)',
              transition: 'background 0.3s, color 0.3s, border-color 0.3s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--gold)';
              e.currentTarget.style.color = 'var(--gold)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--glass-border)';
              e.currentTarget.style.color = 'var(--cream)';
            }}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Boutique;
