/**
 * Demo Store — localStorage-backed implementations for all service calls.
 *
 * Used automatically when:
 *   1. VITE_DEMO_MODE=true in .env
 *   2. Backend is unreachable (network error on fetch)
 *
 * All data is persisted to localStorage under 'chovique_demo_*' keys
 * so it survives page refreshes during development.
 */

import type {
  Order,
  OrderPayload,
  Product,
  PaginatedResponse,
  ProductQueryParams,
  SupportTicket,
  CreateTicketPayload,
  TicketFeedbackPayload,
  CustomerAddress,
  SupportNotification,
  OfflineSale,
} from '../types';
import { initialProducts, initialOrders, initialOfflineSales } from '../data/mockData';

// ─── Storage Keys ────────────────────────────────────────────────────────────

const KEY_ORDERS = 'chovique_demo_orders';
const KEY_TICKETS = 'chovique_demo_tickets';
const KEY_ADDRESSES = 'chovique_demo_addresses';
const KEY_NOTIFICATIONS = 'chovique_demo_notifications';
const KEY_OFFLINE_SALES = 'chovique_demo_offline_sales';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const load = <T>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
};

const save = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

const generateId = (prefix: string): string =>
  `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

/** Simulate async latency of 200-400ms like a real server */
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

// ─── Products ─────────────────────────────────────────────────────────────────

/** Client-side filter + sort + paginate on mock product array */
export const demoGetProducts = async (
  params: ProductQueryParams = {}
): Promise<PaginatedResponse<Product>> => {
  await delay();
  let items = [...initialProducts];

  if (params.search) {
    const q = params.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }

  if (params.category && params.category !== 'all') {
    items = items.filter((p) => p.category === params.category);
  }

  if (params.price_min !== undefined) {
    items = items.filter((p) => p.price >= params.price_min!);
  }

  if (params.price_max !== undefined) {
    items = items.filter((p) => p.price <= params.price_max!);
  }

  if (params.min_rating !== undefined) {
    items = items.filter((p) => p.rating >= params.min_rating!);
  }

  if (params.sort) {
    switch (params.sort) {
      case 'price-low':
        items.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        items.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        items.sort((a, b) => b.rating - a.rating);
        break;
      case 'bestseller':
        items = items.filter((p) => p.badge === 'Bestseller').concat(items.filter((p) => p.badge !== 'Bestseller'));
        break;
      case 'new':
        items = items.filter((p) => p.badge === 'New').concat(items.filter((p) => p.badge !== 'New'));
        break;
    }
  }

  const total = items.length;
  const perPage = params.per_page ?? 6;
  const page = params.page ?? 1;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const pageItems = items.slice(start, start + perPage);

  return { items: pageItems, total, page, per_page: perPage, total_pages: totalPages };
};

export const demoGetProduct = async (id: string): Promise<Product> => {
  await delay();
  const p = initialProducts.find((p) => p.id === id);
  if (!p) throw { status: 404, message: 'Product not found.' };
  return p;
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const demoGetOrders = async (): Promise<Order[]> => {
  await delay();
  return load<Order[]>(KEY_ORDERS, initialOrders);
};

export const demoPlaceOrder = async (payload: OrderPayload): Promise<Order> => {
  await delay(400);
  const orders = load<Order[]>(KEY_ORDERS, initialOrders);

  const subtotal = payload.items.reduce((sum: number, item: { product_id: string; quantity: number }) => {
    const prod = initialProducts.find((p) => p.id === item.product_id);
    return sum + (prod ? prod.price * item.quantity : 0);
  }, 0);

  const shippingFee =
    payload.delivery_option === 'Same Day Delivery'
      ? 250
      : payload.delivery_option === 'Express Delivery'
      ? 150
      : 0;

  const newOrder: Order = {
    id: `ORD-${Date.now()}`,
    items: payload.items.map((item: { product_id: string; quantity: number }) => {
      const prod = initialProducts.find((p) => p.id === item.product_id);
      return { product: prod!, quantity: item.quantity };
    }),
    subtotal,
    shipping: shippingFee,
    discount: 0,
    total: subtotal + shippingFee,
    status: 'Processing',
    date: new Date().toISOString().split('T')[0],
    shippingAddress: payload.shipping_address,
    paymentMethod: payload.payment_method,
    deliveryOption: payload.delivery_option,
  };

  save(KEY_ORDERS, [newOrder, ...orders]);
  return newOrder;
};

// ─── Tickets ──────────────────────────────────────────────────────────────────

export const demoGetTickets = async (): Promise<SupportTicket[]> => {
  await delay();
  return load<SupportTicket[]>(KEY_TICKETS, []);
};

export const demoCreateTicket = async (
  payload: CreateTicketPayload
): Promise<SupportTicket> => {
  await delay(300);
  const tickets = load<SupportTicket[]>(KEY_TICKETS, []);
  const ticket: SupportTicket = {
    id: generateId('TKT'),
    customerId: 'demo',
    customerName: 'Demo User',
    category: payload.category,
    description: payload.description,
    status: 'Pending',
    date: new Date().toISOString().split('T')[0],
    notified: false,
  };
  save(KEY_TICKETS, [ticket, ...tickets]);
  return ticket;
};

export const demoSubmitFeedback = async (
  ticketId: string,
  payload: TicketFeedbackPayload
): Promise<SupportTicket> => {
  await delay();
  const tickets = load<SupportTicket[]>(KEY_TICKETS, []);
  const updated = tickets.map((t) =>
    t.id === ticketId ? { ...t, feedback: payload.feedback } : t
  );
  save(KEY_TICKETS, updated);
  const found = updated.find((t) => t.id === ticketId);
  if (!found) throw new Error('Ticket not found');
  return found;
};

// ─── Addresses ───────────────────────────────────────────────────────────────

export const demoGetAddresses = async (): Promise<CustomerAddress[]> => {
  await delay();
  return load<CustomerAddress[]>(KEY_ADDRESSES, []);
};

export const demoAddAddress = async (
  payload: Omit<CustomerAddress, 'id'>
): Promise<CustomerAddress> => {
  await delay();
  const addresses = load<CustomerAddress[]>(KEY_ADDRESSES, []);
  const newAddr: CustomerAddress = { ...payload, id: generateId('ADDR') };
  // If new address is default, clear others
  const updated = newAddr.isDefault
    ? addresses.map((a) => ({ ...a, isDefault: false })).concat(newAddr)
    : [...addresses, newAddr];
  save(KEY_ADDRESSES, updated);
  return newAddr;
};

export const demoDeleteAddress = async (id: string): Promise<void> => {
  await delay();
  const addresses = load<CustomerAddress[]>(KEY_ADDRESSES, []);
  save(KEY_ADDRESSES, addresses.filter((a) => a.id !== id));
};

export const demoSetDefaultAddress = async (id: string): Promise<CustomerAddress> => {
  await delay();
  const addresses = load<CustomerAddress[]>(KEY_ADDRESSES, []);
  const updated = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
  save(KEY_ADDRESSES, updated);
  const found = updated.find((a) => a.id === id);
  if (!found) throw new Error('Address not found');
  return found;
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const demoGetNotifications = async (): Promise<SupportNotification[]> => {
  await delay();
  return load<SupportNotification[]>(KEY_NOTIFICATIONS, []);
};

export const demoDeleteNotification = async (id: string): Promise<void> => {
  await delay();
  const notifs = load<SupportNotification[]>(KEY_NOTIFICATIONS, []);
  save(KEY_NOTIFICATIONS, notifs.filter((n) => n.id !== id));
};

// ─── Offline Sales ────────────────────────────────────────────────────────────

export const demoGetOfflineSales = async (): Promise<OfflineSale[]> => {
  await delay();
  return load<OfflineSale[]>(KEY_OFFLINE_SALES, initialOfflineSales);
};

export const demoAddOfflineSale = async (payload: {
  product_name: string;
  quantity: number;
  total_price: number;
  payment_method: string;
}): Promise<OfflineSale> => {
  await delay();
  const sales = load<OfflineSale[]>(KEY_OFFLINE_SALES, initialOfflineSales);
  const sale: OfflineSale = {
    id: generateId('OFL'),
    productName: payload.product_name,
    quantity: payload.quantity,
    totalPrice: payload.total_price,
    paymentMethod: payload.payment_method,
    date: new Date().toISOString().split('T')[0],
  };
  save(KEY_OFFLINE_SALES, [sale, ...sales]);
  return sale;
};

export const demoImportOfflineSales = async (_formData: FormData): Promise<{ imported: number; skipped: number; message: string }> => {
  await delay(600);
  // In demo mode, we can't parse a real CSV — just return success
  return { imported: 0, skipped: 0, message: 'Demo mode: CSV parsing not supported.' };
};
