import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../app/providers';
import { Card } from '../../components/ui/Card';
import { fadeInUp } from '../../lib/framer';

export const BestsellersNewArrivals: React.FC = () => {
  const { products } = useApp();
  const bestsellersRef = useRef<HTMLDivElement>(null);
  const newArrivalsRef = useRef<HTMLDivElement>(null);

  // Filter Bestsellers (badge is Bestseller/Premium or isBestseller flag, strictly excluding Limited)
  const bestsellersList = products.filter(
    (p) => (p.isBestseller || p.badge === 'Bestseller' || p.badge === 'Premium') &&
           p.badge !== 'Limited' && p.badge !== 'Limited Edition'
  );

  // Filter New Arrivals (badge is New or isNewArrival flag, strictly excluding Limited and Bestseller/Premium unless explicitly marked as New)
  const newArrivalsList = products.filter(
    (p) => (p.isNewArrival || p.badge === 'New') &&
           p.badge !== 'Limited' && p.badge !== 'Limited Edition'
  );

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current;
      const scrollAmount = clientWidth * 0.75;
      ref.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section
      id="bestsellers-new-arrivals"
      style={{
        padding: 'var(--section-padding) 0',
        background: 'linear-gradient(135deg, #0A0A0A 0%, #161618 35%, #3E3E41 70%, #A1A1A6 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Premium subtle light overlay to enhance the gold/gray contrast */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          width: '100%',
          background: 'radial-gradient(circle at 80% 80%, rgba(201, 168, 76, 0.05) 0%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        {/* Header with scroll reveal animation */}
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
            marginBottom: '28px',
          }}
        >
          <span className="section-label" style={{ justifyContent: 'center' }}>
            Exclusive Showroom
          </span>
          <h2 className="section-title">
            Bestsellers <span className="gold">&</span> New Arrivals
          </h2>
          <p className="section-subtitle">
            Indulge in our curated selections — showcasing both our legendary, time-honored classics and our latest avant-garde culinary creations.
          </p>
        </motion.div>

        {/* Dual Sections Side-by-Side */}
        <div className="dual-collections-container">
          
          {/* Bestsellers Section */}
          <motion.div
            id="best-sellers"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="collection-column"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div className="collection-header-group" style={{ marginBottom: 0, flex: 1 }}>
                <span className="collection-tag gold">Connoisseur Choice</span>
                <h3 className="collection-title">The Bestsellers</h3>
                <p className="collection-desc">
                  Artisanal icons that have won the hearts of fine chocolate lovers globally. Elegant, refined, and rich in depth.
                </p>
              </div>
              {bestsellersList.length > 2 && (
                <div style={{ display: 'flex', gap: '8px', marginLeft: '12px', flexShrink: 0, marginTop: '8px' }}>
                  <button
                    onClick={() => scroll(bestsellersRef, 'left')}
                    aria-label="Scroll Left"
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
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
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
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => scroll(bestsellersRef, 'right')}
                    aria-label="Scroll Right"
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
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
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
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
            
            <div
              ref={bestsellersRef}
              style={{
                display: 'flex',
                gap: '16px',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                overscrollBehaviorX: 'contain',
                padding: '4px 2px 16px 2px',
                minWidth: 0,
                width: '100%',
              }}
              className="hide-scrollbar"
            >
              {bestsellersList.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  variants={{
                    initial: { opacity: 0, y: 30 },
                    animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: index * 0.15 } },
                  }}
                  style={{
                    flex: '0 0 clamp(200px, calc(50% - 8px), 260px)',
                    minWidth: '200px',
                    maxWidth: '280px',
                    scrollSnapAlign: 'start',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                  }}
                >
                  <Card product={product} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* New Arrivals Section */}
          <motion.div
            id="new-arrivals"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={{
              initial: { opacity: 0, y: 40 },
              animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.2 } },
            }}
            className="collection-column"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div className="collection-header-group" style={{ marginBottom: 0, flex: 1 }}>
                <span className="collection-tag silver">Freshly Tempered</span>
                <h3 className="collection-title">New Arrivals</h3>
                <p className="collection-desc">
                  Seasonal innovations and brand new releases straight from the kitchen. Discover fresh notes and modern textures.
                </p>
              </div>
              {newArrivalsList.length > 2 && (
                <div style={{ display: 'flex', gap: '8px', marginLeft: '12px', flexShrink: 0, marginTop: '8px' }}>
                  <button
                    onClick={() => scroll(newArrivalsRef, 'left')}
                    aria-label="Scroll Left"
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
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
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
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => scroll(newArrivalsRef, 'right')}
                    aria-label="Scroll Right"
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
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
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
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
            
            <div
              ref={newArrivalsRef}
              style={{
                display: 'flex',
                gap: '16px',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch',
                overscrollBehaviorX: 'contain',
                padding: '4px 2px 16px 2px',
                minWidth: 0,
                width: '100%',
              }}
              className="hide-scrollbar"
            >
              {newArrivalsList.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  variants={{
                    initial: { opacity: 0, y: 30 },
                    animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay: index * 0.15 + 0.2 } },
                  }}
                  style={{
                    flex: '0 0 clamp(200px, calc(50% - 8px), 260px)',
                    minWidth: '200px',
                    maxWidth: '280px',
                    scrollSnapAlign: 'start',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                  }}
                >
                  <Card product={product} />
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default BestsellersNewArrivals;
