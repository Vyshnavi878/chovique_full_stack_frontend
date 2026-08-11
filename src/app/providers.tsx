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
import { authService } from '../services/authService';
import { cartService, BackendCartItem } from '../services/cartService';
import { wishlistService } from '../services/wishlistService';
import { homeService } from '../services/homeService';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { ticketService } from '../services/ticketService';
import { userService } from '../services/userService';
import { notificationService } from '../services/notificationService';
import { walletService, UserWallet } from '../services/walletService';
import { ApiError } from '../lib/api';

// =============================================================================
// CONTEXT INTERFACE
// =============================================================================

interface AppContextType {
  // Auth
  user: User | null;
  role: UserRole;
  isAuthLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  googleLogin: (idToken: string) => Promise<{ success: boolean; error?: string; role?: UserRole; user?: User }>;
  setPassword: (password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (email: string, otp: string, fullName: string, password: string) => Promise<{ success: boolean; error?: string; status?: number }>;
  logout: () => Promise<void>;

  // Products
  products: Product[];
  banners: Banner[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  refreshBanners?: () => Promise<void>;
  addBanner?: (banner: Banner) => void;
  deleteBannerState?: (id: string) => void;

  // Orders
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  offlineSales: OfflineSale[];
  setOfflineSales: React.Dispatch<React.SetStateAction<OfflineSale[]>>;

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
  addToCart: (product: Product, quantity: number) => Promise<void>;
  updateCartQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;

  // Wishlist
  wishlist: Product[];
  toggleWishlist: (product: Product) => Promise<void>;
  moveToCart: (product: Product) => Promise<void>;

  // Orders
  placeOrderLocal: (order: Order) => void;

  // Admin product operations
  addProduct: (product: any) => void;
  updateProductInventory: (productId: string, weight: string, price: number, stock?: number) => void;
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
  }) => Promise<void>;

