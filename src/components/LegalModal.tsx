import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ShieldCheck, Scale, Check, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface LegalModalProps {
  isOpen: boolean;
  type: 'terms' | 'privacy' | null;
  onClose: () => void;
  onAccept?: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  type,
  onClose,
  onAccept,
}) => {
  // Lock background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !type) return null;

  const isTerms = type === 'terms';
  const title = isTerms ? 'Terms & Conditions of Service' : 'Privacy & Data Protection Policy';
  const subtitle = isTerms
    ? 'Chovique Confectionery • Artisan Standards & Guest Agreement'
    : 'Chovique Confectionery • How We Safeguard Your Information';
  const fullPageUrl = isTerms ? '/terms-of-service' : '/privacy-policy';

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            maxWidth: '720px',
            width: '100%',
            maxHeight: '86vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(165deg, rgba(30, 20, 18, 0.98) 0%, rgba(14, 10, 9, 0.99) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            borderRadius: '14px',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.9), 0 0 25px rgba(212, 175, 55, 0.15)',
            color: 'var(--cream)',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Card Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              background: 'rgba(212, 175, 55, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  background: 'rgba(212, 175, 55, 0.12)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--gold)',
                  flexShrink: 0,
                }}
              >
                {isTerms ? <Scale size={20} /> : <ShieldCheck size={20} />}
              </div>
              <div>
                <h3
                  id="legal-modal-title"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(1.1rem, 3vw, 1.35rem)',
                    color: 'var(--cream)',
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--gold)',
                    margin: '3px 0 0 0',
                    letterSpacing: '0.3px',
                  }}
                >
                  {subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--cream)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(212, 175, 55, 0.2)';
                e.currentTarget.style.color = 'var(--gold)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = 'var(--cream)';
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Card Body — Scrollable Content */}
          <div
            style={{
              padding: '24px 28px',
              overflowY: 'auto',
              lineHeight: 1.75,
              fontSize: '0.9rem',
              color: 'rgba(247, 247, 247, 0.9)',
            }}
          >
            {isTerms ? (
              <div>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(212, 175, 55, 0.08)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    marginBottom: '20px',
                    fontSize: '0.85rem',
                    color: 'var(--beige)',
                  }}
                >
                  <strong style={{ color: 'var(--gold)' }}>Quick Summary:</strong> By registering an account with Chovique, you agree to our handcrafted confectionery policies, secure payment processing via Razorpay, and temperature-controlled shipping standards.
                </div>

                <h4 style={{ color: 'var(--gold)', fontSize: '1.05rem', margin: '0 0 8px 0' }}>
                  1. Artisan Confectionery & Handcrafted Nuances
                </h4>
                <p style={{ margin: '0 0 16px 0' }}>
                  Every Chovique bonbon, truffle, and chocolate tablet is handcrafted in micro-batches using natural, single-origin cacao. Due to the artisanal creation process, slight visual variations in 24K edible gold leaf application, natural cacao butter marbling, and gloss are celebrated marks of authenticity.
                </p>

                <h4 style={{ color: 'var(--gold)', fontSize: '1.05rem', margin: '0 0 8px 0' }}>
                  2. Food Safety & Allergen Information
                </h4>
                <p style={{ margin: '0 0 16px 0' }}>
                  Our creations are prepared in an FSSAI-certified atelier that processes dairy, tree nuts (hazelnuts, pistachios, almonds), soy lecithin, and sesame. If you or the recipient has severe food allergies, please review each product&apos;s ingredient list carefully prior to ordering.
                </p>

                <h4 style={{ color: 'var(--gold)', fontSize: '1.05rem', margin: '0 0 8px 0' }}>
                  3. Pricing, GST & Payment Processing
                </h4>
                <p style={{ margin: '0 0 16px 0' }}>
                  All prices are listed in Indian Rupees (INR) and are inclusive of applicable Goods and Services Tax (GST). All online transactions are handled through our authorized Reserve Bank of India (RBI) compliant payment partner, <strong>Razorpay</strong>, using 256-bit encryption and mandatory two-factor authentication.
                </p>

                <h4 style={{ color: 'var(--gold)', fontSize: '1.05rem', margin: '0 0 8px 0' }}>
                  4. Climate-Controlled Cold-Chain Transit
                </h4>
                <p style={{ margin: '0 0 16px 0' }}>
                  Because chocolate is a temperature-sensitive delicacy, we ship in multi-layered insulated packaging with reusable ice gel packs. The customer agrees to provide an accurate address and phone number to ensure successful delivery.
                </p>

                <h4 style={{ color: 'var(--gold)', fontSize: '1.05rem', margin: '0 0 8px 0' }}>
                  5. Account Security
                </h4>
                <p style={{ margin: '0 0 8px 0' }}>
                  You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your Chovique account.
                </p>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(212, 175, 55, 0.08)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    marginBottom: '20px',
                    fontSize: '0.85rem',
                    color: 'var(--beige)',
                  }}
                >
                  <strong style={{ color: 'var(--gold)' }}>Quick Summary:</strong> We protect your personal privacy. Chovique never sells customer data, never stores raw card or UPI credentials, and encrypts all communications with modern TLS protocols.
                </div>

                <h4 style={{ color: 'var(--gold)', fontSize: '1.05rem', margin: '0 0 8px 0' }}>
                  1. Information We Collect
                </h4>
                <p style={{ margin: '0 0 16px 0' }}>
                  When you register and place orders, we collect your name, email address, shipping delivery address, and contact number solely to manage your orders, fulfill deliveries, and send dispatch notifications.
                </p>

                <h4 style={{ color: 'var(--gold)', fontSize: '1.05rem', margin: '0 0 8px 0' }}>
                  2. Payment Data Security (Razorpay)
                </h4>
                <p style={{ margin: '0 0 16px 0' }}>
                  Chovique never collects, handles, or stores your credit/debit card numbers, CVV codes, or UPI PINs on our servers. All payments are tokenized and processed directly by <strong>Razorpay Software Private Limited</strong> in compliance with PCI-DSS Level 1 security standards.
                </p>

                <h4 style={{ color: 'var(--gold)', fontSize: '1.05rem', margin: '0 0 8px 0' }}>
                  3. Delivery Logistics Sharing
                </h4>
                <p style={{ margin: '0 0 16px 0' }}>
                  Your address and phone number are shared strictly with our contracted cold-chain courier logistics partners for the sole purpose of parcel dispatch and delivery coordination.
                </p>

                <h4 style={{ color: 'var(--gold)', fontSize: '1.05rem', margin: '0 0 8px 0' }}>
                  4. Cookies & Session Storage
                </h4>
                <p style={{ margin: '0 0 16px 0' }}>
                  We utilize secure cookies and local storage to preserve your active shopping cart, remember your authenticated session, and track reward coins balances. We do not engage in third-party ad network tracking.
                </p>

                <h4 style={{ color: 'var(--gold)', fontSize: '1.05rem', margin: '0 0 8px 0' }}>
                  5. Your Rights & Data Deletion
                </h4>
                <p style={{ margin: '0 0 8px 0' }}>
                  You have the right to access, modify, or permanently delete your account data at any time from your customer dashboard or by emailing our concierge at <strong>support@chovique.com</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(212, 175, 55, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
              background: 'rgba(0, 0, 0, 0.35)',
            }}
          >
            <Link
              to={fullPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--gold)',
                fontSize: '0.84rem',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Open Full Page <ExternalLink size={13} />
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 18px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'var(--cream)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Close
              </button>

              {onAccept && (
                <button
                  type="button"
                  onClick={() => {
                    onAccept();
                    onClose();
                  }}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '6px',
                    background: 'var(--gradient-gold)',
                    border: 'none',
                    color: 'var(--dark-chocolate)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 10px rgba(212, 175, 55, 0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  <Check size={16} />
                  Accept & Close
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LegalModal;
