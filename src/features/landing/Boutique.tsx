import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../app/providers';
import { Card } from '../../components/ui/Card';
import { fadeInUp } from '../../lib/framer';

type FilterType = 'all' | 'dark' | 'milk' | 'white' | 'gift' | 'beverage';

export const Boutique: React.FC = () => {
  const { products } = useApp();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [activeFilter]);

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

  const filterButtons: { type: FilterType; label: string }[] = [
    { type: 'all', label: 'All' },
    { type: 'dark', label: 'Dark' },
    { type: 'milk', label: 'Milk' },
    { type: 'white', label: 'White' },
    { type: 'gift', label: 'Gifts' },
    { type: 'beverage', label: 'Beverages' },
  ];

  const filteredProducts = products.filter(
    (product) => activeFilter === 'all' || product.category === activeFilter
  );

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

        {/* Filter Toolbar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '45px',
          }}
        >
          {filterButtons.map((btn) => (
            <button
              key={btn.type}
              onClick={() => setActiveFilter(btn.type)}
              style={{
                padding: '10px 24px',
                borderRadius: '25px',
                fontSize: '0.85rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                background: activeFilter === btn.type ? 'var(--gradient-gold)' : 'rgba(255, 255, 255, 0.05)',
                color: activeFilter === btn.type ? 'var(--dark-chocolate)' : 'var(--cream)',
                border: activeFilter === btn.type ? '1px solid var(--gold)' : '1px solid var(--glass-border)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Inline CSS to hide scrollbars */}
        <style>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>

        {/* Slider Container Wrapper */}
        <div style={{ position: 'relative', width: '100%', padding: '0 50px' }}>
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
              {filteredProducts.map((product) => (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    flex: '0 0 280px',
                    scrollSnapAlign: 'start',
                  }}
                >
                  <Card product={product} />
                </motion.div>
              ))}
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
