import React from 'react';
import '../styles/footer.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Headphones,
  Heart,
  Sparkles,
  Gift,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSectionNav = (sectionId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      navigate('/', { state: { scrollTo: sectionId } });
    }
  };

  return (
    <footer className="chovique-footer">
      <div className="chovique-footer-container">
        {/* ─── MAIN FOOTER GRID ─── */}
        <div className="footer-main-grid">
          {/* BRAND COLUMN */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand-header">
              <img 
                src="/assets/popular-bg.jpg" 
                alt="Chovique Logo" 
                className="footer-main-logo" 
              />
            </Link>

            <p className="footer-brand-description">
              Luxury handmade chocolates crafted with the finest cocoa and pure ingredients.
            </p>

            <div className="footer-social-row">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="footer-social-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="footer-social-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="footer-social-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
              </a>
              <a
                href="https://pinterest.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Pinterest"
                className="footer-social-btn"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-col-divider" />

          {/* MIDDLE COLUMN 1 — SHOP */}
          <div className="footer-nav-col">
            <h3 className="footer-col-title">SHOP</h3>
            <ul className="footer-nav-links">
              <li>
                <Link to="/shop">
                  Shop All <ChevronRight size={13} className="nav-chevron" />
                </Link>
              </li>
              <li>
                <a href="/#best-sellers" onClick={(e) => handleSectionNav('best-sellers', e)}>
                  Best Sellers <ChevronRight size={13} className="nav-chevron" />
                </a>
              </li>
              <li>
                <a href="/#new-arrivals" onClick={(e) => handleSectionNav('new-arrivals', e)}>
                  New Arrivals <ChevronRight size={13} className="nav-chevron" />
                </a>
              </li>
              <li>
                <Link to="/shop?category=gift">
                  Gift Boxes <ChevronRight size={13} className="nav-chevron" />
                </Link>
              </li>
              <li>
                <Link to="/shop">
                  All Collections <ChevronRight size={13} className="nav-chevron" />
                </Link>
              </li>
            </ul>
          </div>

          {/* MIDDLE COLUMN 2 — CHOVIQUE */}
          <div className="footer-nav-col">
            <h3 className="footer-col-title">CHOVIQUE</h3>
            <ul className="footer-nav-links">
              <li>
                <Link to="/our-story">
                  Our Story <ChevronRight size={13} className="nav-chevron" />
                </Link>
              </li>
              <li>
                <Link to="/our-story#the-bean-to-bar-process">
                  Our Craft <ChevronRight size={13} className="nav-chevron" />
                </Link>
              </li>
              <li>
                <Link to="/contact">
                  Contact Us <ChevronRight size={13} className="nav-chevron" />
                </Link>
              </li>
            </ul>
          </div>

          {/* MIDDLE COLUMN 3 — HELP */}
          <div className="footer-nav-col">
            <h3 className="footer-col-title">HELP</h3>
            <ul className="footer-nav-links">
              <li>
                <Link to="/dashboard?section=orders">
                  Track My Order <ChevronRight size={13} className="nav-chevron" />
                </Link>
              </li>
              <li>
                <Link to="/dashboard?section=orders">
                  Shipping & Delivery <ChevronRight size={13} className="nav-chevron" />
                </Link>
              </li>
              <li>
                <Link to="/dashboard?section=orders">
                  Returns & Refunds <ChevronRight size={13} className="nav-chevron" />
                </Link>
              </li>
              <li>
                <Link to="/dashboard?section=support">
                  Help & Support <ChevronRight size={13} className="nav-chevron" />
                </Link>
              </li>
            </ul>
          </div>

          {/* RIGHT — NEED HELP CARD */}
          <div className="footer-concierge-card">
            <div className="concierge-icon-circle">
              <Headphones size={22} className="concierge-headphone-icon" />
            </div>

            <h4 className="concierge-title">Need Help?</h4>
            <p className="concierge-subtitle">Our chocolate concierge is here for you.</p>

            <button
              type="button"
              className="concierge-contact-btn"
              onClick={() => navigate('/contact#send-us-a-message')}
            >
              <span>CONTACT CONCIERGE</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* ─── FOOTER BENEFITS STRIP (Middle section) ─── */}
        <div className="footer-benefits-strip">
          {/* Box 1 */}
          <div className="footer-benefit-box">
            <div className="benefit-icon-circle">
              <Heart size={20} />
            </div>
            <div className="benefit-text">
              <h4 className="benefit-title">HANDCRAFTED CHOCOLATES</h4>
              <p className="benefit-desc">Made with passion and perfection</p>
            </div>
          </div>

          <div className="benefit-divider" />

          {/* Box 2 */}
          <div className="footer-benefit-box">
            <div className="benefit-icon-circle">
              <Sparkles size={20} />
            </div>
            <div className="benefit-text">
              <h4 className="benefit-title">PREMIUM INGREDIENTS</h4>
              <p className="benefit-desc">Finest cocoa, sourced ethically</p>
            </div>
          </div>

          <div className="benefit-divider" />

          {/* Box 3 */}
          <div className="footer-benefit-box">
            <div className="benefit-icon-circle">
              <Gift size={20} />
            </div>
            <div className="benefit-text">
              <h4 className="benefit-title">BEAUTIFULLY PACKED</h4>
              <p className="benefit-desc">Perfect for gifting every occasion</p>
            </div>
          </div>

          <div className="benefit-divider" />

          {/* Box 4 */}
          <div className="footer-benefit-box">
            <div className="benefit-icon-circle">
              <ShieldCheck size={20} />
            </div>
            <div className="benefit-text">
              <h4 className="benefit-title">SECURE PAYMENTS</h4>
              <p className="benefit-desc">Safe, encrypted & trusted checkout</p>
            </div>
          </div>
        </div>

        {/* ─── BOTTOM LEGAL & PAYMENT BAR ─── */}
        <div className="footer-bottom-bar">
          <div className="footer-bottom-left">
            <p className="copyright-text">© 2026 CHOVIQUE. All rights reserved.</p>
            <span className="footer-italic-tagline">The Art of Fine Chocolate</span>
          </div>

          <div className="footer-bottom-center">
            <Link to="/contact">Privacy Policy</Link>
            <span className="legal-pipe">|</span>
            <Link to="/contact">Terms of Service</Link>
            <span className="legal-pipe">|</span>
            <Link to="/contact">Refund Policy</Link>
          </div>

          <div className="footer-bottom-right">
            <span className="secure-payments-label">SECURE PAYMENTS</span>
            <div className="payment-badges-row">
              {/* Credit Card */}
              <div className="payment-badge-pill" title="Credit Card">
                <span style={{ fontWeight: 700, fontSize: '11px', color: '#1a1a1a', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>
                  Credit Card
                </span>
              </div>
              {/* Debit Card */}
              <div className="payment-badge-pill" title="Debit Card">
                <span style={{ fontWeight: 700, fontSize: '11px', color: '#1a1a1a', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>
                  Debit Card
                </span>
              </div>
              {/* UPI */}
              <div className="payment-badge-pill" title="UPI">
                <span style={{ fontWeight: 800, fontSize: '11px', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#0b8243' }}>U</span>
                  <span style={{ color: '#0e70b7' }}>P</span>
                  <span style={{ color: '#0b8243' }}>I</span>
                </span>
              </div>
              {/* Google Pay */}
              <div className="payment-badge-pill" title="Google Pay">
                <span style={{ fontWeight: 700, fontSize: '11px', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: '1px', whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#4285F4' }}>G</span>
                  <span style={{ color: '#EA4335' }}>o</span>
                  <span style={{ color: '#FBBC05' }}>o</span>
                  <span style={{ color: '#4285F4' }}>g</span>
                  <span style={{ color: '#34A853' }}>l</span>
                  <span style={{ color: '#EA4335' }}>e</span>
                  <span style={{ color: '#3c4043', marginLeft: '3px' }}>Pay</span>
                </span>
              </div>
              {/* Cash on Delivery (COD) */}
              <div className="payment-badge-pill" title="Cash on Delivery (COD)">
                <span style={{ fontWeight: 700, fontSize: '11px', color: '#1a1a1a', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>
                  COD
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
