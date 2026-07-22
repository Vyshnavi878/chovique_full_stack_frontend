import React from 'react';
import '../styles/footer.css';
import { Link, useNavigate } from 'react-router-dom';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  const handleNavScroll = (elementId: string) => {
    navigate('/', { state: { scrollTo: elementId } });
  };

  const social = [
    { label: 'Instagram', svgPath: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01', svgViewBox: '0 0 24 24', isInsta: true },
    { label: 'Facebook', svgPath: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z', svgViewBox: '0 0 24 24' },
    { label: 'Twitter', svgPath: 'M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z', svgViewBox: '0 0 24 24' },
    { label: 'YouTube', svgPath: 'M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z M9.75 15.02V8.48L15.5 11.75z', svgViewBox: '0 0 24 24' },
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-upper-grid">
          <div className="footer-brand">
            <Link to="/" className="nav-logo">
              <img
                src="/assets/logo.png"
                alt="Chovique Logo"
                style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--gold)' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548907040-4d42b52115ca?auto=format&fit=crop&w=100&q=80';
                }}
              />
              <span className="nav-logo-text">CHOVIQUE</span>
            </Link>

            <p className="footer-brand-copy">
              Premium handmade chocolates crafted with love, passion, and the world's finest cocoa beans. Every piece is a journey of flavor.
            </p>

            <div className="footer-social-links">
              {social.map((soc, idx) => (
                <a key={idx} href="#" aria-label={soc.label} className="footer-social-link">
                  <svg width="16" height="16" viewBox={soc.svgViewBox} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    {soc.isInsta ? (
                      <>
                        <rect x={2} y={2} width={20} height={20} rx={5} ry={5} />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1={17.5} y1={6.5} x2={17.51} y2={6.5} />
                      </>
                    ) : (
                      <path d={soc.svgPath} />
                    )}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div className="footer-column">
            <h4 className="footer-column-heading">Quick Links</h4>
            <ul className="footer-links-list">
              <li><span onClick={() => handleNavScroll('popular')} className="footer-link">Collections</span></li>
              <li><Link to="/shop" className="footer-link">Shop All</Link></li>
              <li><Link to="/our-story" className="footer-link">Our Story</Link></li>
              <li><span onClick={() => handleNavScroll('reviews')} className="footer-link">Reviews</span></li>
              <li><Link to="/contact" className="footer-link">Contact</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-column-heading">Categories</h4>
            <ul className="footer-links-list">
              {['Dark Chocolate', 'Milk Chocolate', 'White Chocolate', 'Gift Boxes', 'Beverages'].map((cat) => (
                <li key={cat}><Link to={`/shop?category=${cat.split(' ')[0].toLowerCase()}`} className="footer-link">{cat}</Link></li>
              ))}
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-column-heading">Support</h4>
            <ul className="footer-links-list">
              {['Shipping & Delivery', 'Returns & Refunds', 'FAQ', 'Track Order', 'Corporate Orders'].map((item) => (
                <li key={item}><a href="#" className="footer-link">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom-row">
          <p>© 2026 Chovique. All rights reserved. Handcrafted with ♥ in India.</p>
          <div className="footer-bottom-links">
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
            <a href="#" className="footer-link">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
