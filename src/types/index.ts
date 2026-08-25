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
  has_password?: boolean;
}

export interface Review {
  id: string;
  product_id?: string;
  user_id?: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  avatar?: string;
  status?: string;
}

export interface ProductRatingSummary {
  average_rating: number;
  total_reviews: number;
  star_breakdown: { [key: number]: number };
}

export interface NutritionInfo {
  servingSize?: string;
  calories?: string;
  totalFat?: string;
  saturatedFat?: string;
  transFat?: string;
  cholesterol?: string;
  sodium?: string;
  totalCarb?: string;
  dietaryFiber?: string;
  totalSugars?: string;
  addedSugars?: string;
  protein?: string;
  [key: string]: string | undefined;
}

export interface Product {
  id: string;
  sku?: string;
  name: string;
  category_id?: string;
  category: string;
  price: number;
  originalPrice?: number;
  weight: string;
  description: string;
  ingredients: string;
  rating: number;
  ratingsCount: number;
  badge?: 'Bestseller' | 'New' | 'Premium' | 'Limited' | 'Gift Hamper' | 'Signature' | string;

  image: string;
  hoverImage?: string;
  images?: string[];
  reviews: Review[];
  stock?: number;
  is_available?: boolean;
  isAvailable?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  nutrition?: NutritionInfo;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned';

export type PaymentStatus =
  | 'Pending'
  | 'Processing'
  | 'Paid'
  | 'Failed'
  | 'Cancelled'
  | 'Refund Pending'
  | 'Refunded'
  | 'Partially Refunded';

export interface Order {
  id: string;
  user_id?: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  discount: number;
  coupon_code?: string;
  coupon_discount?: number;
  coins_used?: number;
  coin_discount?: number;
  coins_earned?: number;
  shipping: number;
  tax: number;
  status: OrderStatus | string;
  payment_status?: PaymentStatus | string;
  date: string;
  created_at?: string;
  shippingAddress: CustomerAddress;
  deliveryOption: string;
  paymentMethod: string;
  customerName?: string;
  customerEmail?: string;
  invoice_url?: string;
  is_cancellable?: boolean;
  is_returnable?: boolean;
  delivered_at?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
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
  receipt_id?: string;
  company_name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  payment_method?: string;
  subtotal?: number;
  discount?: number;
  tax?: number;
  total_amount?: number;
  status?: string;
  payment_status?: string;
  received_amount?: number;
  receipt_number?: string;
  card_type?: string;
  card_last4?: string;
  transaction_id?: string;
  upi_id?: string;
  bank_name?: string;
  account_holder?: string;
  items?: Array<{
    id: string;
    product_id?: string;
    product_name: string;
    sku?: string;
    unit_price: number;
    quantity: number;
    line_total: number;
  }>;
  /** camelCase — matches backend OfflineSaleResponse */
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
  status: 'Pending' | 'Under Review' | 'In Progress' | 'Awaiting Customer Response' | 'Investigating' | 'Resolved' | 'Closed' | string;
  orderId?: string;
  order_id?: string;
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
  title?: string;
  message?: string;
  text: string;
  date: string;
  read: boolean;
  is_read?: boolean;
  type: 'order' | 'support' | 'reward' | 'coupon' | 'general' | string;
  referenceId?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at?: string;
}

export interface UserCoupon {
  id?: string;
  code: string;
  name?: string;
  description?: string;
  desc?: string;
  coupon_type?: string;
  discount_type?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | string;
  discount_percent?: number;
  discount_amount?: number;
  discountPercent?: number;
  maximum_discount_amount?: number;
  minimum_order_amount?: number;
  start_at?: string;
  expires_at?: string;
  startDate?: string;
  expiryDate?: string;
  start_date?: string;
  expiry_date?: string;
  expiresAt?: string;
  startAt?: string;
  startsAt?: string;
  end_date?: string;
  endDate?: string;
  begin_date?: string;
  beginDate?: string;
  valid_until?: string;
  validUntil?: string;
  valid_from?: string;
  validFrom?: string;
  exp?: string;
  is_active?: boolean;
  status?: string;
}

// =============================================================================
// HOME PAGE TYPES
// =============================================================================

export interface Testimonial {
  id?: string;
  user_id?: string;
  author: string;
  title?: string;
  text: string;
  stars?: number;
  rating?: number;
  initials?: string;
  avatar_url?: string;
  status?: 'pending' | 'approved' | 'rejected';
  is_active?: boolean;
  created_at?: string;
}

export interface HomeStats {
  happy_customers: number;
  products_available: number;
  orders_delivered: number;
  customer_rating_percent: number;
  unique_flavors?: number;
  countries_shipped?: number;
  five_star_reviews_percent?: number;
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
}

export interface InstagramReel {
  id: string;
  video_url: string;
  likes?: number;
  comments?: number;
  views?: number;
  title?: string;
  is_active?: boolean;
}

export interface HomePageData {
  banners: Banner[];
  featured_products: Product[];
  bestsellers: Product[];
  new_arrivals: Product[];
  testimonials: Testimonial[];
  stats: HomeStats;
  contact: ContactInfo;
}

export interface StoreConfig {
  standard_shipping_charge: number;
  free_shipping_min_order: number;
  gst_rate: number;
  cod_enabled: boolean;
  minimum_order_value: number;
  maximum_cod_order_value: number;
  base_currency: string;
  store_front_name: string;
}


// =============================================================================
// CATEGORY TYPES
// =============================================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  image_url?: string;
  is_active: boolean;
  sort_order?: number;
}

