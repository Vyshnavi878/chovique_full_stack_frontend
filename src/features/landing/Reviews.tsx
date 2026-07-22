import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, Play, Quote } from 'lucide-react';
import { scaleUp } from '../../lib/framer';

export const Reviews: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Video reviews mock list
  const videoReviews = [
    { id: 1, name: 'Priya Sharma', image: '/assets/product-1.jpg', text: 'Absolutely divine! The dark truffle melted like silk...', stars: 5 },
    { id: 2, name: 'Arjun Mehta', image: '/assets/product-3.jpg', text: 'Gifted the Royal Box to my wife. Best reaction ever!', stars: 5 },
    { id: 3, name: 'Sara Khan', image: '/assets/product-5.jpg', text: 'The salted caramel is unreal. Can\'t stop ordering!', stars: 5 },
    { id: 4, name: 'Rahul Desai', image: '/assets/product-7.jpg', text: 'Premium quality. Packaging is so elegant, worth every rupee.', stars: 5 },
  ];

  // Written testimonials
  const textTestimonials = [
    {
      stars: 5,
      text: 'I\'ve tried chocolates from Belgium, Switzerland, and France — but Chovique genuinely stands apart. The depth of flavor in their single-origin bars is extraordinary.',
      author: 'Vikram Kapoor',
      title: 'Food Critic, Mumbai',
      initials: 'VK',
    },
    {
      stars: 5,
      text: 'Ordered a bespoke gift box for my mother\'s birthday. The presentation was flawless, and the chocolates were even better. Chovique turned a gift into a memory.',
      author: 'Neha Patel',
      title: 'Loyal Customer, Delhi',
      initials: 'NP',
    },
    {
      stars: 5,
      text: 'As a pastry chef, I\'m incredibly particular about chocolate. Chovique\'s cocoa is consistent, rich, and tempers beautifully. It\'s my go-to for all premium work.',
      author: 'Chef Ravi Joshi',
      title: 'Pastry Chef, Bangalore',
      initials: 'RJ',
    },
  ];

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
            Real stories from real people who\'ve experienced the magic of Chovique chocolates.
          </p>
        </div>

        {/* Video Reviews Scrollable Row */}
        <div
          ref={scrollRef}
          className="video-reviews-scroll"
          style={{
            display: 'flex',
            gap: '24px',
            overflowX: 'auto',
            paddingBottom: '30px',
            marginBottom: '60px',
            cursor: 'grab',
            scrollbarWidth: 'none', // Firefox
          }}
        >
          {videoReviews.map((rev, index) => (
            <motion.div
              key={rev.id}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={scaleUp}
              style={{
                flex: '0 0 280px',
                height: '380px',
                position: 'relative',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: 'var(--glass-shadow)',
                border: '1px solid var(--glass-border)',
              }}
            >
              <img
                src={rev.image}
                alt={`${rev.name} recommendation`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1548907040-4d42b52115ca?auto=format&fit=crop&w=400&q=80';
                }}
              />
              {/* Play Button Icon */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <Play size={18} fill="currentColor" style={{ marginLeft: '2px' }} />
              </div>

              {/* Bottom Card Info Overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  padding: '20px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', gap: '2px', color: 'var(--gold)', fontSize: '0.85rem' }}>
                  {Array.from({ length: rev.stars }).map((_, i) => (
                    <Star key={i} size={12} fill="currentColor" />
                  ))}
                </div>
                <h4 style={{ color: 'var(--cream)', fontSize: '1rem', fontWeight: 600 }}>{rev.name}</h4>
                <p style={{ color: 'var(--beige)', fontSize: '0.8rem', fontStyle: 'italic', lineHeight: 1.3 }}>
                  "{rev.text}"
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Written Testimonials Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px',
          }}
        >
          {textTestimonials.map((test, index) => (
            <motion.div
              key={test.author}
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
                  {Array.from({ length: test.stars }).map((_, i) => (
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
                  {test.initials}
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
