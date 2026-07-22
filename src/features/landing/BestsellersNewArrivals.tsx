import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../app/providers';
import { Card } from '../../components/ui/Card';
import { fadeInUp } from '../../lib/framer';

export const BestsellersNewArrivals: React.FC = () => {
  const { products } = useApp();

  // Filter Bestsellers (badge is Bestseller/Premium or specific IDs)
  const bestsellers = products.filter(
    (p) => p.badge === 'Bestseller' || p.badge === 'Premium' || p.id === 'p1' || p.id === 'p3'
  ).slice(0, 2);

  // Filter New Arrivals (badge is New/Limited or specific IDs)
  const newArrivals = products.filter(
    (p) => p.badge === 'New' || p.badge === 'Limited' || p.id === 'p2' || p.id === 'p7'
  ).slice(0, 2);

  // Fallback lists if data is not populated yet
  const bestsellersList = bestsellers.length > 0 ? bestsellers : products.slice(0, 2);
  const newArrivalsList = newArrivals.length > 0 ? newArrivals : products.slice(2, 4);

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
            marginBottom: '60px',
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
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="collection-column"
          >
            <div className="collection-header-group">
              <span className="collection-tag gold">Connoisseur Choice</span>
              <h3 className="collection-title">The Bestsellers</h3>
              <p className="collection-desc">
                Artisanal icons that have won the hearts of fine chocolate lovers globally. Elegant, refined, and rich in depth.
              </p>
            </div>
            
            <div className="collection-products-grid">
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
                >
                  <Card product={product} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* New Arrivals Section */}
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={{
              initial: { opacity: 0, y: 40 },
              animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.2 } },
            }}
            className="collection-column"
          >
            <div className="collection-header-group">
              <span className="collection-tag silver">Freshly Tempered</span>
              <h3 className="collection-title">New Arrivals</h3>
              <p className="collection-desc">
                Seasonal innovations and brand new releases straight from the kitchen. Discover fresh notes and modern textures.
              </p>
            </div>
            
            <div className="collection-products-grid">
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
