import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './providers';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { ErrorBoundary } from '../components/ErrorBoundary';


// Pages
import { LandingPage, OurStoryPage, ContactPage } from '../features/landing';
import { ShopPage } from '../features/shop/ShopPage';
import { ProductDetails } from '../features/shop/ProductDetails';
import { CartPage } from '../features/cart/CartPage';
import { CheckoutPage } from '../features/checkout/CheckoutPage';
import { WishlistPage } from '../features/wishlist/WishlistPage';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { SetPasswordPage } from '../features/auth/SetPasswordPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { CustomerDashboard } from '../features/dashboard/CustomerDashboard';
import { AdminDashboard } from '../features/admin/AdminDashboard';
import { SuperadminDashboard } from '../features/superadmin/SuperadminDashboard';
import { NotFoundPage } from '../features/error/NotFoundPage';

// Styles
import '../styles/global.css';
import '../styles/animations.css';
import '../styles/navbar.css';
import '../styles/shop.css';
import '../styles/products.css';
import '../styles/forms.css';
import '../styles/dashboards.css';
import '../styles/admin.css';

// Scroll Restoration helper
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

/**
 * SuperadminRedirect - If a superadmin lands on /admin, redirect them to /superadmin.
 * This prevents superadmin from accidentally using the regular admin dashboard.
 */
const SuperadminRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useApp();
  if (role === 'superadmin') {
    return <Navigate to="/superadmin" replace />;
  }
  return <>{children}</>;
};


const AppContent: React.FC = () => {
  const location = useLocation();
  const { role } = useApp();

  // Route conditionals for Navbar and Footer
  const isAuthRoute = ['/login', '/register', '/set-password', '/forgot-password'].includes(location.pathname);
  const isAdminDashboard = ['/admin', '/superadmin'].includes(location.pathname);
  const isCustomerDashboard = location.pathname === '/dashboard';

  const showNavbar = !isAuthRoute && !isAdminDashboard;
  const showFooter = !isAuthRoute && !isAdminDashboard && !isCustomerDashboard && location.pathname !== '/checkout';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <ScrollToTop />
      {showNavbar && <Navbar />}

      <main style={{ flexGrow: 1 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/our-story" element={<OurStoryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Guest-accessible but redirects to login at checkout */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />

          {/* Protected: Customer */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={['customer', 'admin', 'superadmin']}>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['customer', 'admin', 'superadmin']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/set-password"
            element={
              <ProtectedRoute allowedRoles={['customer', 'admin', 'superadmin']}>
                <SetPasswordPage />
              </ProtectedRoute>
            }
          />

          {/* Protected: Admin only (superadmin redirected to /superadmin) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                <ErrorBoundary>
                  {/* If superadmin visits /admin, redirect them to /superadmin */}
                  <SuperadminRedirect>
                    <AdminDashboard />
                  </SuperadminRedirect>
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* Protected: Superadmin only */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <ErrorBoundary>
                  <SuperadminDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>

      </main>

      {showFooter && <Footer />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
};

export default App;
