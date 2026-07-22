import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../../app/providers';
import { Button } from '../../components/ui/Button';

export const Hero: React.FC = () => {
  const { banners } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const duration = 6000;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, duration);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  const activeBanner = banners[currentSlide];

  // Create array of particles for background animation
  const particles = Array.from({ length: 20 });

  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--gradient-hero)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Background slide */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
          }}
        >
          <img
            src={activeBanner.image}
            alt={activeBanner.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.4) saturate(1.1)',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                currentSlide === 0
                  ? 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1920&q=80'
                  : currentSlide === 1
                  ? 'https://images.unsplash.com/photo-1548907040-4d42b52115ca?auto=format&fit=crop&w=1920&q=80'
                  : currentSlide === 2
                  ? 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?auto=format&fit=crop&w=1920&q=80'
                  : 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=1920&q=80';
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gold Floating Particles Overlay */}
      <div className="particles">
        {particles.map((_, i) => {
          const left = Math.random() * 100;
          const size = Math.random() * 3 + 1;
          const durationTime = Math.random() * 6 + 6;
          const delay = Math.random() * 5;
          const opacity = Math.random() * 0.4 + 0.1;
          return (
            <div
              key={i}
              className="particle"
              style={{
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDuration: `${durationTime}s`,
                animationDelay: `${delay}s`,
                opacity: opacity,
              }}
            />
          );
        })}
      </div>

      {/* Slider Content */}
      <div
        className="container"
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          maxWidth: '800px',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span
              className="hero-tag"
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '4px',
                textTransform: 'uppercase',
                color: 'var(--gold-light)',
                marginBottom: '18px',
                display: 'block',
              }}
            >
              {activeBanner.tag}
            </span>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                background: 'var(--gradient-gold-text)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block',
                marginBottom: '24px',
                letterSpacing: '1px',
              }}
            >
              {currentSlide === 0 ? (
                <>
                  The Art of <em style={{ fontFamily: 'var(--font-elegant)', fontStyle: 'italic', fontWeight: 400, background: 'linear-gradient(135deg, #FFE8A3 0%, #E8D48B 50%, #C9A84C 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Fine Chocolate</em>
                </>
              ) : (
                activeBanner.title
              )}
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-elegant)',
                fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
                color: 'var(--beige)',
                marginBottom: '36px',
                lineHeight: 1.6,
                fontWeight: 300,
              }}
            >
              {activeBanner.subtitle}
            </p>
            <Button
              variant="gold"
              size="lg"
              glow
              onClick={() => {
                const target = activeBanner.link;
                if (target.startsWith('#')) {
                  const el = document.getElementById(target.substring(1));
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {activeBanner.buttonText}
              <ArrowRight size={16} />
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Indicators */}
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
          zIndex: 2,
        }}
      >
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            style={{
              width: idx === currentSlide ? '32px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: idx === currentSlide ? 'var(--gradient-gold)' : 'rgba(255, 255, 255, 0.3)',
              transition: 'width 0.3s ease, background 0.3s ease',
            }}
          />
        ))}
      </div>
    </section>
  );
};
