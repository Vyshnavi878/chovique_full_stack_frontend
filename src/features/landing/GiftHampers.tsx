import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Sparkles, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../app/providers';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { fadeInUp } from '../../lib/framer';

export const GiftHampers: React.FC = () => {
  const { products, role } = useApp();
  const navigate = useNavigate();

  // Filter gift products
  const giftList = products.filter((p) => p.category === 'gift').slice(0, 2);
  const displayList = giftList.length > 0 ? giftList : products.slice(1, 3);

  const benefits = [
    'Handwritten custom greeting cards',
    'Luxurious gold-foiled presentation boxes',
    'Bespoke corporate customization options',
    'Temperature-controlled premium delivery',
  ];

  return (
    <section
      id="gift-hampers"
      style={{
        padding: 'var(--section-padding) 0',
        background: 'linear-gradient(135deg, #1C1C1E 0%, #2A2A2D 40%, #020100ff 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background radial highlight */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          width: '100%',
          background: 'radial-gradient(circle at 10% 20%, rgba(201, 168, 76, 0.06) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
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
            marginBottom: '60px',
          }}
        >
          <span className="section-label" style={{ justifyContent: 'center' }}>
            Art of Giving
          </span>
          <h2 className="section-title">
            Luxury Gift <span className="gold">Hampers</span>
          </h2>
          <p className="section-subtitle">
            Celebrate life’s most exquisite moments with Chovique’s bespoke gifting packages and presentation boxes.
          </p>
        </motion.div>

        {/* Layout: Bespoke card on the left, products grid on the right */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '40px',
            alignItems: 'stretch',
          }}
          className="dual-collections-container"
        >
          {/* Bespoke Gifting Left Panel */}
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="collection-column"
            style={{
              justifyContent: 'space-between',
              background: 'rgba(10, 10, 10, 0.55)',
            }}
          >
            <div>
              <div className="collection-header-group">
                <span className="collection-tag gold">Premium Service</span>
                <h3 className="collection-title">Bespoke Chocolate Hampers</h3>
                <p className="collection-desc">
                  Tailored collections designed to make a statement. Perfect for corporate events, anniversaries, weddings, or festive occasions.
                </p>
              </div>

              <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {benefits.map((benefit, index) => (
                  <li
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '0.95rem',
                      color: 'var(--cream)',
                    }}
                  >
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'rgba(201, 168, 76, 0.15)',
                        border: '1px solid var(--gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--gold)',
                        flexShrink: 0,
                      }}
                    >
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Button
              variant="gold"
              onClick={() => {
                if (role === 'guest') {
                  navigate('/login');
                } else {
                  navigate('/shop?category=gift');
                }
              }}
              style={{ width: 'fit-content' }}
            >
              Inquire Corporate Gifting <ArrowRight size={14} />
            </Button>
          </motion.div>

          {/* Gifting Products Right Panel */}
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={{
              initial: { opacity: 0, y: 40 },
              animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.2 } },
            }}
            className="collection-column"
            style={{
              background: 'rgba(10, 10, 10, 0.35)',
            }}
          >
            <div className="collection-header-group">
              <span className="collection-tag silver">Ready to Gift</span>
              <h3 className="collection-title">Gift Collections</h3>
              <p className="collection-desc">
                Select from our signature pre-packed truffles and custom presentation collections, ready to delight straight out of the box.
              </p>
            </div>

            <div className="collection-products-grid">
              {displayList.map((product, index) => (
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

export default GiftHampers;