// =============================================================================
// CHECKOUT / PAYMENT TYPES
// =============================================================================

/** Response from POST /checkout/initiate */
export interface CheckoutInitiateResponse {
  razorpay_order_id: string;
  amount: number;         // in paise (INR * 100)
  currency: string;       // 'INR'
  order_id: string;       // Chovique internal order ID
  key_id: string;         // Razorpay key to use on frontend
}

/** Payload for POST /payments/verify */
export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  order_id: string;       // Chovique internal order ID
}

// =============================================================================
// ADMIN TYPES
// =============================================================================

/** System user record returned from /admin/users */
export interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_active?: boolean;
  role: 'customer' | 'admin' | 'superadmin';
  /** Permissions object — derived from role on the backend */
  permissions: {
    viewAnalytics: boolean;
    manageUsers: boolean;
    configureThemes: boolean;
    exportData: boolean;
  };
}

// =============================================================================
// FORGOT / RESET PASSWORD PAYLOADS
// =============================================================================

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  password: string;
  confirmPassword: string;
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
  confirmPassword: string;
}

export interface SendOtpPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  fullName: string;
  password: string;
}

export interface SendOtpResponse {
  message: string;
  email: string;
  expires_in: number;
}

export interface OrderPayload {
  items?: Array<{
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
  coupon_code?: string;
  coins_to_use?: number;
}

export interface ProductUpdatePayload {
  name?: string;
  category_id?: string;
  category?: Product['category'];
  price?: number;
  weight?: string;
  stock?: number;
  badge?: Product['badge'];
  description?: string;
  ingredients?: string;
  nutrition?: NutritionInfo;
  is_available?: boolean;
  isAvailable?: boolean;
}

export interface ProfileUpdatePayload {
  name?: string;
  full_name?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  preferences?: string;
}

export interface CreateTicketPayload {
  category: SupportTicket['category'];
  description: string;
  order_id?: string;
  orderId?: string;
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

/** Auth response from /auth/login, /auth/verify-otp, /auth/google, /auth/set-password.
 *  The backend delivers the JWTs as httpOnly cookies (not readable from JS) —
 *  the JSON body only carries the message and user profile. */
export interface AuthResponse {
  message: string;
  user: User;
  access_token?: string;
  refresh_token?: string;
}

export interface GoogleAuthResponse {
  message: string;
  user: User;
  access_token?: string;
  refresh_token?: string;
  require_otp?: boolean;
  email?: string;
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
  discount_type?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | string;
  /** Percentage discount, e.g. 40 for 40% off */
  discount_percent?: number;
  /** Flat amount discount (₹), if applicable */
  discount_amount?: number;
  maximum_discount_amount?: number;
  calculated_discount?: number;
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

/** Customer details response for admin inspection */
export interface CustomerDetailsResponse {
  user: User;
  total_spent: number;
  total_orders: number;
  recent_orders: Order[];
  support_tickets: SupportTicket[];
}

/** Contact form submission response */
export interface ContactMessageResponse {
  message: string;
}

// =============================================================================
// QUERY PARAM TYPES (used by ShopPage → productService.getProducts)
// =============================================================================

/** Mirrors the ShopPage filter/sort/pagination state for clean API mapping */
export interface ProductQueryParams {
  search?: string;
  category?: string;
  availability?: string;
  price_min?: number;
  price_max?: number;
  min_rating?: number;
  sort?: string;
  page?: number;
  per_page?: number;
}
