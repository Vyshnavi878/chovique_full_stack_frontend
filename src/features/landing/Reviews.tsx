import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { homeService } from '../../services/homeService';
import type { Testimonial } from '../../types';

// Fallback written testimonials while loading or if database is empty
const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    stars: 5,
    text: "I've tried chocolates from Belgium, Switzerland, and France — but Chovique genuinely stands apart. The depth of flavor in their single-origin bars is extraordinary.",
    author: 'Vikram Kapoor',
    title: 'Food Critic, Mumbai',
    initials: 'VK',
  },
  {
    stars: 5,
    text: "Ordered a bespoke gift box for my mother's birthday. The presentation was flawless, and the chocolates were even better. Chovique turned a gift into a memory.",
    author: 'Neha Patel',
    title: 'Loyal Customer, Delhi',
    initials: 'NP',
  },
  {
    stars: 5,
    text: "As a pastry chef, I'm incredibly particular about chocolate. Chovique's cocoa is consistent, rich, and tempers beautifully. It's my go-to for all premium work.",
    author: 'Chef Ravi Joshi',
    title: 'Pastry Chef, Bangalore',
    initials: 'RJ',
  },
];

export const Reviews: React.FC = () => {
  const [textTestimonials, setTextTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    homeService
      .getTestimonials()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTextTestimonials(data);
        } else {
          setTextTestimonials(FALLBACK_TESTIMONIALS);
        }
      })
      .catch(() => {
        setTextTestimonials(FALLBACK_TESTIMONIALS);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const displayList = textTestimonials.length > 0 ? textTestimonials : FALLBACK_TESTIMONIALS;

  return (
    <section
      id="reviews"
      style={{
        padding: 'var(--section-padding) 0',
        background: 'var(--gradient-section-5)',
      }}
    >
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span className="section-label" style={{ justifyContent: 'center' }}>
            Customer Love
          </span>
          <h2 className="section-title">
            What Our <span className="gold">Chocolate Lovers</span> Say
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Real stories from real people who've experienced the magic of Chovique chocolates.
          </p>
        </div>

        {/* Written Testimonials Grid ONLY */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px',
          }}
        >
          {displayList.map((test, index) => (
            <motion.div
              key={test.author + index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-panel"
              style={{
                padding: '30px',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <Quote
                size={40}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  color: 'var(--gold)',
                  opacity: 0.1,
                }}
              />
              <div>
                <div style={{ display: 'flex', gap: '4px', color: 'var(--gold)', marginBottom: '15px' }}>
                  {Array.from({ length: test.stars || 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p
                  style={{
                    color: 'var(--cream)',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    fontStyle: 'italic',
                    fontFamily: 'var(--font-elegant)',
                    marginBottom: '24px',
                  }}
                >
                  "{test.text}"
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--chocolate-brown)',
                    color: 'var(--gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    border: '1px solid var(--gold)',
                  }}
                >
                  {test.initials || test.author.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h5 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--cream)', margin: 0 }}>
                    {test.author}
                  </h5>
                  <p style={{ fontSize: '0.75rem', color: 'var(--grey-light)', margin: 0 }}>{test.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
export default Reviews;
