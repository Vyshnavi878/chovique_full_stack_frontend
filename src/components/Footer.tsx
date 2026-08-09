import React, { useState, useEffect } from 'react';
import '../styles/footer.css';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { categoryService } from '../services/categoryService';
import { Category } from '../types';

export const Footer: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    categoryService.getCategories()
      .then((cats) => {
        if (Array.isArray(cats)) {
          setCategories(cats);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="chovique-footer">
      <div className="chovique-footer-container">

        {/* ─── TOP SECTION: BRAND + LINKS + IMAGE ─── */}
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
                    // Fallback to inline SVG lion if image not found
                    const wrapper = (e.target as HTMLImageElement).parentElement;
                    if (wrapper) {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }
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
              <span className="footer-social-label">Follow Us</span>
              <div className="footer-social-row">
                {/* Instagram */}
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
                {/* Facebook */}
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
                {/* YouTube */}
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
                {/* Pinterest */}
                <a
                  href="https://pinterest.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Pinterest"
                  className="footer-social-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
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
                <Link to="/shop">Shop All <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
              <li>
                <Link to="/shop?filter=best-sellers">Best Sellers <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
              <li>
                <Link to="/shop?filter=new-arrivals">New Arrivals <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
              <li>
                <Link to="/shop?category=gift">Gift Boxes <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
              <li>
                <Link to="/shop">All Collections <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
            </ul>
          </div>

          {/* CATEGORIES COLUMN (Dynamic from Backend DB) */}
          <div className="footer-nav-col">
            <h3 className="footer-col-title">CATEGORIES</h3>
            <ul className="footer-nav-links">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <li key={cat.id || cat.slug}>
                    <Link to={`/shop?category=${encodeURIComponent(cat.slug)}`}>
                      {cat.name} <ChevronRight size={12} className="nav-chevron" />
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <Link to="/shop">Shop All <ChevronRight size={12} className="nav-chevron" /></Link>
                </li>
              )}
            </ul>
          </div>

          {/* COMPANY COLUMN */}
          <div className="footer-nav-col">
            <h3 className="footer-col-title">COMPANY</h3>
            <ul className="footer-nav-links">
              <li>
                <Link to="/our-story">About Us <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
              <li>
                <Link to="/our-story">Our Story <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
              <li>
                <Link to="/contact">Contact Us <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
            </ul>
          </div>

          {/* CHOCOLATE ACCENT IMAGE */}
          <div className="footer-accent-col">
            <div className="footer-accent-img-wrapper">
              <img
                src="/assets/footer-accent.png"
                alt="Luxury Handmade Dark Chocolate & Cocoa Pod"
                className="footer-accent-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80';
                }}
              />
            </div>
          </div>

        </div>

        {/* ─── MIDDLE STRIP: TRUST FEATURES ─── */}
        <div className="footer-features-strip">
          {/* Beautifully Packed */}
          <div className="footer-feature-box">
            <div className="feature-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="feature-icon">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="feature-icon">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                <circle cx="12" cy="10" r="3" />
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="feature-icon">
                <path d="M17 8C8 10 5.9 16.17 3.82 19.34" />
                <path d="M21 4c-1.66 4-4.35 7.78-7.8 10.66" />
                <path d="M3.5 11.5s2-5 8-9" />
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="feature-icon">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
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
              <span className="legal-sep">|</span>
              <Link to="/sitemap">Sitemap</Link>
            </div>
          </div>

          <div className="footer-bottom-right">
            <span className="we-accept-title">We Accept</span>
            <div className="payment-badges-row">
              {/* VISA */}
              <div className="payment-badge-pill" title="Visa">
                <span style={{ fontWeight: 800, fontSize: '15px', fontStyle: 'italic', color: '#1A1F71', fontFamily: 'sans-serif', letterSpacing: '-0.5px' }}>
                  VISA
                </span>
              </div>
              {/* MasterCard */}
              <div className="payment-badge-pill" title="Mastercard">
                <div style={{ display: 'flex', alignItems: 'center', height: '18px' }}>
                  <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#EB001B', display: 'inline-block' }} />
                  <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#F79E1B', display: 'inline-block', marginLeft: '-6px', opacity: 0.9 }} />
                </div>
              </div>
              {/* RuPay */}
              <div className="payment-badge-pill" title="RuPay">
                <span style={{ fontWeight: 800, fontSize: '12px', color: '#00539C', fontFamily: 'sans-serif' }}>
                  Ru<span style={{ color: '#F37021' }}>Pay</span><span style={{ color: '#F37021', fontSize: '10px' }}>❯❯</span>
                </span>
              </div>
              {/* BHIM UPI */}
              <div className="payment-badge-pill" title="UPI">
                <span style={{ fontWeight: 800, fontSize: '12px', color: '#008346', fontFamily: 'sans-serif', letterSpacing: '-0.5px' }}>
                  UPI<span style={{ color: '#00539C', fontSize: '11px' }}>▲</span>
                </span>
              </div>
              {/* Google Pay */}
              <div className="payment-badge-pill" title="Google Pay">
                <span style={{ fontWeight: 600, fontSize: '12px', color: '#5F6368', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span style={{ color: '#4285F4', fontWeight: 800 }}>G</span> Pay
                </span>
              </div>
              {/* Apple Pay */}
              <div className="payment-badge-pill" title="Apple Pay">
                <span style={{ fontWeight: 600, fontSize: '12px', color: '#000000', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <svg width="12" height="12" viewBox="0 0 170 170" fill="currentColor">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.9-14.36-6.09-3.37-2.76-7.26-7.44-11.66-14.05-7.72-11.54-13.62-24.16-17.7-37.86-4.08-13.7-6.13-26.65-6.13-38.86 0-16.14 4.21-29.41 12.63-39.81 8.42-10.4 18.79-15.7 31.11-15.91 5.33 0 10.87 1.25 16.62 3.75 5.75 2.5 9.77 3.75 12.06 3.75 1.94 0 6.03-1.35 12.28-4.05 6.25-2.7 11.66-3.95 16.23-3.75 13.58 0.65 24.34 5.37 32.28 14.16-11.96 7.28-17.83 17.37-17.61 30.27.22 10.22 4.14 18.66 11.75 25.32 7.62 6.66 16.53 10.37 26.74 11.13-2.61 7.71-6.19 15.65-10.74 23.82z" />
                  </svg>
                  Pay
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
