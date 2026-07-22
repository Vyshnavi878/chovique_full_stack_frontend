// =============================================================================
// CORE DOMAIN TYPES
// =============================================================================

export type UserRole = 'guest' | 'customer' | 'admin' | 'superadmin';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  /** Initials used as avatar fallback when no avatarUrl is set */
  avatar: string;
  /** URL returned by the backend after avatar upload (replaces base64 storage) */
  avatarUrl?: string;
  dob?: string;
  gender?: string;
  preferences?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profile: UserProfile;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  avatar?: string;
}

export interface NutritionInfo {
  calories: string;
  totalFat: string;
  saturatedFat: string;
  cholesterol: string;
  sodium: string;
  totalCarb: string;
  protein: string;
}

export interface Product {
  id: string;
  name: string;
  category: 'dark' | 'milk' | 'white' | 'gift' | 'beverage';
  price: number;
  originalPrice?: number;
  weight: string;
  description: string;
  ingredients: string;
  nutrition: NutritionInfo;
  rating: number;
  ratingsCount: number;
  badge?: 'Bestseller' | 'New' | 'Premium' | 'Limited';
  image: string;
  hoverImage?: string;
  reviews: Review[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  date: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
  };
  deliveryOption: string;
  paymentMethod: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  image: string;
  videoLink?: string;
  buttonText: string;
  link: string;
}

export interface OfflineSale {
  id: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  date: string;
  paymentMethod: string;
}

export interface SupportTicket {
  id: string;
  customerId: string;
  customerName: string;
  category:
    | 'Chocolate melted'
    | 'Slow delivery'
    | 'Return order was not accepting'
    | 'Refund amount are not debited in mentioned days'
    | 'Other';
  description: string;
  status: 'Pending' | 'Resolved';
  adminNotes?: string;
  customerResolutionFeedback?: 'Resolved' | 'Not Resolved';
  date: string;
  notified: boolean;
}

export interface CustomerAddress {
  id: string;
  title: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  isDefault: boolean;
}

export interface SupportNotification {
  id: string;
  text: string;
  date: string;
  read: boolean;
  type: 'order' | 'support' | 'general';
  referenceId?: string;
}

export interface UserCoupon {
  code: string;
  desc: string;
  exp: string;
  discountPercent?: number;
}

// =============================================================================
// ADMIN TYPES
// =============================================================================

/** System user record returned from /admin/users */
export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'superadmin';
  permissions: {
    manageInventory: boolean;
    viewAnalytics: boolean;
    manageUsers: boolean;
    configureThemes: boolean;
    exportData: boolean;
  };
}

// =============================================================================
// API REQUEST PAYLOAD TYPES
// =============================================================================

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface SendOtpPayload {
  name: string;
  email: string;
  password: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface SendOtpResponse {
  message: string;
  email: string;
  expires_in: number;
}

export interface OrderPayload {
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  shipping_address: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
  };
  delivery_option: string;
  payment_method: string;
  /** Optional coupon code to apply at order time */
  coupon_code?: string;
}

export interface ProductUpdatePayload {
  price?: number;
  weight?: string;
  stock?: number;
  badge?: Product['badge'];
}

export interface ProfileUpdatePayload {
  name?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  preferences?: string;
}

export interface CreateTicketPayload {
  category: SupportTicket['category'];
  description: string;
}

export interface TicketFeedbackPayload {
  feedback: 'Resolved' | 'Not Resolved';
}

export interface ResolveTicketPayload {
  admin_notes?: string;
}

export interface OfflineSalePayload {
  product_name: string;
  quantity: number;
  total_price: number;
  payment_method: string;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/** JWT auth response from /auth/login and /auth/register */
export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  user: User;
}

export interface GoogleAuthResponse {
  require_otp: boolean;
  access_token?: string;
  token_type?: 'bearer';
  user?: User;
  email?: string;
  message?: string;
  expires_in?: number;
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/** Coupon validation response from /coupons/validate */
export interface CouponValidationResponse {
  valid: boolean;
  code: string;
  /** Percentage discount, e.g. 40 for 40% off */
  discount_percent: number;
  /** Flat amount discount (₹), if applicable */
  discount_amount?: number;
  message: string;
}

/** Avatar upload response */
export interface AvatarUploadResponse {
  avatar_url: string;
}

/** CSV import response */
export interface ImportSalesResponse {
  imported: number;
  skipped: number;
  message: string;
}

// =============================================================================
// QUERY PARAM TYPES (used by ShopPage → productService.getProducts)
// =============================================================================

/** Mirrors the ShopPage filter/sort/pagination state for clean API mapping */
export interface ProductQueryParams {
  search?: string;
  category?: string;
  price_min?: number;
  price_max?: number;
  min_rating?: number;
  sort?: string;
  page?: number;
  per_page?: number;
}
