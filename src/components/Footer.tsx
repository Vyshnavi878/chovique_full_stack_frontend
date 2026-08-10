import React from 'react';
import '../styles/footer.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Reusable smooth scroll navigation handler for footer section links.
   * - If user is on home page ('/'): scrolls directly to target section element with smooth animation.
   * - If user is on another page: navigates to '/' with location state containing target scrollTo element ID.
   */
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

        {/* ─── TOP SECTION: BRAND + LINKS + RIGHT IMAGE CARD ─── */}
        <div className="footer-top-grid">

          {/* BRAND COLUMN */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand-header">
              <div className="footer-logo-wrapper">
                <img
                  src="/assets/logo.png"
                  alt="Chovique Lion Logo"
                  className="footer-logo-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/popular-bg.jpg';
                  }}
                />
              </div>
              <div className="footer-brand-titles">
                <h2 className="footer-brand-title">CHOVIQUE</h2>
                <span className="footer-brand-subtitle">The Art of Fine Chocolate</span>
              </div>
            </Link>

            <p className="footer-brand-description">
              Luxury handmade chocolates made from ethically sourced cocoa, crafted in India for every celebration.
            </p>

            <div className="footer-social-section">
              <span className="footer-social-label">FOLLOW US</span>
              <div className="footer-social-row">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                  className="footer-social-btn"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          </div>

          {/* SHOP COLUMN */}
          <div className="footer-nav-col">
            <h3 className="footer-col-title">SHOP</h3>
            <ul className="footer-nav-links">
              <li>
                <Link to="/shop">Shop All <ChevronRight size={13} className="nav-chevron" /></Link>
              </li>
              <li>
                <a
                  href="/#best-sellers"
                  onClick={(e) => handleSectionNav('best-sellers', e)}
                >
                  Best Sellers <ChevronRight size={13} className="nav-chevron" />
                </a>
              </li>
              <li>
                <a
                  href="/#new-arrivals"
                  onClick={(e) => handleSectionNav('new-arrivals', e)}
                >
                  New Arrivals <ChevronRight size={13} className="nav-chevron" />
                </a>
              </li>
              <li>
                <Link to="/shop?category=gift">Gift Boxes <ChevronRight size={13} className="nav-chevron" /></Link>
              </li>
              <li>
                <Link to="/shop">All Collections <ChevronRight size={13} className="nav-chevron" /></Link>
              </li>
            </ul>
          </div>

          {/* CATEGORIES COLUMN */}
          <div className="footer-nav-col">
            <h3 className="footer-col-title">CATEGORIES</h3>
            <ul className="footer-nav-links">
              <li>
                <Link to="/shop?category=dark">Dark Chocolate <ChevronRight size={13} className="nav-chevron" /></Link>
              </li>
              <li>
                <Link to="/shop?category=milk">Milk Chocolate <ChevronRight size={13} className="nav-chevron" /></Link>
              </li>
              <li>
                <Link to="/shop?category=white">White Chocolate <ChevronRight size={13} className="nav-chevron" /></Link>
              </li>
              <li>
                <Link to="/shop?category=gift">Gift Hamper <ChevronRight size={13} className="nav-chevron" /></Link>
              </li>
            </ul>
          </div>

          {/* COMPANY COLUMN */}
          <div className="footer-nav-col">
            <h3 className="footer-col-title">COMPANY</h3>
            <ul className="footer-nav-links">
              <li>
                <Link to="/our-story">Our Story <ChevronRight size={13} className="nav-chevron" /></Link>
              </li>
              <li>
                <Link to="/contact">Contact Us <ChevronRight size={13} className="nav-chevron" /></Link>
              </li>
            </ul>
          </div>

          {/* RIGHT SIDE IMAGE CARD */}
          <div className="footer-accent-col">
            <div className="footer-accent-img-wrapper">
              <img
                src="/assets/footer-accent.png"
                alt="CHOVIQUE Luxury Lion Emblem Dark Chocolate Box"
                className="footer-accent-img"
              />
            </div>
          </div>

        </div>

        {/* ─── MIDDLE STRIP: 4 FEATURE BOXES ─── */}
        <div className="footer-features-strip">
          {/* Beautifully Packed */}
          <div className="footer-feature-box">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12" />
                <rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </div>
            <div className="feature-text-content">
              <h4 className="feature-title">Beautifully Packed</h4>
              <p className="feature-desc">Perfect for gifting every occasion</p>
            </div>
          </div>

          <div className="feature-strip-divider" />

          {/* 100% Handmade */}
          <div className="footer-feature-box">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <div className="feature-text-content">
              <h4 className="feature-title">100% Handmade</h4>
              <p className="feature-desc">Made with love by chocolate experts</p>
            </div>
          </div>

          <div className="feature-strip-divider" />

          {/* No Preservatives */}
          <div className="footer-feature-box">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m4.93 4.93 14.14 14.14" />
              </svg>
            </div>
            <div className="feature-text-content">
              <h4 className="feature-title">No Preservatives</h4>
              <p className="feature-desc">Pure ingredients, no compromises</p>
            </div>
          </div>

          <div className="feature-strip-divider" />

          {/* Made with Love */}
          <div className="footer-feature-box">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <div className="feature-text-content">
              <h4 className="feature-title">Made with Love</h4>
              <p className="feature-desc">Crafted to spread happiness</p>
            </div>
          </div>
        </div>

        {/* ─── BOTTOM BAR: COPYRIGHT + LEGAL + PAYMENTS ─── */}
        <div className="footer-bottom-strip">
          <div className="footer-bottom-left">
            <p className="footer-copyright-text">
              © 2026 CHOVIQUE. All rights reserved.
            </p>
            <div className="footer-legal-links">
              <Link to="/privacy">Privacy Policy</Link>
              <span className="legal-sep">|</span>
              <Link to="/terms">Terms of Service</Link>
            </div>
          </div>

          <div className="footer-bottom-right">
            <span className="we-accept-title">WE ACCEPT</span>
            <div className="payment-badges-row">
              {/* PhonePe */}
              <div className="payment-badge-pill" title="PhonePe">
                <span style={{ fontWeight: 800, fontSize: '13px', color: '#5f259f', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#5f259f', color: '#fff', fontSize: '11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>पे</span>
                  PhonePe
                </span>
              </div>
              {/* GPay */}
              <div className="payment-badge-pill" title="GPay">
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#3c4043', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ color: '#4285F4', fontWeight: 800 }}>G</span>
                  <span style={{ color: '#EA4335', fontWeight: 800 }}>P</span>
                  <span style={{ color: '#FBBC05', fontWeight: 800 }}>a</span>
                  <span style={{ color: '#34A853', fontWeight: 800 }}>y</span>
                </span>
              </div>
              {/* Cards */}
              <div className="payment-badge-pill" title="Cards">
                <span style={{ fontWeight: 700, fontSize: '12px', color: '#2c3e50', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  Cards
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
