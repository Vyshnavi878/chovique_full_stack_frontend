import React from 'react';
import '../styles/footer.css';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Mail, Phone, ShieldCheck, Sprout, Heart, Truck, ChevronRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  const handleNavScroll = (elementId: string) => {
    navigate('/', { state: { scrollTo: elementId } });
  };

  return (
    <footer className="chovique-footer">
      <div className="chovique-footer-container">

        {/* TOP SECTION: BRAND + LINKS + CHOCOLATE GRAPHIC */}
        <div className="footer-top-grid">

          {/* BRAND COLUMN */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand-header">
              <div className="footer-logo-wrapper">
                <svg viewBox="0 0 100 100" className="footer-logo-svg" aria-label="Chovique Logo">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  {/* Ears */}
                  <polygon points="24,40 36,18 42,34" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <polygon points="76,40 64,18 58,34" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  {/* Forehead & Crown */}
                  <polygon points="50,18 58,34 50,46 42,34" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  {/* Cheeks */}
                  <polygon points="24,40 42,34 45,56 26,52" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  <polygon points="76,40 58,34 55,56 74,52" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  {/* Snout */}
                  <polygon points="45,56 50,46 55,56 50,78" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  {/* Nose */}
                  <polygon points="50,68 46,74 54,74" fill="currentColor" />
                  {/* Jawline */}
                  <line x1="26" y1="52" x2="50" y2="82" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="74" y1="52" x2="50" y2="82" stroke="currentColor" strokeWidth="1.5" />
                  {/* Eyes */}
                  <circle cx="41" cy="42" r="1.5" fill="currentColor" />
                  <circle cx="59" cy="42" r="1.5" fill="currentColor" />
                </svg>
              </div>
              <div className="footer-brand-titles">
                <h2 className="footer-brand-title">CHOVIQUE</h2>
                <span className="footer-brand-subtitle">LUXURY HANDMADE CHOCOLATES</span>
                <div className="footer-heart-divider">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </div>
              </div>
            </Link>

            <p className="footer-brand-description">
              Luxury handcrafted chocolates made from ethically sourced cocoa, crafted in India for every celebration.
            </p>

            <div className="footer-contact-list">
              <div className="footer-contact-item">
                <MapPin className="footer-contact-icon" size={14} />
                <span>Hyderabad, India</span>
              </div>
              <a href="mailto:hello@chovique.com" className="footer-contact-item">
                <Mail className="footer-contact-icon" size={14} />
                <span>hello@chovique.com</span>
              </a>
              <a href="tel:+919876543210" className="footer-contact-item">
                <Phone className="footer-contact-icon" size={14} />
                <span>+91 98765 43210</span>
              </a>
            </div>

            <div className="footer-social-row">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="footer-social-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="footer-social-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z"></path>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="footer-social-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X (Twitter)" className="footer-social-btn">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* SHOP COLUMN */}
          <div className="footer-nav-col">
            <h3 className="footer-col-title">SHOP</h3>
            <div className="footer-diamond-divider">
              <span className="divider-line"></span>
              <span className="divider-diamond">◇</span>
              <span className="divider-line"></span>
            </div>
            <ul className="footer-nav-links">
              <li>
                <Link to="/shop">Shop All <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
              <li>
                <span onClick={() => handleNavScroll('popular')} className="footer-scroll-link">Collections <ChevronRight size={12} className="nav-chevron" /></span>
              </li>
              <li>
                <Link to="/shop?filter=best-sellers">Best Sellers <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
              <li>
                <Link to="/shop?filter=new-arrivals">New Arrivals <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
              <li>
                <Link to="/shop?category=gift-boxes">Gift Boxes <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
            </ul>
          </div>

          {/* CATEGORIES COLUMN */}
          <div className="footer-nav-col">
            <h3 className="footer-col-title">CATEGORIES</h3>
            <div className="footer-diamond-divider">
              <span className="divider-line"></span>
              <span className="divider-diamond">◇</span>
              <span className="divider-line"></span>
            </div>
            <ul className="footer-nav-links">
              <li>
                <Link to="/shop?category=dark">Dark Chocolate <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
              <li>
                <Link to="/shop?category=milk">Milk Chocolate <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
              <li>
                <Link to="/shop?category=white">White Chocolate <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
              <li>
                <Link to="/shop?category=truffles">Truffles <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
            </ul>
          </div>

          {/* COMPANY COLUMN */}
          <div className="footer-nav-col">
            <h3 className="footer-col-title">COMPANY</h3>
            <div className="footer-diamond-divider">
              <span className="divider-line"></span>
              <span className="divider-diamond">◇</span>
              <span className="divider-line"></span>
            </div>
            <ul className="footer-nav-links">
              <li>
                <Link to="/our-story">About Us <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
              <li>
                <Link to="/our-story">Our Story <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
              <li>
                <span onClick={() => handleNavScroll('reviews')} className="footer-scroll-link">Reviews <ChevronRight size={12} className="nav-chevron" /></span>
              </li>
              <li>
                <Link to="/contact">Contact Us <ChevronRight size={12} className="nav-chevron" /></Link>
              </li>
            </ul>
          </div>

          {/* CHOCOLATE ACCENT IMAGE SECTION */}
          <div className="footer-accent-col">
            <div className="footer-accent-img-wrapper">
              <img
                src="/assets/footer-accent.png"
                alt="Luxury Handmade Dark Chocolate & Cocoa Pod"
                className="footer-accent-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80';
                }}
              />
            </div>
          </div>

        </div>

        {/* MIDDLE SECTION: TRUST & FEATURES STRIP */}
        <div className="footer-features-strip">
          <div className="footer-feature-box">
            <div className="feature-icon-wrapper">
              <ShieldCheck size={20} className="feature-icon" />
            </div>
            <div className="feature-text-content">
              <h4 className="feature-title">SECURE PAYMENTS</h4>
              <p className="feature-desc">100% secure &amp; trusted payment options</p>
            </div>
          </div>

          <div className="feature-strip-divider"></div>

          <div className="footer-feature-box">
            <div className="feature-icon-wrapper">
              <Sprout size={20} className="feature-icon" />
            </div>
            <div className="feature-text-content">
              <h4 className="feature-title">PREMIUM COCOA</h4>
              <p className="feature-desc">Ethically sourced finest cocoa beans</p>
            </div>
          </div>

          <div className="feature-strip-divider"></div>

          <div className="footer-feature-box">
            <div className="feature-icon-wrapper">
              <Heart size={20} className="feature-icon" />
            </div>
            <div className="feature-text-content">
              <h4 className="feature-title">HANDMADE</h4>
              <p className="feature-desc">Made with love by expert chocolatiers</p>
            </div>
          </div>

          <div className="feature-strip-divider"></div>

          <div className="footer-feature-box">
            <div className="feature-icon-wrapper">
              <Truck size={20} className="feature-icon" />
            </div>
            <div className="feature-text-content">
              <h4 className="feature-title">FAST DELIVERY</h4>
              <p className="feature-desc">Carefully packed &amp; delivered to you</p>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: COPYRIGHT, LEGAL & PAYMENT METHOD BADGES */}
        <div className="footer-bottom-strip">
          <div className="footer-bottom-left">
            <p className="footer-copyright-text">
              © 2026 CHOVIQUE. All rights reserved.
            </p>
            <p className="footer-crafted-text">
              Crafted with Passion in India. <span className="gold-heart">♥</span>
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
            <span className="we-accept-title">WE ACCEPT</span>
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
                  <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#EB001B', display: 'inline-block' }}></span>
                  <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: '#F79E1B', display: 'inline-block', marginLeft: '-6px', opacity: 0.9 }}></span>
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
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.9-14.36-6.09-3.37-2.76-7.26-7.44-11.66-14.05-7.72-11.54-13.62-24.16-17.7-37.86-4.08-13.7-6.13-26.65-6.13-38.86 0-16.14 4.21-29.41 12.63-39.81 8.42-10.4 18.79-15.7 31.11-15.91 5.33 0 10.87 1.25 16.62 3.75 5.75 2.5 9.77 3.75 12.06 3.75 1.94 0 6.03-1.35 12.28-4.05 6.25-2.7 11.66-3.95 16.23-3.75 13.58 0.65 24.34 5.37 32.28 14.16-11.96 7.28-17.83 17.37-17.61 30.27.22 10.22 4.14 18.66 11.75 25.32 7.62 6.66 16.53 10.37 26.74 11.13-2.61 7.71-6.19 15.65-10.74 23.82zM119.22 31.84c0-7.39 2.72-14.45 8.16-21.18 5.44-6.73 12.19-10.66 20.25-11.79.22.87.33 1.74.33 2.61 0 7.39-2.77 14.56-8.31 21.51-5.54 6.95-12.33 10.87-20.37 11.75-.06-.9-.06-1.87-.06-2.9z" />
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
