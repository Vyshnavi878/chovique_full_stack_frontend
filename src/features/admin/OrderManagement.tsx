import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  Loader2,
  FileText,
  Eye,
  RefreshCw,
  AlertTriangle,
  Package,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Truck,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Pagination } from '../../components/ui/Pagination';

// ─── Status Definitions ───────────────────────────────────────────────────────

const FULFILLMENT_STATUSES = [
  'ALL',
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Returned',
];

const PAYMENT_STATUSES = [
  'ALL',
  'Pending',
  'Processing',
  'Paid',
  'Failed',
  'Cancelled',
  'Refund Pending',
  'Refunded',
  'Partially Refunded',
];

// Valid forward-only transitions
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped: ['Out for Delivery', 'Delivered', 'Cancelled'],
  'Out for Delivery': ['Delivered', 'Cancelled'],
  Out_For_Delivery: ['Delivered', 'Cancelled'],
  Delivered: ['Returned'],
  Cancelled: [],
  Returned: [],
};

const STATUS_LABELS: Record<string, string> = {
  Out_For_Delivery: 'Out for Delivery',
};

const FULFILLMENT_COLORS: Record<string, { bg: string; color: string }> = {
  Pending: { bg: 'rgba(243,156,18,0.15)', color: '#f39c12' },
  Confirmed: { bg: 'rgba(52,152,219,0.15)', color: '#3498db' },
  Processing: { bg: 'rgba(201,168,76,0.15)', color: '#c9a84c' },
  Shipped: { bg: 'rgba(52,73,94,0.4)', color: '#a9c0d8' },
  'Out for Delivery': { bg: 'rgba(230,126,34,0.15)', color: '#e67e22' },
  Out_For_Delivery: { bg: 'rgba(230,126,34,0.15)', color: '#e67e22' },
  Delivered: { bg: 'rgba(46,204,113,0.15)', color: '#2ecc71' },
  Cancelled: { bg: 'rgba(231,76,60,0.15)', color: '#e74c3c' },
  Returned: { bg: 'rgba(155,89,182,0.15)', color: '#9b59b6' },
};

const PAYMENT_COLORS: Record<string, { bg: string; color: string }> = {
  Pending: { bg: 'rgba(243,156,18,0.15)', color: '#f39c12' },
  PENDING: { bg: 'rgba(243,156,18,0.15)', color: '#f39c12' },
  Processing: { bg: 'rgba(52,152,219,0.15)', color: '#3498db' },
  PROCESSING: { bg: 'rgba(52,152,219,0.15)', color: '#3498db' },
  Paid: { bg: 'rgba(46,204,113,0.15)', color: '#2ecc71' },
  PAID: { bg: 'rgba(46,204,113,0.15)', color: '#2ecc71' },
  Failed: { bg: 'rgba(231,76,60,0.15)', color: '#e74c3c' },
  FAILED: { bg: 'rgba(231,76,60,0.15)', color: '#e74c3c' },
  Cancelled: { bg: 'rgba(231,76,60,0.15)', color: '#e74c3c' },
  CANCELLED: { bg: 'rgba(231,76,60,0.15)', color: '#e74c3c' },
  'Refund Pending': { bg: 'rgba(241,196,15,0.15)', color: '#f1c40f' },
  'REFUND PENDING': { bg: 'rgba(241,196,15,0.15)', color: '#f1c40f' },
  REFUND_PENDING: { bg: 'rgba(241,196,15,0.15)', color: '#f1c40f' },
  Refunded: { bg: 'rgba(155,89,182,0.15)', color: '#9b59b6' },
  REFUNDED: { bg: 'rgba(155,89,182,0.15)', color: '#9b59b6' },
  'Partially Refunded': { bg: 'rgba(142,68,173,0.15)', color: '#8e44ad' },
  'PARTIALLY REFUNDED': { bg: 'rgba(142,68,173,0.15)', color: '#8e44ad' },
  PARTIALLY_REFUNDED: { bg: 'rgba(142,68,173,0.15)', color: '#8e44ad' },
};

