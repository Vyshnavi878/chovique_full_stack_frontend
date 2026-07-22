import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, User, LogOut, ChevronDown, Menu, X, Bell } from 'lucide-react';
import { useApp } from '../app/providers';
import { Button } from './ui/Button';

export const Navbar: React.FC = () => {
  const { role, cart, wishlist, logout, user, notifications, removeNotification } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Navbar background change on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Total cart count
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const megaMenuCollections = [
    { name: 'Dark Chocolate', link: '/shop?category=dark' },
    { name: 'Milk Chocolate', link: '/shop?category=milk' },
    { name: 'Truffles', link: '/shop?category=dark&type=truffle' },
    { name: 'Pralines', link: '/shop?category=dark&type=praline' },
    { name: 'Gift Boxes', link: '/shop?category=gift' },
  ];

  const megaMenuSpecialty = [
    { name: 'Chocolate Bars', link: '/shop?type=bar' },
    { name: 'Specialty', link: '/shop?filter=premium' },
    { name: 'Corporate Gifts', link: '/shop?category=gift&type=corporate' },
    { name: '✨ New Arrivals', link: '/shop?filter=new', highlight: true },
  ];

  const featuredProducts = [
    {
      name: 'Royal Dark Truffle Collection',
      shortName: 'Dark Truffles',
      price: 2500,
      originalPrice: 3249,
      discount: 23,
      image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=500&q=80',
      hoverImage: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=500&q=80',
      link: '/shop',
    },
    {
      name: 'Belgian Milk Chocolate Pralines',
      shortName: 'Pralines',
      price: 2000,
      image: 'https://images.unsplash.com/photo-1542841791-1925b02a2bcd?auto=format&fit=crop&w=500&q=80',
      hoverImage: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=500&q=80',
      link: '/shop',
    },
    {
      name: 'Signature Gold Leaf Pralines',
      shortName: 'Gold Pralines',
      price: 1649,
      originalPrice: 2199,
      discount: 25,
      image: 'https://images.unsplash.com/photo-1526081347589-7fa3cb36b312?auto=format&fit=crop&w=500&q=80',
      hoverImage: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=500&q=80',
      link: '/shop',
    },
  ];

  const handleNavScroll = (elementId: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: elementId } });
    } else {
      const el = document.getElementById(elementId);
      if (el) {
        window.scrollTo({
          top: el.offsetTop - 70,
          behavior: 'smooth',
        });
      }
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <img src="/assets/logo.png" alt="Chovique Logo" onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548907040-4d42b52115ca?auto=format&fit=crop&w=100&q=80';
          }} />
          <span className="nav-logo-text">CHOVIQUE</span>
        </Link>

        {/* Desktop Menu links - Customer Nav only */}
        {(role === 'guest' || role === 'customer') && (
          <ul className="nav-menu">
            <li className="nav-item" onClick={() => navigate('/')}>Home</li>

            {/* Shop Mega Menu */}
            <li
              className="nav-item shop-nav-item"
              onMouseEnter={() => setActiveDropdown('shop')}
              onMouseLeave={() => setActiveDropdown(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <div className="mega-menu-anchor">
                <span onClick={() => navigate('/shop')}>Shop</span>
                <ChevronDown size={14} />

                <AnimatePresence>
                  {activeDropdown === 'shop' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, x: '-50%' }}
                      animate={{ opacity: 1, y: 0, x: '-50%' }}
                      exit={{ opacity: 0, y: 10, x: '-50%' }}
                      transition={{ duration: 0.25 }}
                      className="mega-menu"
                      style={{ top: scrolled ? '49px' : '61px' }}
                      onMouseEnter={() => setActiveDropdown('shop')}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      {/* Column 1: Collections */}
                      <div className="mega-menu-column">
                        <h4 className="mega-menu-heading">Collections</h4>
                        <ul className="mega-menu-list">
                          {megaMenuCollections.map((item) => (
                            <li key={item.name}>
                              <Link
                                to={item.link}
                                className="mega-menu-link"
                                onClick={() => setActiveDropdown(null)}
                              >
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Column 2: Our Specialty */}
                      <div className="mega-menu-column">
                        <h4 className="mega-menu-heading">Our Specialty</h4>
                        <ul className="mega-menu-list">
                          {megaMenuSpecialty.map((item) => (
                            <li key={item.name}>
                              <Link
                                to={item.link}
                                className={`mega-menu-link ${item.highlight ? 'mega-menu-link--highlight' : ''}`}
                                onClick={() => setActiveDropdown(null)}
                              >
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Column 3: Chocolatier's Choice */}
                      <div className="mega-menu-column mega-menu-column--featured">
                        <h4 className="mega-menu-heading">Chocolatier's Choice</h4>
                        <div className="mega-menu-products">
                          {featuredProducts.map((product) => (
                            <Link
                              key={product.name}
                              to={product.link}
                              className="mega-menu-product-card"
                              onClick={() => setActiveDropdown(null)}
                            >
                              <div className="mega-menu-product-img-wrap">
                                {product.discount && (
                                  <span className="mega-menu-discount-badge">
                                    -{product.discount}%
                                  </span>
                                )}
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="mega-menu-product-img primary-img"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=300&q=80';
                                  }}
                                />
                                {product.hoverImage && (
                                  <img
                                    src={product.hoverImage}
                                    alt={`${product.name} alternate view`}
                                    className="mega-menu-product-img hover-img"
                                  />
                                )}
                                <span className="mega-menu-product-overlay-name">
                                  {product.shortName}
                                </span>
                              </div>
                              <div className="mega-menu-product-info">
                                <span className="mega-menu-product-name">{product.name}</span>
                                <div className="mega-menu-product-pricing">
                                  <span className="mega-menu-product-price">₹{product.price.toLocaleString('en-IN')}</span>
                                  {product.originalPrice && (
                                    <span className="mega-menu-product-original">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                                  )}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </li>

            <li className="nav-item" onClick={() => navigate('/our-story')}>Our Story</li>
            <li className="nav-item" onClick={() => navigate('/contact')}>Contact</li>
          </ul>
        )}

        {/* Action Buttons Right */}
        <div className="nav-actions">
          {role === 'guest' ? (
            <>
              <Button variant="text" size="sm" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button variant="gold" size="sm" onClick={() => navigate('/register')} glow>
                Register
              </Button>
            </>
          ) : (
            <>
              {/* Customer specific icons */}
              {role === 'customer' && (
                <>
                  <Link to="/wishlist" className="nav-icon-btn" aria-label="Wishlist">
                    <Heart size={20} />
                    {wishlist.length > 0 && <span className="nav-badge">{wishlist.length}</span>}
                  </Link>
                  <Link to="/cart" className="nav-icon-btn" aria-label="Cart">
                    <ShoppingBag size={20} />
                    {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
                  </Link>

                  {/* Notifications Bell */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="nav-icon-btn"
                      aria-label="Notifications"
                      title="Notifications"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <Bell size={20} />
                      {notifications.length > 0 && (
                        <span className="nav-badge" style={{ backgroundColor: '#ff3b30', color: '#ffffff' }}>{notifications.length}</span>
                      )}
                    </button>

                    <AnimatePresence>
                      {showNotifications && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          style={{
                            position: 'absolute',
                            top: '35px',
                            right: '-10px',
                            width: '320px',
                            background: 'var(--dark-chocolate)',
                            border: '1px solid var(--gold)',
                            borderRadius: '8px',
                            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
                            padding: '16px',
                            zIndex: 100,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '8px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--gold)' }}>Notifications</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>{notifications.length} Active</span>
                          </div>

                          <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {notifications.length === 0 ? (
                              <p style={{ fontSize: '0.8rem', color: 'var(--grey-light)', textAlign: 'center', margin: '20px 0', fontStyle: 'italic' }}>
                                No new notifications.
                              </p>
                            ) : (
                              notifications.map((n) => (
                                <div
                                  key={n.id}
                                  onClick={() => {
                                    removeNotification(n.id);
                                    setShowNotifications(false);
                                    if (n.type === 'support') {
                                      navigate('/dashboard', { state: { tab: 'help' } });
                                    } else if (n.type === 'order') {
                                      navigate('/dashboard', { state: { tab: 'orders' } });
                                    } else {
                                      navigate('/dashboard', { state: { tab: 'notifications' } });
                                    }
                                  }}
                                  style={{
                                    padding: '10px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    color: 'var(--cream)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    textAlign: 'left',
                                  }}
                                >
                                  <div style={{ flex: 1, marginRight: '10px' }}>
                                    <p style={{ margin: 0, lineHeight: '1.4' }}>{n.text}</p>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--grey-light)', display: 'block', marginTop: '4px' }}>{n.date}</span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeNotification(n.id);
                                    }}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'var(--grey-light)',
                                      cursor: 'pointer',
                                      fontSize: '0.75rem',
                                      padding: '2px 4px',
                                    }}
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Link to="/dashboard" className="nav-icon-btn" aria-label="Dashboard" title="Dashboard">
                    <User size={20} />
                  </Link>
                </>
              )}

              {/* Admin or Superadmin — Back to Dashboard button */}
              {(role === 'admin' || role === 'superadmin') && (
                <button
                  onClick={() => navigate(role === 'admin' ? '/admin' : '/superadmin')}
                  className="nav-back-to-dashboard-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--dark-chocolate)',
                    background: 'var(--gradient-gold)',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 12px rgba(201, 168, 76, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(201, 168, 76, 0.5)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(201, 168, 76, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span className="hide-on-mobile">← Back to {role === 'admin' ? 'Admin' : 'Superadmin'} Dashboard</span>
                  <span className="show-on-mobile">← Dashboard</span>
                </button>
              )}

              {/* Log Out */}
              <button onClick={logout} className="nav-icon-btn" aria-label="Log out" title="Log Out">
                <LogOut size={20} />
              </button>
            </>
          )}

          {/* Mobile Menu Icon */}
          {(role === 'guest' || role === 'customer') && (
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: '100%',
              background: 'rgba(var(--dark-chocolate-rgb), 0.98)',
              borderBottom: '1px solid var(--glass-border)',
              zIndex: 99,
              overflow: 'hidden',
            }}
          >
                <div className="mobile-nav-actions">
                  {role === 'guest' ? (
                    <>
                      <Link to="/login" className="mobile-nav-action-btn" onClick={() => setMobileMenuOpen(false)}>
                        Sign In
                      </Link>
                      <Link to="/register" className="mobile-nav-action-btn" onClick={() => setMobileMenuOpen(false)}>
                        Register
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/cart" className="mobile-nav-action-btn" onClick={() => setMobileMenuOpen(false)}>
                        Cart ({cartCount})
                      </Link>
                      <Link to="/wishlist" className="mobile-nav-action-btn" onClick={() => setMobileMenuOpen(false)}>
                        Wishlist ({wishlist.length})
                      </Link>
                      <Link to="/dashboard" className="mobile-nav-action-btn" onClick={() => setMobileMenuOpen(false)}>
                        Dashboard
                      </Link>
                      <button 
                        className="mobile-nav-action-btn" 
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                        style={{
                          background: 'rgba(231, 76, 60, 0.1)',
                          border: '1px solid rgba(231, 76, 60, 0.3)',
                          color: '#e74c3c',
                          cursor: 'pointer',
                        }}
                      >
                        Log Out
                      </button>
                    </>
                  )}
                </div>
            <ul style={{ padding: '20px 5%', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <li style={{ listStyle: 'none' }}>
                <Link to="/" style={{ color: 'var(--cream)', textTransform: 'uppercase', fontSize: '1rem' }} onClick={() => setMobileMenuOpen(false)}>Home</Link>
              </li>
              <li style={{ listStyle: 'none' }}>
                <Link to="/shop" style={{ color: 'var(--cream)', textTransform: 'uppercase', fontSize: '1rem' }} onClick={() => setMobileMenuOpen(false)}>Shop All</Link>
              </li>
              <li style={{ listStyle: 'none', color: 'var(--gold)', fontWeight: 'bold' }}>Collections</li>
              {megaMenuCollections.map((cat) => (
                <li key={cat.name} style={{ listStyle: 'none', paddingLeft: '15px' }}>
                  <Link to={cat.link} style={{ color: 'var(--beige)', fontSize: '0.9rem' }} onClick={() => setMobileMenuOpen(false)}>
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li style={{ listStyle: 'none', color: 'var(--gold)', fontWeight: 'bold' }}>Our Specialty</li>
              {megaMenuSpecialty.map((item) => (
                <li key={item.name} style={{ listStyle: 'none', paddingLeft: '15px' }}>
                  <Link to={item.link} style={{ color: 'var(--beige)', fontSize: '0.9rem' }} onClick={() => setMobileMenuOpen(false)}>
                    {item.name}
                  </Link>
                </li>
              ))}
              <li style={{ listStyle: 'none' }}>
                <Link to="/our-story" style={{ color: 'var(--cream)', textTransform: 'uppercase', fontSize: '1rem' }} onClick={() => setMobileMenuOpen(false)}>Our Story</Link>
              </li>
              <li style={{ listStyle: 'none' }}>
                <Link to="/contact" style={{ color: 'var(--cream)', textTransform: 'uppercase', fontSize: '1rem' }} onClick={() => setMobileMenuOpen(false)}>Contact</Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
