/**
 * Order Service — place and retrieve orders.
 * Falls back to demo localStorage store when backend is unreachable.
 *
 * FastAPI endpoints expected:
 *   POST /orders       → Order
 *   GET  /orders       → Order[]
 *   GET  /orders/{id}  → Order
 */

import { apiGet, apiPost } from '../lib/api';
import { withDemoFallback } from '../lib/demoMode';
import {
  demoPlaceOrder,
  demoGetOrders,
  demoGetProduct,
} from '../lib/demoStore';
import type { Order, OrderPayload } from '../types';

export const orderService = {
  /**
   * Place a new order.
   * Backend is responsible for: generating order ID, calculating totals,
   * setting status to 'Processing', clearing the server-side cart.
   * Demo fallback: persists order to localStorage.
   */
  placeOrder: (payload: OrderPayload): Promise<Order> =>
    withDemoFallback(
      () => apiPost<Order>('/orders', payload),
      () => demoPlaceOrder(payload)
    ),

  /** Fetch all orders for the authenticated user */
  getOrders: (): Promise<Order[]> =>
    withDemoFallback(
      () => apiGet<Order[]>('/orders'),
      () => demoGetOrders()
    ),

  /** Fetch a single order by ID */
  getOrder: (id: string): Promise<Order> =>
    withDemoFallback(
      () => apiGet<Order>(`/orders/${id}`),
      // Reuse product fetch pattern — orders filtered from demo store
      async () => {
        const orders = await demoGetOrders();
        const order = orders.find((o) => o.id === id);
        if (!order) throw { status: 404, message: 'Order not found.' };
        return order;
      }
    ),
};