const IRREVERSIBLE = new Set(['Cancelled', 'Returned']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string; map: Record<string, { bg: string; color: string }> }> = ({ status, map }) => {
  const c = map[status] || map[status?.toUpperCase?.()] || { bg: 'rgba(255,255,255,0.06)', color: 'var(--cream)' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '0.72rem',
      fontWeight: 700,
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.color}50`,
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
};

// ─── Order Detail Modal ───────────────────────────────────────────────────────

export const OrderDetailModal: React.FC<{
  order: any;
  onClose: () => void;
  onUpdateStatus: (id: string, payload: { status?: string; payment_status?: string }) => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string, title?: string) => void;
  onRefresh: () => void;
}> = ({ order, onClose, onUpdateStatus, addToast, onRefresh }) => {
  const [confirmPayload, setConfirmPayload] = useState<{ status?: string; payment_status?: string } | null>(null);
  const [confirmMsg, setConfirmMsg] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const isCod = order.paymentMethod === 'Cash on Delivery' || order.paymentMethod === 'COD' || order.payment_method === 'Cash on Delivery' || order.payment_method === 'COD';
  const currentSt = order.status || 'Processing';
  const currentPs = order.payment_status || order.paymentStatus || 'PENDING';
  const allowedNext = ALLOWED_TRANSITIONS[currentSt] || [];

  const shipAddr = order.shipping_address || order.shippingAddress || {};
  const customerName = shipAddr.name || shipAddr.full_name || order.customer_name || order.user_name || order.name || 'Customer';
  const customerPhone = shipAddr.phone || shipAddr.phoneNumber || order.customer_phone || order.phone || '';
  const customerEmail = shipAddr.email || order.user_email || order.customer_email || order.email || '';

  const street = shipAddr.street || shipAddr.address || shipAddr.address_line1 || shipAddr.street_address || '';
  const city = shipAddr.city || '';
  const state = shipAddr.state || '';
  const pincode = shipAddr.zip || shipAddr.pincode || shipAddr.postalCode || shipAddr.zip_code || '';

  const initiateStatusChange = (newSt: string) => {
    if (!allowedNext.includes(newSt)) {
      addToast('error', `Cannot transition from ${currentSt} to ${newSt}.`, 'Invalid Transition');
      return;
    }
    if (IRREVERSIBLE.has(newSt)) {
      setConfirmPayload({ status: newSt });
      setConfirmMsg(
        newSt === 'Cancelled'
          ? `This will permanently cancel order ${order.id}. This cannot be undone.`
          : `Marking as Delivered finalizes this order permanently.`
      );
    } else {
      doUpdate({ status: newSt });
    }
  };

  const initiateCodPaid = () => {
    setConfirmPayload({ payment_status: 'PAID' });
    setConfirmMsg(`Mark COD payment as PAID for order ${order.id}? This cannot be reversed.`);
  };

  const doUpdate = async (payload: { status?: string; payment_status?: string }) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(order.id, payload);
      addToast('success', 'Order updated successfully.', 'Updated');
      onRefresh();
      onClose();
    } catch (err: any) {
      addToast('error', err?.detail || err?.message || 'Failed to update order status.', 'Error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', borderRadius: '12px', border: '1px solid var(--gold)', background: 'rgba(18,10,5,0.97)', padding: '20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Order Details</span>
            <h2 style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--cream)', margin: '2px 0 0 0' }}>{order.id}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--beige)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        {/* Customer & Shipping Address Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px', marginBottom: '14px' }}>
          {/* Customer Details */}
          <div style={{ background: 'rgba(255,255,255,0.025)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.66rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
              <User size={12} /> Customer Information
            </div>
            <div style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '0.88rem' }}>{customerName}</div>
            {customerPhone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--beige)' }}>
                <Phone size={11} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                <a href={`tel:${customerPhone}`} style={{ color: 'var(--beige)', textDecoration: 'none' }}>{customerPhone}</a>
              </div>
            )}
            {customerEmail && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--grey-light)', wordBreak: 'break-all' }}>
                <Mail size={11} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                <span>{customerEmail}</span>
              </div>
            )}
          </div>

          {/* Delivery & Shipping Address */}
          <div style={{ background: 'rgba(255,255,255,0.025)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.66rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
              <MapPin size={12} /> Shipping Destination
            </div>
            {street ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--cream)', fontWeight: 500, lineHeight: 1.45 }}>
                {street}
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Address line not specified</div>
            )}
            
            {(city || state || pincode) && (
              <div style={{ fontSize: '0.78rem', color: 'var(--beige)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                <span>{[city, state].filter(Boolean).join(', ')}</span>
                {pincode && (
                  <span style={{ background: 'rgba(201,168,76,0.12)', color: 'var(--gold)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, border: '1px solid rgba(201,168,76,0.25)' }}>
                    PIN: {pincode}
                  </span>
                )}
              </div>
            )}

            {order.delivery_option && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: 'var(--grey-light)', marginTop: '2px', borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                <Truck size={11} style={{ color: 'var(--gold)', flexShrink: 0 }} />
                <span>Option: <strong style={{ color: 'var(--cream)' }}>{order.delivery_option}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Statuses row */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '14px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--grey-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Order Status</div>
            <StatusBadge status={currentSt} map={FULFILLMENT_COLORS} />
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--grey-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Payment</div>
            <StatusBadge status={currentPs} map={PAYMENT_COLORS} />
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--grey-light)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Method</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--cream)', fontWeight: 600 }}>{order.paymentMethod || '—'}</span>
          </div>
        </div>

        {/* Order Items */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '8px' }}>Items</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {order.items?.map((it: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--cream)', fontWeight: 600 }}>{it.product?.name || 'Product'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--grey-light)' }}>Qty: {it.quantity} × ₹{it.price}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.85rem' }}>₹{(it.quantity * it.price).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--cream)' }}>
              <span>Subtotal</span><span style={{ fontWeight: 600 }}>₹{(order.subtotal || 0).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--cream)' }}>
              <span>Delivery</span><span style={{ fontWeight: 600 }}>{order.shipping > 0 ? `₹${order.shipping.toLocaleString()}` : 'Free'}</span>
            </div>
            {(order.tax || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--cream)' }}>
                <span>Tax (GST)</span><span style={{ fontWeight: 600 }}>₹{order.tax.toLocaleString()}</span>
              </div>
            )}
            {(order.coupon_discount || order.discount || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2ecc71' }}>
                <span>Coupon {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                <span style={{ fontWeight: 600 }}>−₹{(order.coupon_discount || order.discount || 0).toLocaleString()}</span>
              </div>
            )}
            {(order.coin_discount || 0) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2ecc71' }}>
                <span>Reward Coins ({order.coins_used})</span>
                <span style={{ fontWeight: 600 }}>−₹{(order.coin_discount || 0).toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '8px', marginTop: '2px' }}>
              <span style={{ color: 'var(--cream)', fontWeight: 700, fontSize: '0.88rem' }}>Total</span>
              <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>₹{(order.total || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {(allowedNext.length > 0 || (isCod && currentPs === 'PENDING')) && (
          <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '8px' }}>
              Update Status & Payment
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {allowedNext.map((st) => (
                <button
                  key={st}
                  disabled={isUpdating}
                  onClick={() => initiateStatusChange(st)}
                  style={{
                    flex: '1 1 0',
                    minWidth: '85px',
                    padding: '7px 8px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    background: st === 'Cancelled' ? 'rgba(231,76,60,0.15)' : 'rgba(201,168,76,0.15)',
                    color: st === 'Cancelled' ? '#e74c3c' : 'var(--gold)',
                    border: st === 'Cancelled' ? '1px solid rgba(231,76,60,0.4)' : '1px solid var(--gold)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  → {STATUS_LABELS[st] || st}
                </button>
              ))}
              {isCod && currentPs === 'PENDING' && (
                <button
                  disabled={isUpdating}
                  onClick={initiateCodPaid}
                  style={{
                    flex: '1 1 0',
                    minWidth: '95px',
                    padding: '7px 8px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    background: 'rgba(46,204,113,0.15)',
                    color: '#2ecc71',
                    border: '1px solid rgba(46,204,113,0.4)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Mark COD Paid
                </button>
              )}
            </div>
          </div>
        )}

        {confirmPayload && (
          <div style={{ marginTop: '16px', padding: '14px', borderRadius: '8px', background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.4)', color: '#f5e6d3' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem' }}>{confirmMsg}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                disabled={isUpdating}
                onClick={() => doUpdate(confirmPayload)}
                style={{ padding: '6px 14px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmPayload(null)}
                style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.1)', color: 'var(--cream)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Quick Confirm Dialog ─────────────────────────────────────────────────────

const QuickConfirmDialog: React.FC<{
  orderId: string;
  newStatus: string;
  isUpdating?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ orderId, newStatus, isUpdating, onConfirm, onCancel }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
    <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '24px', borderRadius: '12px', border: '1px solid var(--gold)', background: 'rgba(18,10,5,0.96)', textAlign: 'center' }}>
      <AlertTriangle size={36} color="#e74c3c" style={{ margin: '0 auto 12px auto', display: 'block' }} />
      <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--cream)', margin: '0 0 8px 0', fontSize: '1.2rem' }}>Confirm Status Change</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--beige)', marginBottom: '20px' }}>
        {newStatus === '_MARK_PAID'
          ? `Are you sure you want to mark COD payment as PAID for order ${orderId}?`
          : `Are you sure you want to change order ${orderId} status to "${STATUS_LABELS[newStatus] || newStatus}"?`}
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          disabled={isUpdating}
          onClick={onCancel}
          style={{ padding: '9px 20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--cream)', borderRadius: '6px', cursor: isUpdating ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: isUpdating ? 0.6 : 1 }}
        >
          Cancel
        </button>
        <button
          disabled={isUpdating}
          onClick={onConfirm}
          style={{ padding: '9px 20px', background: 'var(--gold)', border: 'none', color: '#000', borderRadius: '6px', cursor: isUpdating ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: isUpdating ? 0.6 : 1 }}
        >
          {isUpdating ? 'Confirming...' : 'Confirm'}
        </button>
      </div>
    </div>
  </div>
);

// ─── Main OrderManagement Component ──────────────────────────────────────────

interface OrderManagementProps {
  handleUpdateOrderStatus: (orderId: string, payload: { status?: string; payment_status?: string }) => Promise<any>;
  addToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({
  handleUpdateOrderStatus,
  addToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [dbOrderData, setDbOrderData] = useState<any>(null);

  const [viewingOrder, setViewingOrder] = useState<any | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ order: any; newStatus: string } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchDbOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const data = await adminService.getAllOrders({
        status: fulfillmentFilter !== 'ALL' ? fulfillmentFilter : undefined,
        payment_status: paymentFilter !== 'ALL' ? paymentFilter : undefined,
        search: searchQuery.trim() || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        limit,
      });
      setDbOrderData(data);
    } catch (err: any) {
      console.error('Failed to fetch orders from database:', err);
      addToast('error', err?.detail || err?.message || 'Failed to load order data from database.', 'API Error');
    } finally {
      setOrdersLoading(false);
    }
  }, [fulfillmentFilter, paymentFilter, searchQuery, dateFrom, dateTo, page, limit, addToast]);

  useEffect(() => {
    fetchDbOrders();
  }, [fetchDbOrders]);

  const summary = dbOrderData?.summary || {};
  const ordersList = dbOrderData?.items || [];
  const totalCount = dbOrderData?.total || 0;
  const totalPages = dbOrderData?.total_pages || 1;

  const kpis = {
    total: summary.total_orders ?? 0,
    pending: (summary.processing ?? 0) + (summary.confirmed ?? 0),
    transit: (summary.shipped ?? 0) + (summary.out_for_delivery ?? 0),
    delivered: summary.delivered ?? 0,
    cancelled: summary.cancelled ?? 0,
    revenue: summary.total_revenue ?? 0,
  };

  const handleQuickChange = (order: any, newSt: string) => {
    const currentSt = order.status || 'Processing';
    if (!(ALLOWED_TRANSITIONS[currentSt] || []).includes(newSt)) {
      addToast('error', `Cannot change from "${currentSt}" to "${newSt}".`, 'Invalid Transition');
      return;
    }
    if (IRREVERSIBLE.has(newSt)) {
      setPendingConfirm({ order, newStatus: newSt });
    } else {
      handleUpdateOrderStatus(order.id, { status: newSt }).then(() => {
        addToast('success', `Order ${order.id} → ${STATUS_LABELS[newSt] || newSt}`, 'Status Updated');
        fetchDbOrders();
      });
    }
  };

  const handleMarkCodPaid = (order: any) => {
    setPendingConfirm({ order, newStatus: '_MARK_PAID' });
  };

  const confirmUpdate = async () => {
    if (!pendingConfirm) return;
    setIsConfirming(true);
    const { order, newStatus } = pendingConfirm;
    try {
      if (newStatus === '_MARK_PAID') {
        await handleUpdateOrderStatus(order.id, { payment_status: 'PAID' });
        addToast('success', `COD marked PAID for ${order.id}`, 'Payment Updated');
      } else {
        await handleUpdateOrderStatus(order.id, { status: newStatus });
        addToast('success', `Order ${order.id} → ${STATUS_LABELS[newStatus] || newStatus}`, 'Status Updated');
      }
      fetchDbOrders();
    } catch (err: any) {
      console.error('Failed to update order status:', err);
      addToast('error', err?.detail || err?.message || 'Failed to update order status.', 'Error');
    } finally {
      setIsConfirming(false);
      setPendingConfirm(null);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
        <div>
          <span className="section-label">Order Operations</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', color: 'var(--cream)', margin: 0 }}>Order Management</h1>
        </div>
        <button
          onClick={fetchDbOrders}
          disabled={ordersLoading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.08)', color: 'var(--gold)' }}
        >
          {ordersLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={15} />}
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px', marginBottom: '26px' }}>
        {[
          { label: 'Total Orders', value: kpis.total, color: '#c9a84c' },
          { label: 'Processing', value: kpis.pending, color: '#3498db' },
          { label: 'In Transit', value: kpis.transit, color: '#f39c12' },
          { label: 'Delivered', value: kpis.delivered, color: '#2ecc71' },
          { label: 'Cancelled', value: kpis.cancelled, color: '#e74c3c' },
          { label: 'Net Revenue', value: `₹${kpis.revenue.toLocaleString('en-IN')}`, color: '#c9a84c' },
        ].map((k) => (
          <div key={k.label} className="glass-panel" style={{ padding: '14px 16px', borderRadius: '10px', borderTop: `2px solid ${k.color}`, border: `1px solid ${k.color}22` }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--grey-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '7px' }}>{k.label}</div>
            <div style={{ fontSize: '1.55rem', fontWeight: 700, color: k.color, fontFamily: 'var(--font-display)' }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: isMobile ? '12px 12px' : '18px 22px', marginBottom: '18px', border: '1px solid var(--glass-border)', boxSizing: 'border-box', overflow: 'hidden' }}>
        {isMobile ? (
          /* Mobile View: Two side-by-side dropdowns */
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, display: 'block', marginBottom: '5px' }}>
                Order Status
              </label>
              <select
                value={fulfillmentFilter}
                onChange={(e) => { setFulfillmentFilter(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '7px 8px',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  color: '#f5efe6',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'auto',
                  boxSizing: 'border-box',
                }}
              >
                {FULFILLMENT_STATUSES.map((st) => (
                  <option key={st} value={st} style={{ background: '#1a120b', color: '#f5efe6' }}>
                    {st === 'ALL' ? 'All Statuses' : STATUS_LABELS[st] || st}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={{ fontSize: '0.65rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, display: 'block', marginBottom: '5px' }}>
                Payment Status
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
                style={{
                  width: '100%',
                  padding: '7px 8px',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  color: '#f5efe6',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'auto',
                  boxSizing: 'border-box',
                }}
              >
                {PAYMENT_STATUSES.map((ps) => (
                  <option key={ps} value={ps} style={{ background: '#1a120b', color: '#f5efe6' }}>
                    {ps === 'ALL' ? 'All Payments' : ps}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          /* Desktop View: Pill buttons */
          <>
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, display: 'block', marginBottom: '9px' }}>Order Status</span>
              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                {FULFILLMENT_STATUSES.map((st) => {
                  const isActive = fulfillmentFilter === st;
                  const badge = FULFILLMENT_COLORS[st];
                  return (
                    <button key={st} type="button"
                      onClick={() => { setFulfillmentFilter(st); setPage(1); }}
                      style={{ padding: '5px 13px', borderRadius: '20px', fontSize: '0.77rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: isActive ? (badge?.bg || 'rgba(201,168,76,0.2)') : 'rgba(255,255,255,0.04)', color: isActive ? (badge?.color || 'var(--gold)') : 'var(--beige)', border: isActive ? `1px solid ${badge?.color || 'var(--gold)'}60` : '1px solid rgba(255,255,255,0.1)' }}>
                      {STATUS_LABELS[st] || st}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, display: 'block', marginBottom: '9px' }}>Payment Status</span>
              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                {PAYMENT_STATUSES.map((ps) => {
                  const isActive = paymentFilter === ps;
                  const badge = PAYMENT_COLORS[ps];
                  return (
                    <button key={ps} type="button"
                      onClick={() => { setPaymentFilter(ps); setPage(1); }}
                      style={{ padding: '5px 13px', borderRadius: '20px', fontSize: '0.77rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: isActive ? (badge?.bg || 'rgba(201,168,76,0.15)') : 'rgba(255,255,255,0.04)', color: isActive ? (badge?.color || 'var(--gold)') : 'var(--beige)', border: isActive ? `1px solid ${badge?.color || 'var(--gold)'}60` : '1px solid rgba(255,255,255,0.1)' }}>
                      {ps}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', alignItems: isMobile ? 'stretch' : 'center' }}>
          <div style={{ flex: isMobile ? 'none' : '1 1 200px', width: isMobile ? '100%' : 'auto', minWidth: isMobile ? '0' : '180px', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--grey-light)', pointerEvents: 'none', zIndex: 2 }} />
            <input type="text" placeholder="Search by Order ID, customer name or phone..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              style={{ width: '100%', paddingLeft: '34px', paddingRight: searchQuery ? '32px' : '10px', paddingTop: '8px', paddingBottom: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: 'var(--cream)', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setPage(1); }} style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--grey-light)', cursor: 'pointer', zIndex: 2 }}>
                <X size={13} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: isMobile ? '100%' : 'auto', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--grey-light)', whiteSpace: 'nowrap' }}>From:</span>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                style={{ width: '100%', minWidth: 0, padding: '6px 4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: 'var(--cream)', fontSize: '0.72rem', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--grey-light)', whiteSpace: 'nowrap' }}>To:</span>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                style={{ width: '100%', minWidth: 0, padding: '6px 4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: 'var(--cream)', fontSize: '0.72rem', outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' }} />
            </div>
            {(dateFrom || dateTo || searchQuery || fulfillmentFilter !== 'ALL' || paymentFilter !== 'ALL') && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); setSearchQuery(''); setFulfillmentFilter('ALL'); setPaymentFilter('ALL'); setPage(1); }}
                style={{ padding: '6px 8px', background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: '6px', color: '#e74c3c', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '0', border: '1px solid var(--glass-border)', overflowX: 'auto', borderRadius: '10px' }}>
        {ordersLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--beige)' }}>
            <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 14px auto', display: 'block' }} />
            <p style={{ margin: 0 }}>Loading orders from database...</p>
          </div>
        ) : ordersList.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Package size={40} color="var(--grey-light)" style={{ margin: '0 auto 14px auto', display: 'block' }} />
            <p style={{ color: 'var(--grey-light)', margin: 0 }}>
              {totalCount === 0 && !searchQuery && !dateFrom && !dateTo && fulfillmentFilter === 'ALL' && paymentFilter === 'ALL'
                ? 'No orders found in database.'
                : 'No orders match the selected search or filter criteria.'}
            </p>
          </div>
        ) : (
          <>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px' }}>
                {ordersList.map((ord: any, idx: number) => {
                  const isCod = ord.paymentMethod === 'Cash on Delivery' || ord.paymentMethod === 'COD';
                  const currentPs = ord.payment_status || 'PENDING';
                  const currentSt = ord.status || 'Processing';
                  const allowedNext = ALLOWED_TRANSITIONS[currentSt] || [];
                  const fBadge = FULFILLMENT_COLORS[currentSt] || { bg: 'rgba(255,255,255,0.06)', color: 'var(--cream)' };
                  const pBadge = PAYMENT_COLORS[currentPs] || { bg: 'rgba(255,255,255,0.06)', color: 'var(--cream)' };
                  const isFinal = currentSt === 'Delivered' || currentSt === 'Cancelled';
                  const ordDate = ord.created_at || ord.date || 'Today';

                  return (
                    <div key={ord.id} className="glass-panel" style={{ padding: '16px', borderRadius: '8px', background: 'rgba(26,13,0,0.4)', border: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--gold)', fontFamily: 'monospace', fontSize: '0.85rem' }}>{ord.id}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>{ordDate?.slice(0, 10)}</div>
                        </div>
                        <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '1rem' }}>
                          ₹{ord.total?.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '0.9rem' }}>
                          {ord.shipping_address?.name || ord.shippingAddress?.name || ord.customer_name || ord.name || '—'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--beige)' }}>
                          {ord.shipping_address?.phone || ord.shippingAddress?.phone || ord.customer_phone || ord.phone || ''}
                        </div>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px', marginBottom: '12px' }}>
                        {ord.items?.slice(0, 2).map((it: any, i: number) => (
                          <div key={i} style={{ fontSize: '0.8rem', color: 'var(--cream)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{it.product?.name || 'Product'}</span>
                            <span style={{ color: 'var(--gold)', fontWeight: 700, marginLeft: '8px' }}>×{it.quantity}</span>
                          </div>
                        ))}
                        {(ord.items?.length || 0) > 2 && <div style={{ fontSize: '0.75rem', color: 'var(--grey-light)', textAlign: 'right' }}>+{ord.items.length - 2} more</div>}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--beige)' }}>Payment: {ord.paymentMethod || '—'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: pBadge.bg, color: pBadge.color, border: `1px solid ${pBadge.color}50` }}>
                            {currentPs}
                          </span>
                          {isCod && currentPs === 'PENDING' && (
                            <button type="button" onClick={() => handleMarkCodPaid(ord)}
                              style={{ padding: '3px 8px', fontSize: '0.75rem', background: 'rgba(46,204,113,0.12)', border: '1px solid #2ecc7155', color: '#2ecc71', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, background: fBadge.bg, color: fBadge.color, border: `1px solid ${fBadge.color}50` }}>
                          {STATUS_LABELS[currentSt] || currentSt}
                        </span>
                        {!isFinal && allowedNext.length > 0 && (
                          <select value="" onChange={(e) => { if (e.target.value) handleQuickChange(ord, e.target.value); }}
                            style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.35)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', outline: 'none' }}>
                            <option value="">→ Change Status</option>
                            {allowedNext.map((st) => (
                              <option key={st} value={st}>{STATUS_LABELS[st] || st}</option>
                            ))}
                          </select>
                        )}
                      </div>

                      <button onClick={() => setViewingOrder(ord)}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--gold)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                        <Eye size={16} /> View Order Details
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Order ID & Date', 'Customer', 'Items & Qty', 'Payment Method', 'Payment Status', 'Order Status', 'Total', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '13px 15px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gold)', background: 'rgba(201,168,76,0.05)', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ordersList.map((ord: any, idx: number) => {
                    const isCod = ord.paymentMethod === 'Cash on Delivery' || ord.paymentMethod === 'COD';
                    const currentPs = ord.payment_status || 'PENDING';
                    const currentSt = ord.status || 'Processing';
                    const allowedNext = ALLOWED_TRANSITIONS[currentSt] || [];
                    const fBadge = FULFILLMENT_COLORS[currentSt] || { bg: 'rgba(255,255,255,0.06)', color: 'var(--cream)' };
                    const pBadge = PAYMENT_COLORS[currentPs] || { bg: 'rgba(255,255,255,0.06)', color: 'var(--cream)' };
                    const isFinal = currentSt === 'Delivered' || currentSt === 'Cancelled';
                    const ordDate = ord.created_at || ord.date || 'Today';

                    return (
                      <tr key={ord.id}
                        style={{ borderBottom: idx < ordersList.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.022)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {/* Order ID & Date */}
                        <td style={{ padding: '10px 12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, color: 'var(--gold)', fontFamily: 'monospace', fontSize: '0.75rem' }}>{ord.id}</div>
                          <div style={{ fontSize: '0.67rem', color: 'var(--grey-light)', marginTop: '2px' }}>{ordDate?.slice(0, 10)}</div>
                        </td>
                        {/* Customer */}
                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                          <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                            {ord.shipping_address?.name || ord.shippingAddress?.name || ord.customer_name || ord.name || '—'}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--beige)' }}>
                            {ord.shipping_address?.phone || ord.shippingAddress?.phone || ord.customer_phone || ord.phone || ''}
                          </div>
                        </td>
                        {/* Items */}
                        <td style={{ padding: '10px 12px', verticalAlign: 'middle', maxWidth: '160px' }}>
                          {ord.items?.slice(0, 2).map((it: any, i: number) => (
                            <div key={i} style={{ fontSize: '0.74rem', color: 'var(--cream)', display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--gold)', flexShrink: 0, display: 'inline-block' }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.product?.name || 'Product'}</span>
                              <span style={{ color: 'var(--gold)', fontWeight: 700, flexShrink: 0 }}>×{it.quantity}</span>
                            </div>
                          ))}
                          {(ord.items?.length || 0) > 2 && <div style={{ fontSize: '0.65rem', color: 'var(--grey-light)' }}>+{ord.items.length - 2} more</div>}
                        </td>
                        {/* Payment Method */}
                        <td style={{ padding: '10px 12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--cream)' }}>{ord.paymentMethod || '—'}</span>
                        </td>
                        {/* Payment Status */}
                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, background: pBadge.bg, color: pBadge.color, border: `1px solid ${pBadge.color}50`, whiteSpace: 'nowrap' }}>
                            {currentPs}
                          </span>
                          {isCod && currentPs === 'PENDING' && (
                            <button type="button" onClick={() => handleMarkCodPaid(ord)}
                              style={{ display: 'block', marginTop: '4px', padding: '2px 7px', fontSize: '0.63rem', background: 'rgba(46,204,113,0.12)', border: '1px solid #2ecc7155', color: '#2ecc71', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              Mark Paid
                            </button>
                          )}
                        </td>
                        {/* Order Status */}
                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, background: fBadge.bg, color: fBadge.color, border: `1px solid ${fBadge.color}50`, whiteSpace: 'nowrap' }}>
                            {STATUS_LABELS[currentSt] || currentSt}
                          </span>
                          {!isFinal && allowedNext.length > 0 && (
                            <select value="" onChange={(e) => { if (e.target.value) handleQuickChange(ord, e.target.value); }}
                              style={{ display: 'block', width: '100%', marginTop: '4px', padding: '3px 6px', background: 'rgba(0,0,0,0.35)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '4px', fontSize: '0.68rem', cursor: 'pointer', outline: 'none' }}>
                              <option value="">→ Change</option>
                              {allowedNext.map((st) => (
                                <option key={st} value={st}>{STATUS_LABELS[st] || st}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        {/* Total */}
                        <td style={{ padding: '10px 12px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.88rem' }}>₹{ord.total?.toLocaleString('en-IN')}</div>
                        </td>
                        {/* Actions */}
                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                          <button onClick={() => setViewingOrder(ord)}
                            style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '4px 10px', borderRadius: '5px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--gold)', whiteSpace: 'nowrap' }}>
                            <Eye size={11} /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--beige)' }}>
          Showing {totalCount > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalCount)} of {totalCount} orders
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={limit}
            onPageChange={(p) => setPage(p)}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--beige)' }}>
            <span>Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              style={{ padding: '4px 8px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--cream)', fontSize: '0.8rem' }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {viewingOrder && (
        <OrderDetailModal
          order={viewingOrder}
          onClose={() => setViewingOrder(null)}
          onUpdateStatus={handleUpdateOrderStatus}
          addToast={addToast}
          onRefresh={fetchDbOrders}
        />
      )}

      {/* Quick Confirm Dialog */}
      {pendingConfirm && (
        <QuickConfirmDialog
          orderId={pendingConfirm.order.id}
          newStatus={pendingConfirm.newStatus}
          isUpdating={isConfirming}
          onConfirm={confirmUpdate}
          onCancel={() => !isConfirming && setPendingConfirm(null)}
        />
      )}
    </>
  );
};

export default OrderManagement;
