import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, MessageSquarePlus, X, CheckCircle, Loader2 } from 'lucide-react';
import { homeService } from '../../services/homeService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { Testimonial } from '../../types';

// Fallback written testimonials if database is empty
const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    stars: 5,
    rating: 5,
    text: "I've tried chocolates from Belgium, Switzerland, and France — but Chovique genuinely stands apart. The depth of flavor in their single-origin bars is extraordinary.",
    author: 'Vikram Kapoor',
    title: 'Food Critic, Mumbai',
    initials: 'VK',
  },
  {
    stars: 5,
    rating: 5,
    text: "Ordered a bespoke gift box for my mother's birthday. The presentation was flawless, and the chocolates were even better. Chovique turned a gift into a memory.",
    author: 'Neha Patel',
    title: 'Loyal Customer, Delhi',
    initials: 'NP',
  },
  {
    stars: 5,
    rating: 5,
    text: "As a pastry chef, I'm incredibly particular about chocolate. Chovique's cocoa is consistent, rich, and tempers beautifully. It's my go-to for all premium work.",
    author: 'Chef Ravi Joshi',
    title: 'Pastry Chef, Bangalore',
    initials: 'RJ',
  },
];

export const Reviews: React.FC = () => {
  const [textTestimonials, setTextTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for submitting a testimonial
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [formData, setFormData] = useState({
    author: '',
    title: 'Chocolate Lover',
    rating: 5,
    text: '',
  });

  const fetchApprovedTestimonials = () => {
    setLoading(true);
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
  };

  useEffect(() => {
    fetchApprovedTestimonials();
  }, []);

  const handleTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.author || !formData.text) return;
    setIsSubmitting(true);
    try {
      await homeService.submitTestimonial(formData);
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        setShowModal(false);
        setFormData({ author: '', title: 'Chocolate Lover', rating: 5, text: '' });
      }, 2500);
    } catch (err: any) {
      alert(err?.message || 'Failed to submit testimonial. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="section-label" style={{ justifyContent: 'center' }}>
            Customer Love
          </span>
          <h2 className="section-title">
            What Our <span className="gold">Chocolate Lovers</span> Say
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto 24px auto' }}>
            Real stories from real people who've experienced the magic of Chovique chocolates.
          </p>

          <Button
            variant="gold"
            glow
            onClick={() => setShowModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
          >
            <MessageSquarePlus size={16} /> Share Your Experience
          </Button>
        </div>

        {/* Written Testimonials Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px',
          }}
        >
          {displayList.map((test, index) => {
            const starsCount = test.rating || test.stars || 5;
            return (
              <motion.div
                key={(test.id || test.author) + index}
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
                    {Array.from({ length: starsCount }).map((_, i) => (
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
                    <p style={{ fontSize: '0.75rem', color: 'var(--grey-light)', margin: 0 }}>{test.title || 'Chocolate Enthusiast'}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Customer Testimonial Submission Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              border: '1px solid var(--glass-border)',
              borderRadius: '12px',
              background: 'var(--dark-chocolate)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                color: 'var(--beige)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.4rem',
                color: 'var(--gold)',
                marginBottom: '16px',
              }}
            >
              Share Your Experience
            </h3>

            {submittedSuccess ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#6fbf6f' }}>
                <CheckCircle size={48} style={{ margin: '0 auto 16px auto' }} />
                <h4 style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--cream)' }}>
                  Thank You for Your Feedback!
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--beige)', opacity: 0.8 }}>
                  Your testimonial has been submitted and is pending admin review.
                </p>
              </div>
            ) : (
              <form onSubmit={handleTestimonialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Input
                  label="Your Name *"
                  placeholder="e.g. Ananya Sharma"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  required
                />
                <Input
                  label="Title / Role (Optional)"
                  placeholder="e.g. Verified Buyer, Foodie"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--beige)', display: 'block', marginBottom: '8px' }}>
                    Rating *
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFormData({ ...formData, rating: star })}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: star <= formData.rating ? 'var(--gold)' : 'var(--glass-border)',
                          padding: '4px',
                        }}
                      >
                        <Star size={24} fill={star <= formData.rating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--beige)', display: 'block', marginBottom: '6px' }}>
                    Your Testimonial *
                  </label>
                  <textarea
                    placeholder="Tell us about your experience with Chovique chocolates..."
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    rows={4}
                    required
                    style={{
                      width: '100%',
                      background: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '4px',
                      color: 'var(--cream)',
                      padding: '12px',
                      fontSize: '0.9rem',
                      fontFamily: 'var(--font-body)',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <Button variant="gold" glow type="submit" disabled={isSubmitting} style={{ marginTop: '8px' }}>
                  {isSubmitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Submit Testimonial'}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Reviews;
