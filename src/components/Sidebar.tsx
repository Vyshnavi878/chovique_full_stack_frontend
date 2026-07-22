import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  FolderTree,
  ListOrdered,
  Users,
  Tag,
  Warehouse,
  Coins,
  Star,
  FileText,
  Settings,
  Image,
  LogOut,
  ShieldCheck,
  Palette,
  FileClock,
  Home,
  Database,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import { useApp } from '../app/providers';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { role, logout } = useApp();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Admin tab items
  const adminItems = [
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventory', icon: Warehouse },
    { id: 'offline-sales', label: 'Offline Sales', icon: Coins },
    { id: 'customers', label: 'Order Management', icon: Users },
    { id: 'complaints', label: 'Customer Complaints', icon: AlertTriangle },
  ];

  // Superadmin tab items
  const superadminItems = [
    { id: 'enterprise', label: 'Enterprise', icon: ShieldCheck },
    { id: 'revenue', label: 'Revenue Analytics', icon: Coins },
    { id: 'sales-comparison', label: 'Sales Analytics', icon: Database },
    { id: 'admin-mgmt', label: 'Admin Management', icon: Users },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileClock },
    { id: 'theme-builder', label: 'Theme Builder', icon: Palette },
    { id: 'home-mgmt', label: 'Banner & Carousel', icon: Image },
    { id: 'platform-settings', label: 'Platform Settings', icon: Settings },
  ];

  const items = role === 'superadmin' ? superadminItems : adminItems;

  return (
    <>
      {/* Mobile Header Bar */}
      {isMobile && (
        <div className="admin-mobile-header">
          <button
            onClick={() => setIsOpen(true)}
            style={{ color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}
            aria-label="Open Sidebar Menu"
          >
            <Menu size={24} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img
              src="/assets/logo.png"
              alt="Logo"
              style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--gold)' }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548907040-4d42b52115ca?auto=format&fit=crop&w=100&q=80';
              }}
            />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1rem',
              letterSpacing: '1px',
              color: 'var(--cream)'
            }}>
              CHOVIQUE
            </span>
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 600 }}>
            {role === 'superadmin' ? 'S.Admin' : 'Admin'}
          </span>
        </div>
      )}

      {/* Sidebar Overlay Backdrop */}
      {isMobile && (
        <div
          className={`admin-sidebar-backdrop ${isOpen ? 'open' : ''}`}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Main Layout */}
      <div
        style={{
          width: '260px',
          height: '100vh',
          background: 'var(--dark-chocolate)',
          borderRight: '1px solid var(--glass-border)',
          position: 'fixed',
          top: 0,
          left: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 16px',
          zIndex: 110,
          fontFamily: 'var(--font-body)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Brand Header & Optional Mobile Close Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: '8px',
            }}
          >
            <div
              onClick={() => {
                if (isMobile) setIsOpen(false);
                navigate('/');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
              }}
            >
              <img
                src="/assets/logo.png"
                alt="Chovique Logo"
                style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--gold)' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548907040-4d42b52115ca?auto=format&fit=crop&w=100&q=80';
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  letterSpacing: '1.5px',
                  background: 'var(--gradient-gold-text)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                CHOVIQUE
              </span>
            </div>

            {isMobile && (
              <button
                onClick={() => setIsOpen(false)}
                style={{ color: 'var(--rose-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Navigation Items List */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--gold)',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: 600,
                paddingLeft: '10px',
                marginBottom: '6px',
              }}
            >
              {role} Workspace
            </span>
            <div style={{ maxHeight: '65vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (isMobile) setIsOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      color: isActive ? 'var(--dark-chocolate)' : 'var(--beige)',
                      background: isActive ? 'var(--gradient-gold)' : 'transparent',
                      fontWeight: isActive ? 600 : 400,
                      textAlign: 'left',
                      transition: 'all 0.3s ease',
                    }}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Footer Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => {
              if (isMobile) setIsOpen(false);
              navigate('/');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '10px 14px',
              borderRadius: '4px',
              fontSize: '0.9rem',
              color: 'var(--cream)',
              background: 'rgba(255, 255, 255, 0.05)',
              textAlign: 'left',
            }}
          >
            <Home size={18} />
            <span>View Site</span>
          </button>
          <button
            onClick={() => {
              if (isMobile) setIsOpen(false);
              logout();
              navigate('/');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '10px 14px',
              borderRadius: '4px',
              fontSize: '0.9rem',
              color: 'var(--rose-gold)',
              background: 'transparent',
              textAlign: 'left',
              border: '1px solid rgba(183, 110, 121, 0.2)',
            }}
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
};
export default Sidebar;
