import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, User, LogOut, ChevronDown, Menu, X, Bell } from 'lucide-react';
import { useApp } from '../app/providers';
import { Button } from './ui/Button';
import { BASE_URL } from '../lib/api';

export const Navbar: React.FC = () => {
  const { role, cart, wishlist, logout, user, notifications, removeNotification } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isProfileHovered, setIsProfileHovered] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const rawAvatar = user?.profile?.avatarUrl || (user?.profile as any)?.avatar_url;
  useEffect(() => {
    setAvatarError(false);
  }, [rawAvatar]);

  const getAvatarSrc = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    return url.startsWith('/') ? `${BASE_URL}${url}` : `${BASE_URL}/${url}`;
  };

  const avatarSrc = rawAvatar ? getAvatarSrc(rawAvatar) : '';

  // Close notifications and mobile menu on page/section navigation
  useEffect(() => {
    setShowNotifications(false);
    setMobileMenuOpen(false);
  }, [location.pathname, location.search, location.state, location.key]);

  // Close notification popover on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

        {/* Desktop Menu links - Public Website Nav */}
        <ul className="nav-menu">
          <li className={`nav-item ${location.pathname === '/' ? 'active' : ''}`} onClick={() => navigate('/')}>Home</li>
          <li className={`nav-item ${location.pathname.startsWith('/shop') || location.pathname.startsWith('/product') ? 'active' : ''}`} onClick={() => navigate('/shop')}>
            Shop
          </li>
          <li className={`nav-item ${location.pathname === '/our-story' ? 'active' : ''}`} onClick={() => navigate('/our-story')}>Our Story</li>
          <li className={`nav-item ${location.pathname === '/contact' ? 'active' : ''}`} onClick={() => navigate('/contact')}>Contact</li>
        </ul>

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
          ) : role === 'customer' ? (
            <>
              {/* Customer icons (Wishlist, Cart, Notifications, Account) */}
              <Link to="/wishlist" className="nav-icon-btn" aria-label="Wishlist">
                <Heart size={20} />
                {wishlist.length > 0 && <span className="nav-badge">{wishlist.length}</span>}
              </Link>
              <Link to="/cart" className="nav-icon-btn" aria-label="Cart">
                <ShoppingBag size={20} />
                {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
              </Link>

              {/* Notifications Bell */}
              <div ref={notificationRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifications((prev) => !prev)}
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

              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setIsProfileHovered(true)}
                onMouseLeave={() => setIsProfileHovered(false)}
              >
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="nav-icon-btn nav-profile-avatar-btn"
                  aria-label="Customer Dashboard"
                  title={`${user?.name || 'Account'} - Click for Customer Dashboard`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {avatarSrc && !avatarError ? (
                    <img
                      src={avatarSrc}
                      alt={user.name}
                      onError={() => setAvatarError(true)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1.5px solid #c9a84c',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)',
                        color: '#0f0c0a',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 10px rgba(201, 168, 76, 0.3)',
                      }}
                    >
                      {user?.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                    </div>
                  )}
                </button>

                {/* Desktop Hover Tooltip — Full Name & Email ONLY */}
                <AnimatePresence>
                  {isProfileHovered && user && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        background: 'rgba(18, 14, 11, 0.96)',
                        border: '1px solid rgba(201, 168, 76, 0.35)',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <span
                        style={{
                          color: '#f5efe6',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          lineHeight: 1.2,
                        }}
                      >
                        {user.name}
                      </span>
                      <span
                        style={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '0.75rem',
                          fontWeight: 400,
                          lineHeight: 1.2,
                        }}
                      >
                        {user.email}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              {/* Admin or Superadmin — Back to Dashboard button */}
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
              >
                <span className="hide-on-mobile">← Back to {role === 'admin' ? 'Admin' : 'Superadmin'} Dashboard</span>
                <span className="show-on-mobile">← Dashboard</span>
              </button>

              <button onClick={logout} className="nav-icon-btn" aria-label="Log out" title="Log Out">
                <LogOut size={20} />
              </button>
            </>
          )}

          {/* Mobile Menu Icon */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
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
