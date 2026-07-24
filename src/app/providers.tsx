import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Product,
  CartItem,
  User,
  UserRole,
  Order,
  Banner,
  OfflineSale,
  SupportTicket,
  CustomerAddress,
  SupportNotification,
} from '../types';
import { initialProducts, initialBanners, initialOrders, initialOfflineSales } from '../data/mockData';
import { getToken, clearToken } from '../lib/api';
import { authService } from '../services/authService';
import { orderService } from '../services/orderService';
import { ticketService } from '../services/ticketService';
import { userService } from '../services/userService';
import { notificationService } from '../services/notificationService';

// =============================================================================
// CONTEXT INTERFACE
// =============================================================================

interface AppContextType {
  // Auth
  user: User | null;
  role: UserRole;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (email: string, otp: string, fullName: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  // Products
  products: Product[];
  banners: Banner[];

  // Orders
  orders: Order[];
  offlineSales: OfflineSale[];

  // Theme
  theme: {
    primary: string;
    darkChocolate: string;
    gold: string;
    roseGold: string;
    black: string;
  };

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Wishlist
  wishlist: Product[];
  toggleWishlist: (product: Product) => void;
  moveToCart: (product: Product) => void;

  // Orders
  placeOrderLocal: (order: Order) => void;

  // Admin product operations
  addProduct: (product: Omit<Product, 'id' | 'rating' | 'ratingsCount' | 'reviews'>) => void;
  updateProductInventory: (productId: string, weight: string, price: number) => void;
  deleteProduct: (productId: string) => void;

  // Admin offline sales
  addOfflineSale: (sale: Omit<OfflineSale, 'id' | 'date'>) => void;
  importOfflineSales: (salesList: Omit<OfflineSale, 'id' | 'date'>[]) => void;

  // Banners
  updateBanner: (id: string, bannerData: Partial<Banner>) => void;

  // Theme
  updateThemeColors: (colors: {
    primary?: string;
    darkChocolate?: string;
    gold?: string;
    roseGold?: string;
    black?: string;
  }) => void;

  // Support Tickets
  tickets: SupportTicket[];
  addSupportTicket: (category: SupportTicket['category'], description: string) => Promise<void>;
  resolveSupportTicket: (ticketId: string, adminNotes?: string) => Promise<void>;
  submitTicketFeedback: (ticketId: string, feedback: 'Resolved' | 'Not Resolved') => Promise<void>;
  acknowledgeTicketNotification: (ticketId: string) => void;

  // Profile
  updateUserProfilePicture: (avatarUrl: string) => void;
  updateUserProfile: (profile: {
    name?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    preferences?: string;
  }) => void;

  // Addresses
  addresses: CustomerAddress[];
  addAddress: (address: Omit<CustomerAddress, 'id'>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;

  // Notifications
  notifications: SupportNotification[];
  removeNotification: (id: string) => void;
  addNotification: (
    text: string,
    type: SupportNotification['type'],
    referenceId?: string
  ) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultTheme = {
  primary: '#3B1E08',
  darkChocolate: '#1A0D00',
  gold: '#C9A84C',
  roseGold: '#B76E79',
  black: '#0A0A0A',
};

// =============================================================================
// PROVIDER
// =============================================================================

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ---------------------------------------------------------------------------
  // Auth State
  // ---------------------------------------------------------------------------

  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('guest');

  /**
   * On mount: attempt to rehydrate the session from a stored JWT token.
   * 1. If a token exists, call GET /users/me to get a fresh user profile.
   * 2. If the token is expired/invalid, fall back to cached user in localStorage.
   * 3. Otherwise, start as guest.
   */
  useEffect(() => {
    const rehydrate = async () => {
      // 'chovique_session' is a lightweight flag set after a successful login.
      // We only attempt getMe() if this flag exists — avoids calling the backend
      // on every page load (including the login page) and prevents 401 redirect loops.
      const hasSession =
        localStorage.getItem('chovique_session') === '1' || getToken() !== null;

      if (hasSession) {
        try {
          const freshUser = await authService.getMe();
          setUser(freshUser);
          setRole(freshUser.role as UserRole);
          localStorage.setItem('chovique_user', JSON.stringify(freshUser));
          localStorage.setItem('chovique_session', '1');
          setIsAuthLoading(false);
          return;
        } catch {
          // Session expired — clear everything
          clearToken();
          localStorage.removeItem('chovique_session');
          localStorage.removeItem('chovique_user');
        }
      }

      // Fallback: read cached user from localStorage (offline / demo mode)
      const savedUser = localStorage.getItem('chovique_user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser) as User;
          setUser(parsedUser);
          setRole(parsedUser.role);
        } catch {
          localStorage.removeItem('chovique_user');
          setUser(null);
          setRole('guest');
        }
      }
      setIsAuthLoading(false);
    };

    rehydrate();
  }, []);

  // ---------------------------------------------------------------------------
  // Auth Handlers — connected to FastAPI backend via authService
  // ---------------------------------------------------------------------------

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
      try {
        const response = await authService.login({ email, password });
        const loggedInUser = response.user as User;
        setUser(loggedInUser);
        setRole(loggedInUser.role);
        localStorage.setItem('chovique_user', JSON.stringify(loggedInUser));
        // Mark that a session exists so rehydration will call getMe() on next mount
        localStorage.setItem('chovique_session', '1');
        return { success: true, role: loggedInUser.role };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
        return { success: false, error: message };
      }
    },
    []
  );

  const register = useCallback(
    async (name: string, email: string, password: string, confirmPassword: string): Promise<{ success: boolean; error?: string }> => {
      try {
        // This only triggers the OTP email — the account is created in verifyOtp below.
        await authService.register({ name, email, password, confirmPassword });
        return { success: true };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Registration failed. Please try again.';
        return { success: false, error: message };
      }
    },
    []
  );

  const verifyOtp = useCallback(
    async (email: string, otp: string, fullName: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await authService.verifyOtp({ email, otp, fullName, password });
        const newUser = response.user as User;
        setUser(newUser);
        setRole(newUser.role);
        localStorage.setItem('chovique_user', JSON.stringify(newUser));
        localStorage.setItem('chovique_session', '1');
        return { success: true };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'OTP verification failed. Please try again.';
        return { success: false, error: message };
      }
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch {
      // Best-effort server-side logout — always clear local state
    } finally {
      localStorage.removeItem('chovique_user');
      localStorage.removeItem('chovique_session');
      setUser(null);
      setRole('guest');
      setCart([]);
      setWishlist([]);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Theme State (kept in localStorage — intentional client-side preference)
  // ---------------------------------------------------------------------------

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('chovique_theme');
    return saved ? JSON.parse(saved) : defaultTheme;
  });

  // ---------------------------------------------------------------------------
  // Product State — seeded from mockData; ShopPage overrides with service calls
  // ---------------------------------------------------------------------------

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('chovique_products');
    if (!saved) return initialProducts;
    try {
      const parsed = JSON.parse(saved) as Product[];
      return parsed.map((p) => {
        const initial = initialProducts.find((ip) => ip.id === p.id);
        if (initial) {
          return { ...p, hoverImage: initial.hoverImage, image: initial.image };
        }
        return p;
      });
    } catch {
      return initialProducts;
    }
  });

  const [banners, setBanners] = useState<Banner[]>(() => {
    const saved = localStorage.getItem('chovique_banners');
    return saved ? JSON.parse(saved) : initialBanners;
  });

  // ---------------------------------------------------------------------------
  // Order State — seeded from mockData; fetched from service after login
  // ---------------------------------------------------------------------------

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('chovique_orders');
    return saved ? JSON.parse(saved) : initialOrders;
  });

  const [offlineSales, setOfflineSales] = useState<OfflineSale[]>(() => {
    const saved = localStorage.getItem('chovique_offline_sales');
    return saved ? JSON.parse(saved) : initialOfflineSales;
  });

  // ---------------------------------------------------------------------------
  // Cart & Wishlist (intentionally client-side)
  // ---------------------------------------------------------------------------

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('chovique_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('chovique_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // ---------------------------------------------------------------------------
  // Support Tickets — seeded from demo data; fetched after login
  // ---------------------------------------------------------------------------

  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('chovique_demo_tickets');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'TKT-1082',
        customerId: 'u1',
        customerName: 'Demo Customer',
        category: 'Slow delivery' as SupportTicket['category'],
        description: 'My order ORD-9872 was delayed by 2 days for a special anniversary dinner.',
        status: 'Resolved' as const,
        adminNotes: 'Sincere apologies for the delay. A discount code CHOV40 has been applied for future orders.',
        customerResolutionFeedback: 'Resolved' as const,
        date: '2026-06-15',
        notified: true,
      },
    ];
  });

  // ---------------------------------------------------------------------------
  // Addresses — fetched from service after login
  // ---------------------------------------------------------------------------

  const [addresses, setAddresses] = useState<CustomerAddress[]>(() => {
    const saved = localStorage.getItem('chovique_demo_addresses');
    if (saved) return JSON.parse(saved);
    return [];
  });

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------

  const [notifications, setNotifications] = useState<SupportNotification[]>(() => {
    const saved = localStorage.getItem('chovique_notifications');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'notif-1',
        text: 'Your order ORD-5431 has been marked as Processing and is being curated.',
        date: new Date().toISOString().split('T')[0],
        read: false,
        type: 'order' as const,
        referenceId: 'ORD-5431',
      },
      {
        id: 'notif-2',
        text: 'Exclusive Offer: Use code CHOV40 for 40% off during the festive season!',
        date: new Date().toISOString().split('T')[0],
        read: false,
        type: 'general' as const,
      },
    ];
  });

  // ---------------------------------------------------------------------------
  // Fetch user-scoped data after auth resolves
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isAuthLoading || role === 'guest') return;

    // Fetch orders from service (replaces localStorage-seeded orders for logged-in users)
    orderService.getOrders().then((res) => setOrders(res)).catch(() => {});

    // Fetch tickets
    ticketService.getTickets().then((res) => setTickets(res)).catch(() => {});

    // Fetch addresses
    userService.getAddresses().then((res) => setAddresses(res)).catch(() => {});

    // Fetch notifications
    notificationService.getNotifications().then((res) => setNotifications(res)).catch(() => {});
  }, [isAuthLoading, role]);

  // ---------------------------------------------------------------------------
  // Side Effects — persist intentional client-side state to localStorage
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--chocolate-brown', theme.primary);
    root.style.setProperty('--dark-chocolate', theme.darkChocolate);
    root.style.setProperty('--gold', theme.gold);
    root.style.setProperty('--rose-gold', theme.roseGold);
    root.style.setProperty('--black', theme.black || '#0A0A0A');

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '26, 13, 0';
    };

    root.style.setProperty('--primary-rgb', hexToRgb(theme.primary));
    root.style.setProperty('--dark-chocolate-rgb', hexToRgb(theme.darkChocolate));

    localStorage.setItem('chovique_theme', JSON.stringify(theme));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('chovique_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('chovique_banners', JSON.stringify(banners));
  }, [banners]);

  useEffect(() => {
    localStorage.setItem('chovique_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('chovique_offline_sales', JSON.stringify(offlineSales));
  }, [offlineSales]);

  useEffect(() => {
    localStorage.setItem('chovique_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('chovique_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('chovique_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // ---------------------------------------------------------------------------
  // Cart Operations
  // ---------------------------------------------------------------------------

  const addToCart = (product: Product, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  // ---------------------------------------------------------------------------
  // Wishlist Operations
  // ---------------------------------------------------------------------------

  const toggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const moveToCart = (product: Product) => {
    toggleWishlist(product);
    addToCart(product, 1);
  };

  // ---------------------------------------------------------------------------
  // Order Operations
  // ---------------------------------------------------------------------------

  const placeOrderLocal = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
    clearCart();
    addNotification(
      `Your order ${order.id} has been placed successfully for ₹${order.total}.`,
      'order',
      order.id
    );
  };

  // ---------------------------------------------------------------------------
  // Admin Product Operations
  // ---------------------------------------------------------------------------

  const addProduct = (newProd: Omit<Product, 'id' | 'rating' | 'ratingsCount' | 'reviews'>) => {
    const product: Product = {
      ...newProd,
      id: `p${products.length + 1}`,
      rating: 5.0,
      ratingsCount: 1,
      reviews: [],
    };
    setProducts((prev) => [product, ...prev]);
  };

  const updateProductInventory = (productId: string, weight: string, price: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, weight, price } : p))
    );
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // ---------------------------------------------------------------------------
  // Admin Offline Sales Operations
  // ---------------------------------------------------------------------------

  const addOfflineSale = (sale: Omit<OfflineSale, 'id' | 'date'>) => {
    const newSale: OfflineSale = {
      ...sale,
      id: `OFL-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().split('T')[0],
    };
    setOfflineSales((prev) => [newSale, ...prev]);
  };

  const importOfflineSales = (salesList: Omit<OfflineSale, 'id' | 'date'>[]) => {
    const dateStr = new Date().toISOString().split('T')[0];
    const newSales: OfflineSale[] = salesList.map((s, idx) => ({
      ...s,
      id: `OFL-IMP-${Math.floor(100 + Math.random() * 900)}-${idx}`,
      date: dateStr,
    }));
    setOfflineSales((prev) => [...newSales, ...prev]);
  };

  // ---------------------------------------------------------------------------
  // Banner Operations
  // ---------------------------------------------------------------------------

  const updateBanner = (id: string, bannerData: Partial<Banner>) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...bannerData } : b))
    );
  };

  // ---------------------------------------------------------------------------
  // Theme Operations
  // ---------------------------------------------------------------------------

  const updateThemeColors = (colors: {
    primary?: string;
    darkChocolate?: string;
    gold?: string;
    roseGold?: string;
    black?: string;
  }) => {
    setTheme((prev: typeof defaultTheme) => ({ ...prev, ...colors }));
  };

  // ---------------------------------------------------------------------------
  // Support Tickets — wired to ticketService (with demo fallback)
  // ---------------------------------------------------------------------------

  const addSupportTicket = async (category: SupportTicket['category'], description: string): Promise<void> => {
    try {
      const newTicket = await ticketService.createTicket({ category, description });
      setTickets((prev) => [newTicket, ...prev]);
    } catch (err) {
      console.error('Failed to create support ticket:', err);
      throw err;
    }
  };

  const resolveSupportTicket = async (ticketId: string, adminNotes?: string): Promise<void> => {
    try {
      const updated = await import('../services/adminService').then((m) =>
        m.adminService.resolveTicket(ticketId, { admin_notes: adminNotes })
      );
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      addNotification(
        `Support Complaint ${ticketId} has been resolved by Admin.`,
        'support',
        ticketId
      );
    } catch (err) {
      console.error('Failed to resolve ticket:', err);
      throw err;
    }
  };

  const submitTicketFeedback = async (ticketId: string, feedback: 'Resolved' | 'Not Resolved'): Promise<void> => {
    try {
      const updated = await ticketService.submitFeedback(ticketId, { feedback });
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
    } catch (err) {
      console.error('Failed to submit ticket feedback:', err);
      throw err;
    }
  };

  const acknowledgeTicketNotification = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, notified: true } : t))
    );
  };

  // ---------------------------------------------------------------------------
  // Profile & Address Operations — wired to userService (with demo fallback)
  // ---------------------------------------------------------------------------

  const updateUserProfilePicture = (avatarUrl: string) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, profile: { ...prev.profile, avatarUrl } };
    });
  };

  const updateUserProfile = (updatedProfile: {
    name?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    preferences?: string;
  }) => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        name: updatedProfile.name !== undefined ? updatedProfile.name : prev.name,
        profile: { ...prev.profile, ...updatedProfile },
      };
    });
  };

  const addAddress = async (newAddr: Omit<CustomerAddress, 'id'>): Promise<void> => {
    try {
      const created = await userService.addAddress(newAddr);
      setAddresses((prev) => {
        if (created.isDefault) {
          return prev.map((a) => ({ ...a, isDefault: false })).concat(created);
        }
        return [...prev, created];
      });
    } catch (err) {
      console.error('Failed to add address:', err);
      throw err;
    }
  };

  const deleteAddress = async (id: string): Promise<void> => {
    try {
      await userService.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to delete address:', err);
      throw err;
    }
  };

  const setDefaultAddress = async (id: string): Promise<void> => {
    try {
      await userService.setDefaultAddress(id);
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    } catch (err) {
      console.error('Failed to set default address:', err);
      throw err;
    }
  };

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------

  const addNotification = (
    text: string,
    type: SupportNotification['type'],
    referenceId?: string
  ) => {
    const notif: SupportNotification = {
      id: `notif-${Date.now()}`,
      text,
      date: new Date().toISOString().split('T')[0],
      read: false,
      type,
      referenceId,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    // Best-effort server delete (no await — fire and forget)
    notificationService.deleteNotification(id).catch(() => {});
  };

  // ---------------------------------------------------------------------------
  // Context Value
  // ---------------------------------------------------------------------------

  return (
    <AppContext.Provider
      value={{
        user,
        role,
        isAuthLoading,
        login,
        register,
        verifyOtp,
        logout,
        products,
        banners,
        orders,
        offlineSales,
        wishlist,
        cart,
        theme,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        moveToCart,
        placeOrderLocal,
        addProduct,
        updateProductInventory,
        deleteProduct,
        addOfflineSale,
        importOfflineSales,
        updateBanner,
        updateThemeColors,
        tickets,
        addSupportTicket,
        resolveSupportTicket,
        submitTicketFeedback,
        acknowledgeTicketNotification,
        updateUserProfilePicture,
        updateUserProfile,
        addresses,
        addAddress,
        deleteAddress,
        setDefaultAddress,
        notifications,
        removeNotification,
        addNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