  // Addresses
  addresses: CustomerAddress[];
  addAddress: (address: Omit<CustomerAddress, 'id'>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;

  // Wallet & Rewards
  wallet: UserWallet | null;
  refreshWallet: () => Promise<void>;

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
  const cartOpIdRef = React.useRef(0);
  const wishlistOpIdRef = React.useRef(0);

  // ---------------------------------------------------------------------------
  // Auth State
  // ---------------------------------------------------------------------------

  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('guest');

  /**
   * On mount: attempt to rehydrate the session from httpOnly cookies.
   * GET /users/me succeeds if the access cookie is valid.
   * On 401, user stays as guest — the handleUnauthorized in api.ts will NOT
   * redirect on /login pages, so this is safe to call unconditionally.
   */
  useEffect(() => {
    const rehydrate = async () => {
      try {
        const freshUser = await authService.getMe();
        setUser(freshUser);
        setRole(freshUser.role as UserRole);
      } catch {
        // 401 = no valid session — guest mode
        setUser(null);
        setRole('guest');
      } finally {
        setIsAuthLoading(false);
      }
    };

    rehydrate();
  }, []);

  // ---------------------------------------------------------------------------
  // Theme State & Persistence (Backend PostgreSQL as Source of Truth)
  // ---------------------------------------------------------------------------

  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('chovique_theme');
      return saved ? JSON.parse(saved) : defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  useEffect(() => {
    homeService.getTheme()
      .then((data) => {
        if (data && typeof data === 'object' && Object.keys(data).length > 0 && data.primary) {
          setTheme((prev: any) => {
            const merged = { ...prev, ...data };
            try {
              localStorage.setItem('chovique_theme', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      })
      .catch((err) => console.error('Failed to load active theme from backend', err));
  }, []);

  // ---------------------------------------------------------------------------
  // Product State — fetched by individual pages via productService.
  // Kept in context so admin dashboard and landing page can share state.
  // ---------------------------------------------------------------------------

  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    productService.getProducts({ per_page: 50 })
      .then((result) => setProducts(result.items))
      .catch(() => {
        // Keep empty products — home page sections will render nothing until available
      });
  }, []);

  // ---------------------------------------------------------------------------
  // Banner State — fetched from backend on mount
  // ---------------------------------------------------------------------------

  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    homeService.getBanners()
      .then((result) => setBanners(result))
      .catch(() => {
        // Keep empty banners — Hero will render nothing until available
      });
  }, []);

  // ---------------------------------------------------------------------------
  // Order State — fetched from service after login
  // ---------------------------------------------------------------------------

  const [orders, setOrders] = useState<Order[]>([]);
  const [offlineSales, setOfflineSales] = useState<OfflineSale[]>([]);

  // ---------------------------------------------------------------------------
  // Cart State — backend-persistent
  // ---------------------------------------------------------------------------

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('chovique_guest_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep localStorage in sync for guests
  useEffect(() => {
    if (role === 'guest' && cart.length > 0) {
      localStorage.setItem('chovique_guest_cart', JSON.stringify(cart));
    }
  }, [cart, role]);

  /**
   * Sync cart from backend response into local CartItem[] format.
   * BackendCartItem has { product_id, quantity, product: {...} }
   */
  const syncCartFromBackend = useCallback((items: BackendCartItem[]) => {
    const cartItems: CartItem[] = items.map((item) => ({
      product: item.product as unknown as Product,
      quantity: item.quantity,
    }));
    setCart(cartItems);
  }, []);

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('chovique_guest_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep localStorage in sync for guest wishlist
  useEffect(() => {
    if (role === 'guest' && wishlist.length > 0) {
      localStorage.setItem('chovique_guest_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, role]);

  // ---------------------------------------------------------------------------
  // Support Tickets — fetched after login
  // ---------------------------------------------------------------------------

  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  // ---------------------------------------------------------------------------
  // Addresses — fetched from service after login
  // ---------------------------------------------------------------------------

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);

  // ---------------------------------------------------------------------------
  // Wallet & Rewards
  // ---------------------------------------------------------------------------

  const [wallet, setWallet] = useState<UserWallet | null>(null);

  const refreshWallet = useCallback(async () => {
    if (role === 'guest') return;
    try {
      const res = await walletService.getWallet();
      setWallet(res);
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
    }
  }, [role]);

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------

  const [notifications, setNotifications] = useState<SupportNotification[]>([]);

  // ---------------------------------------------------------------------------
  // Auth Handlers — connected to FastAPI backend via authService
  // ---------------------------------------------------------------------------

  const mergeGuestSession = async () => {
    // Merge guest cart
    try {
      const savedCart = localStorage.getItem('chovique_guest_cart');
      if (savedCart) {
        const guestCart = JSON.parse(savedCart);
        if (guestCart.length > 0) {
          const itemsToSync = guestCart.map((item: any) => ({
            product_id: item.product.id,
            quantity: item.quantity,
          }));
          await cartService.syncCart(itemsToSync);
        }
      }
    } catch (e) {
      console.error('Failed to merge guest cart', e);
    } finally {
      localStorage.removeItem('chovique_guest_cart');
    }

    // Merge guest wishlist
    try {
      const savedWish = localStorage.getItem('chovique_guest_wishlist');
      if (savedWish) {
        const guestWishlist: Product[] = JSON.parse(savedWish);
        if (guestWishlist.length > 0) {
          for (const item of guestWishlist) {
            try {
              await wishlistService.addToWishlist(item.id);
            } catch {}
          }
        }
      }
    } catch (e) {
      console.error('Failed to merge guest wishlist', e);
    } finally {
      localStorage.removeItem('chovique_guest_wishlist');
    }
  };

  const refreshUserCartAndWishlist = async () => {
    const cOpId = ++cartOpIdRef.current;
    try {
      const cartRes = await cartService.getCart();
      if (cOpId === cartOpIdRef.current) syncCartFromBackend(cartRes.items);
    } catch (e) {
      console.error('Failed to fetch cart on login', e);
    }
    const wOpId = ++wishlistOpIdRef.current;
    try {
      const wishRes = await wishlistService.getWishlist();
      if (wOpId === wishlistOpIdRef.current) setWishlist(wishRes.map((i) => i.product));
    } catch (e) {
      console.error('Failed to fetch wishlist on login', e);
    }
  };

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
      try {
        const response = await authService.login({ email, password });
        const loggedInUser = response.user as User;
        setUser(loggedInUser);
        setRole(loggedInUser.role);
        
        await mergeGuestSession();
        await refreshUserCartAndWishlist();

        return { success: true, role: loggedInUser.role };
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
        return { success: false, error: message };
      }
    },
    [syncCartFromBackend]
  );

  const register = useCallback(
    async (name: string, email: string, password: string, confirmPassword: string): Promise<{ success: boolean; error?: string }> => {
      try {
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
    async (email: string, otp: string, fullName: string, password: string): Promise<{ success: boolean; error?: string; status?: number }> => {
      try {
        const response = await authService.verifyOtp({ email, otp, fullName, password });
        const newUser = response.user as User;
        setUser(newUser);
        setRole(newUser.role);
        
        await mergeGuestSession();
        await refreshUserCartAndWishlist();

        return { success: true };
      } catch (err: unknown) {
        let message = 'OTP verification failed. Please try again.';
        let status = 0;
        if (err instanceof ApiError) {
          message = err.detail;
          status = err.status;
        } else if (err instanceof Error) {
          message = err.message;
        }
        return { success: false, error: message, status };
      }
    },
    [syncCartFromBackend]
  );

  const googleLogin = useCallback(
    async (idToken: string): Promise<{ success: boolean; error?: string; role?: UserRole; user?: User }> => {
      try {
        const response = await authService.googleSignIn(idToken);
        if (response.user) {
          const loggedInUser = response.user as User;
          setUser(loggedInUser);
          setRole(loggedInUser.role);
          
          await mergeGuestSession();
          await refreshUserCartAndWishlist();

          return { success: true, role: loggedInUser.role, user: loggedInUser };
        }
        return { success: false, error: response.message || 'Google Sign-In failed.' };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Google Sign-In failed.';
        return { success: false, error: message };
      }
    },
    [syncCartFromBackend]
  );

  const setPassword = useCallback(
    async (password: string, confirmPassword: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await authService.setPassword(password, confirmPassword);
        if (response.user) {
          setUser(response.user as User);
        }
        return { success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to set password.';
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
      localStorage.removeItem('chovique_guest_cart');
      localStorage.removeItem('chovique_guest_wishlist');
      sessionStorage.clear();
      setUser(null);
      setRole('guest');
      setCart([]);
      setWishlist([]);
      setOrders([]);
      setTickets([]);
      setAddresses([]);
      setNotifications([]);
      window.location.href = '/';
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch user-scoped data after auth resolves
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isAuthLoading || role === 'guest') return;

    // Fetch orders from backend
    orderService.getOrders().then((res) => setOrders(res)).catch(() => { });

    // Fetch tickets (admin sees all site-wide tickets, user sees personal tickets)
    if (['admin', 'superadmin'].includes(role)) {
      ticketService.getAllTickets().then((res) => setTickets(res)).catch(() => { });
    } else {
      ticketService.getTickets().then((res) => setTickets(res)).catch(() => { });
    }

    // Fetch addresses
    userService.getAddresses().then((res) => setAddresses(res)).catch(() => { });

    // Fetch notifications
    notificationService.getNotifications().then((res) => setNotifications(res)).catch(() => { });

    // Fetch cart
    const cOpId = ++cartOpIdRef.current;
    cartService.getCart().then((res) => {
      if (cOpId === cartOpIdRef.current) syncCartFromBackend(res.items);
    }).catch(() => { });

    // Fetch wishlist
    const wOpId = ++wishlistOpIdRef.current;
    wishlistService.getWishlist()
      .then((items) => {
        if (wOpId === wishlistOpIdRef.current) setWishlist(items.map((i) => i.product));
      })
      .catch(() => { });

    // Fetch wallet
    refreshWallet();

  }, [isAuthLoading, role, syncCartFromBackend, refreshWallet]);

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

  // ---------------------------------------------------------------------------
  // Cart Operations — backend-synced
  // ---------------------------------------------------------------------------

  const addToCart = useCallback(async (product: Product, quantity: number): Promise<void> => {
    // Optimistic update
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

    if (role === 'guest') return;

    const opId = ++cartOpIdRef.current;
    try {
      const res = await cartService.addToCart(product.id, quantity);
      if (opId === cartOpIdRef.current) syncCartFromBackend(res.items);
    } catch (err) {
      console.error('Failed to add to cart:', err);
      // Revert optimistic update on error
      if (opId === cartOpIdRef.current) {
        setCart((prev) => {
          const existing = prev.find((item) => item.product.id === product.id);
          if (!existing) return prev.filter((item) => item.product.id !== product.id);
          const newQty = existing.quantity - quantity;
          if (newQty <= 0) return prev.filter((item) => item.product.id !== product.id);
          return prev.map((item) =>
            item.product.id === product.id ? { ...item, quantity: newQty } : item
          );
        });
      }
    }
  }, [role, syncCartFromBackend]);

  const updateCartQuantity = useCallback(async (productId: string, quantity: number): Promise<void> => {
    // Optimistic update
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );

    if (role === 'guest') return;

    const opId = ++cartOpIdRef.current;
    try {
      const res = await cartService.updateQuantity(productId, Math.max(1, quantity));
      if (opId === cartOpIdRef.current) syncCartFromBackend(res.items);
    } catch (err) {
      console.error('Failed to update cart quantity:', err);
      // Need to refetch to correct state since we don't know the exact previous state here
      if (opId === cartOpIdRef.current) {
         cartService.getCart().then(res => {
           if (cartOpIdRef.current === opId) syncCartFromBackend(res.items);
         });
      }
    }
  }, [role, syncCartFromBackend]);

  const removeFromCart = useCallback(async (productId: string): Promise<void> => {
    // Optimistic update
    setCart((prev) => prev.filter((item) => item.product.id !== productId));

    if (role === 'guest') return;

    const opId = ++cartOpIdRef.current;
    try {
      const res = await cartService.removeFromCart(productId);
      if (opId === cartOpIdRef.current) syncCartFromBackend(res.items);
    } catch (err) {
      console.error('Failed to remove from cart:', err);
      // Need to refetch to correct state
      if (opId === cartOpIdRef.current) {
         cartService.getCart().then(res => {
           if (cartOpIdRef.current === opId) syncCartFromBackend(res.items);
         });
      }
    }
  }, [role, syncCartFromBackend]);

  const clearCart = useCallback(async (): Promise<void> => {
    setCart([]);
    
    if (role === 'guest') return;

    const opId = ++cartOpIdRef.current;
    try {
      await cartService.clearCart();
      if (opId === cartOpIdRef.current) setCart([]);
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  }, [role]);

  // ---------------------------------------------------------------------------
  // Wishlist Operations — backend-synced
  // ---------------------------------------------------------------------------

  const toggleWishlist = useCallback(async (product: Product): Promise<void> => {
    const exists = wishlist.find((p) => p.id === product.id);

    // Optimistic update
    if (exists) {
      setWishlist((prev) => prev.filter((p) => p.id !== product.id));
    } else {
      setWishlist((prev) => [...prev, product]);
    }

    if (role === 'guest') return;

    const opId = ++wishlistOpIdRef.current;
    try {
      if (exists) {
        await wishlistService.removeFromWishlist(product.id);
      } else {
        await wishlistService.addToWishlist(product.id);
      }
    } catch (err) {
      console.error('Failed to update wishlist:', err);
      // Revert optimistic update
      if (opId === wishlistOpIdRef.current) {
        if (exists) {
          setWishlist((prev) => [...prev, product]);
        } else {
          setWishlist((prev) => prev.filter((p) => p.id !== product.id));
        }
      }
    }
  }, [wishlist, role]);

  const moveToCart = useCallback(async (product: Product): Promise<void> => {
    await toggleWishlist(product);
    await addToCart(product, 1);
  }, [toggleWishlist, addToCart]);

  // ---------------------------------------------------------------------------
  // Order Operations
  // ---------------------------------------------------------------------------

  const placeOrderLocal = (order: Order) => {
    setOrders((prev) => [order, ...prev]);

    // Remove ordered products from local cart and wishlist state
    const orderedProductIds = new Set(order.items.map((item) => item.product.id));

    setCart((prevCart) => prevCart.filter((item) => !orderedProductIds.has(item.product.id)));
    setWishlist((prevWishlist) => prevWishlist.filter((prod) => !orderedProductIds.has(prod.id)));

    // Re-sync with backend to ensure DB parity
    cartService.getCart().then((res) => syncCartFromBackend(res.items)).catch(() => {});
    wishlistService.getWishlist().then((items) => setWishlist(items.map((i) => i.product))).catch(() => {});

    addNotification(
      `Your order ${order.id} has been placed successfully for ₹${order.total}.`,
      'order',
      order.id
    );
  };

  // ---------------------------------------------------------------------------
  // Admin Product Operations
  // These update local context state; the actual API calls are made in
  // AdminDashboard.tsx via productService directly.
  // ---------------------------------------------------------------------------

  const addProduct = (newProd: any) => {
    const product: Product = {
      rating: 5.0,
      ratingsCount: 0,
      reviews: [],
      ...newProd,
      id: (newProd && newProd.id) ? newProd.id : `p${Date.now()}`,
    };
    setProducts((prev) => [product, ...prev]);
  };

  const updateProductInventory = (productId: string, weight: string, price: number, stock?: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, weight, price, ...(stock !== undefined ? { stock } : {}) } : p))
    );
  };


  const deleteProduct = async (productId: string) => {
    try {
      await productService.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      console.error('Failed to delete product from database:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // Admin Offline Sales Operations
  // These update local context state; actual API calls are in AdminDashboard.tsx
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

  const refreshBanners = useCallback(async () => {
    try {
      const result = await homeService.getBanners();
      setBanners(result);
    } catch {
      // ignore
    }
  }, []);

  const addBanner = (newBanner: Banner) => {
    setBanners((prev) => [...prev, newBanner]);
  };

  const deleteBannerState = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  const updateBanner = (id: string, bannerData: Partial<Banner>) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...bannerData } : b))
    );
  };

  // ---------------------------------------------------------------------------
  // Theme Operations
  // ---------------------------------------------------------------------------

  const updateThemeColors = useCallback(async (colors: {
    primary?: string;
    darkChocolate?: string;
    gold?: string;
    roseGold?: string;
    black?: string;
  }) => {
    let updatedTheme = defaultTheme;
    setTheme((prev: typeof defaultTheme) => {
      updatedTheme = { ...prev, ...colors };
      try {
        localStorage.setItem('chovique_theme', JSON.stringify(updatedTheme));
      } catch {}
      return updatedTheme;
    });

    if (role === 'admin' || role === 'superadmin') {
      try {
        const { adminService } = await import('../services/adminService');
        await adminService.updateTheme(updatedTheme);
      } catch (err) {
        console.error('Failed to sync theme to backend database', err);
        throw err;
      }
    }
  }, [role]);

  // ---------------------------------------------------------------------------
  // Support Tickets — wired to ticketService
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
  // Profile & Address Operations — wired to userService
  // ---------------------------------------------------------------------------

  const updateUserProfilePicture = (avatarUrl: string) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, profile: { ...prev.profile, avatarUrl } };
    });
  };

  const updateUserProfile = async (updatedProfile: {
    name?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    preferences?: string;
  }): Promise<void> => {
    try {
      const freshUser = await userService.updateProfile({
        name: updatedProfile.name,
        full_name: updatedProfile.name,
        phone: updatedProfile.phone,
        dob: updatedProfile.dob,
        gender: updatedProfile.gender,
        preferences: updatedProfile.preferences,
      });
      setUser(freshUser);
    } catch (err) {
      console.error('Failed to update profile on server:', err);
      // Local fallback
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          name: updatedProfile.name !== undefined ? updatedProfile.name : prev.name,
          profile: { ...prev.profile, ...updatedProfile },
        };
      });
      throw err;
    }
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
    notificationService.deleteNotification(id).catch(() => { });
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
        googleLogin,
        setPassword,
        register,
        verifyOtp,
        logout,
        products,
        banners,
        setProducts,
        orders,
        setOrders,
        offlineSales,
        setOfflineSales,
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
        refreshBanners,
        addBanner,
        deleteBannerState,
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
        wallet,
        refreshWallet,
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