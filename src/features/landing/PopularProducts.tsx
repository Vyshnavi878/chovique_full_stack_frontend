import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../app/providers';
import { Card } from '../../components/ui/Card';
import { fadeInUp } from '../../lib/framer';

export const PopularProducts: React.FC = () => {
  const { products, theme } = useApp();

  // Pick top 3 bestseller/premium chocolates for popular row
  const popularList = products.slice(0, 4);

  // Helper to determine if a hex color is dark
  const isDarkColor = (color: string) => {
    if (!color) return true;
    const hex = color.replace('#', '');
    if (hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
    }
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
    }
    return true;
  };

  const isDark = isDarkColor(theme?.black);

  return (
    <section
      id="popular"
      style={{
        padding: 'var(--section-padding) 0',
        background: isDark
          ? 'linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)), url("/assets/logo-badge.jpg") no-repeat center center/350px 350px'
          : 'var(--gradient-section-1)',
        backgroundColor: isDark ? '#000000' : undefined,
      }}
    >
      <div className="container">
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
            Curated Selection
          </span>
          <h2 className="section-title">
            Our Most <span className="gold">Loved</span> Creations
          </h2>
          <p className="section-subtitle">
            Handpicked favorites that our chocolate lovers keep coming back for — each piece a testament to uncompromising quality and artisanal mastery.
          </p>
        </motion.div>

        {/* Card Grid with scroll reveal staggered delays */}
        <div className="popular-products-grid">
          {popularList.map((product, index) => (
            <motion.div
              key={product.id}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={{
                initial: { opacity: 0, y: 40 },
                animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay: index * 0.15 } },
              }}
            >
              <Card product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
