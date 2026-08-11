import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Loader2,
  FileText,
  Eye,
  RefreshCw,
  AlertTriangle,
  Package,
  MapPin,
  CreditCard,
  Calendar,
} from 'lucide-react';

// ─── Status Definitions ───────────────────────────────────────────────────────

const FULFILLMENT_STATUSES = ['ALL', 'Processing', 'Confirmed', 'Shipped', 'Out_For_Delivery', 'Delivered', 'Cancelled'];
const PAYMENT_STATUSES = ['ALL', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'];

// Valid forward-only transitions
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  Processing: ['Confirmed', 'Cancelled'],
  Confirmed: ['Shipped', 'Cancelled'],
  Shipped: ['Out_For_Delivery', 'Cancelled'],
  Out_For_Delivery: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

const STATUS_LABELS: Record<string, string> = {
  Out_For_Delivery: 'Out for Delivery',
};

const FULFILLMENT_COLORS: Record<string, { bg: string; color: string }> = {
  Processing: { bg: 'rgba(201,168,76,0.15)', color: '#c9a84c' },
  Confirmed: { bg: 'rgba(52,152,219,0.15)', color: '#3498db' },
  Shipped: { bg: 'rgba(52,73,94,0.4)', color: '#a9c0d8' },
  Out_For_Delivery: { bg: 'rgba(243,156,18,0.15)', color: '#f39c12' },
  Delivered: { bg: 'rgba(46,204,113,0.15)', color: '#2ecc71' },
  Cancelled: { bg: 'rgba(231,76,60,0.15)', color: '#e74c3c' },
};

const PAYMENT_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: 'rgba(243,156,18,0.15)', color: '#f39c12' },
  PAID: { bg: 'rgba(46,204,113,0.15)', color: '#2ecc71' },
  FAILED: { bg: 'rgba(231,76,60,0.15)', color: '#e74c3c' },
  REFUNDED: { bg: 'rgba(155,89,182,0.15)', color: '#9b59b6' },
};

const IRREVERSIBLE = new Set(['Cancelled', 'Delivered']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: string; map: Record<string, { bg: string; color: string }> }> = ({ status, map }) => {
  const c = map[status] || { bg: 'rgba(255,255,255,0.06)', color: 'var(--cream)' };
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

const OrderDetailModal: React.FC<{
  order: any;
  onClose: () => void;
  onUpdateStatus: (id: string, payload: { status?: string; payment_status?: string }) => void;
  addToast: (type: 'success' | 'error' | 'info', msg: string, title?: string) => void;
}> = ({ order, onClose, onUpdateStatus, addToast }) => {
  const [confirmPayload, setConfirmPayload] = useState<{ status?: string; payment_status?: string } | null>(null);
  const [confirmMsg, setConfirmMsg] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const isCod = order.paymentMethod === 'Cash on Delivery' || order.paymentMethod === 'COD';
  const currentSt = order.status || 'Processing';
  const currentPs = order.payment_status || 'PENDING';
  const allowedNext = ALLOWED_TRANSITIONS[currentSt] || [];
  const fBadge = FULFILLMENT_COLORS[currentSt] || { bg: 'rgba(255,255,255,0.08)', color: 'var(--cream)' };
  const pBadge = PAYMENT_COLORS[currentPs] || { bg: 'rgba(255,255,255,0.08)', color: 'var(--cream)' };

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
      onUpdateStatus(order.id, payload);
      addToast('success', 'Order updated successfully.', 'Updated');
      onClose();
    } catch {
      addToast('error', 'Failed to update order.', 'Error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{
        background: '#0e0a06',
        border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: '12px', width: '100%', maxWidth: '780px',
        maxHeight: '88vh', overflowY: 'auto', padding: '32px', position: 'relative',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>Order Details</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--cream)', margin: 0 }}>{order.id}</h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--grey-light)', marginTop: '4px' }}>Placed: {order.date}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--rose-gold)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        {/* Status row */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <span style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, background: fBadge.bg, color: fBadge.color, border: `1px solid ${fBadge.color}40` }}>
            {STATUS_LABELS[currentSt] || currentSt}
          </span>
          <span style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, background: pBadge.bg, color: pBadge.color, border: `1px solid ${pBadge.color}40` }}>
            {currentPs}
          </span>
          <span style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '0.78rem', color: 'var(--beige)', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)' }}>
            {order.paymentMethod}
          </span>
          <span style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '0.78rem', color: 'var(--beige)', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)' }}>
            {order.deliveryOption}
          </span>
        </div>

        {/* 2-col info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {/* Shipping Address */}
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={12} /> Shipping Address
            </div>
            <div style={{ fontWeight: 700, color: 'var(--cream)', marginBottom: '4px' }}>{order.shippingAddress?.name || '—'}</div>
            <div style={{ fontSize: '0.83rem', color: 'var(--beige)', lineHeight: 1.7 }}>
              <div>{order.shippingAddress?.street}</div>
              <div>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}</div>
              <div style={{ color: 'var(--grey-light)', marginTop: '4px' }}>📞 {order.shippingAddress?.phone}</div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CreditCard size={12} /> Payment Breakdown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.83rem', color: 'var(--beige)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>₹{order.subtotal?.toFixed(2)}</span></div>
              {(order.coupon_discount > 0) && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2ecc71' }}><span>Coupon ({order.coupon_code})</span><span>-₹{order.coupon_discount?.toFixed(2)}</span></div>}
              {(order.coin_discount > 0) && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f39c12' }}><span>Coins ({order.coins_used})</span><span>-₹{order.coin_discount?.toFixed(2)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shipping</span><span>{order.shipping === 0 ? 'Free' : `₹${order.shipping}`}</span></div>
              {(order.tax > 0) && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax</span><span>₹{order.tax?.toFixed(2)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '7px', marginTop: '3px', fontWeight: 700, color: 'var(--gold)', fontSize: '0.97rem' }}>
                <span>Total</span><span>₹{order.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Package size={12} /> Order Items ({order.items?.length || 0})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '7px' }}>
                {item.product?.image && (
                  <img src={item.product.image} alt={item.product.name}
                    style={{ width: '40px', height: '40px', borderRadius: '5px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '0.88rem' }}>{item.product?.name || 'Product'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>{item.product?.weight || ''} • ₹{item.product?.price || item.price} × {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.92rem' }}>
                  ₹{((item.product?.price || item.price || 0) * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Update Status Actions */}
        {(allowedNext.length > 0 || (isCod && currentPs === 'PENDING')) && (
          <div style={{ padding: '16px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '8px', marginBottom: '18px' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Update Order Status</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {allowedNext.map((st) => {
                const isDestructive = st === 'Cancelled';
                return (
                  <button key={st} disabled={isUpdating} onClick={() => initiateStatusChange(st)}
                    style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: isDestructive ? '1px solid #e74c3c' : '1px solid var(--gold)', background: isDestructive ? 'rgba(231,76,60,0.12)' : 'rgba(201,168,76,0.12)', color: isDestructive ? '#e74c3c' : 'var(--gold)' }}>
                    → {STATUS_LABELS[st] || st}
                  </button>
                );
              })}
              {isCod && currentPs === 'PENDING' && (
                <button disabled={isUpdating} onClick={initiateCodPaid}
                  style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #2ecc71', background: 'rgba(46,204,113,0.12)', color: '#2ecc71' }}>
                  ✓ Mark COD as Paid
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <a href={`http://localhost:8000/api/v1/orders/${order.id}/invoice`} target="_blank" rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '6px', fontSize: '0.83rem', fontWeight: 600, color: 'var(--cream)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', textDecoration: 'none' }}>
            <FileText size={14} /> View Invoice
          </a>
          <button onClick={onClose}
            style={{ padding: '9px 18px', borderRadius: '6px', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.04)', color: 'var(--cream)' }}>
            Close
          </button>
        </div>

        {/* Inline Confirm Overlay */}
        {confirmPayload && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '20px', zIndex: 100 }}>
            <AlertTriangle size={40} color="#e74c3c" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--cream)', marginBottom: '10px' }}>Confirm Action</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--beige)', maxWidth: '340px', lineHeight: 1.6 }}>{confirmMsg}</div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setConfirmPayload(null)}
                style={{ padding: '9px 20px', borderRadius: '6px', fontSize: '0.83rem', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'var(--cream)', fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={() => { doUpdate(confirmPayload!); setConfirmPayload(null); }} disabled={isUpdating}
                style={{ padding: '9px 20px', borderRadius: '6px', fontSize: '0.83rem', cursor: 'pointer', background: '#e74c3c', border: '1px solid #e74c3c', color: '#fff', fontWeight: 700 }}>
                {isUpdating ? 'Processing...' : 'Confirm'}
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
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ orderId, newStatus, onConfirm, onCancel }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(6px)' }}>
    <div style={{ background: '#0e0a06', border: '1px solid rgba(231,76,60,0.4)', borderRadius: '12px', padding: '36px', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
      <AlertTriangle size={40} color="#e74c3c" style={{ margin: '0 auto 16px', display: 'block' }} />
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '12px' }}>Confirm Status Change</h3>
      <p style={{ color: 'var(--beige)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '24px' }}>
        Marking order <strong style={{ color: 'var(--gold)' }}>{orderId}</strong> as{' '}
        <strong style={{ color: newStatus === 'Cancelled' ? '#e74c3c' : '#2ecc71' }}>{STATUS_LABELS[newStatus] || newStatus}</strong>.
        {IRREVERSIBLE.has(newStatus) && <><br /><span style={{ color: '#e74c3c', fontSize: '0.8rem' }}>⚠ This action cannot be reversed.</span></>}
      </p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button onClick={onCancel} style={{ padding: '9px 20px', borderRadius: '6px', fontSize: '0.83rem', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'var(--cream)', fontWeight: 600 }}>Cancel</button>
        <button onClick={onConfirm} style={{ padding: '9px 20px', borderRadius: '6px', fontSize: '0.83rem', cursor: 'pointer', background: newStatus === 'Cancelled' ? '#e74c3c' : '#c9a84c', border: 'none', color: '#000', fontWeight: 700 }}>Confirm</button>
      </div>
    </div>
  </div>
);

// ─── Main OrderManagement Component ──────────────────────────────────────────

interface OrderManagementProps {
  adminOrders: any[];
  adminOrdersLoading: boolean;
  orderFulfillmentFilter: string;
  orderPaymentFilter: string;
  setOrderFulfillmentFilter: (v: string) => void;
  setOrderPaymentFilter: (v: string) => void;
  fetchAdminOrders: (fulfillment?: string, payment?: string) => void;
  handleUpdateOrderStatus: (orderId: string, payload: { status?: string; payment_status?: string }) => void;
  addToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({
  adminOrders,
  adminOrdersLoading,
  orderFulfillmentFilter,
  orderPaymentFilter,
  setOrderFulfillmentFilter,
  setOrderPaymentFilter,
  fetchAdminOrders,
  handleUpdateOrderStatus,
  addToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ order: any; newStatus: string } | null>(null);

  // Safe array normalization
  const safeAdminOrders = useMemo(() => {
    return Array.isArray(adminOrders) ? adminOrders : (adminOrders as any)?.items || [];
  }, [adminOrders]);

  // Client-side search + date filtering
  const filteredOrders = useMemo(() => {
    let list = safeAdminOrders;
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter((o: any) =>
        o.id?.toLowerCase().includes(q) ||
        o.shippingAddress?.name?.toLowerCase().includes(q) ||
        o.shippingAddress?.phone?.toLowerCase().includes(q) ||
        o.paymentMethod?.toLowerCase().includes(q)
      );
    }
    if (dateFrom) list = list.filter((o: any) => new Date(o.date) >= new Date(dateFrom));
    if (dateTo) list = list.filter((o: any) => new Date(o.date) <= new Date(dateTo + 'T23:59:59'));
    return list;
  }, [safeAdminOrders, searchQuery, dateFrom, dateTo]);

  // KPI counts from full adminOrders list
  const kpis = useMemo(() => {
    const total = safeAdminOrders.length;
    const pending = safeAdminOrders.filter((o: any) => o.status === 'Processing' || o.status === 'Confirmed').length;
    const transit = safeAdminOrders.filter((o: any) => o.status === 'Shipped' || o.status === 'Out_For_Delivery').length;
    const delivered = safeAdminOrders.filter((o: any) => o.status === 'Delivered').length;
    const cancelled = safeAdminOrders.filter((o: any) => o.status === 'Cancelled').length;
    const revenue = safeAdminOrders.filter((o: any) => o.status !== 'Cancelled').reduce((s: number, o: any) => s + (o.total || 0), 0);
    return { total, pending, transit, delivered, cancelled, revenue };
  }, [safeAdminOrders]);

  const handleQuickChange = (order: any, newSt: string) => {
    const currentSt = order.status || 'Processing';
    if (!(ALLOWED_TRANSITIONS[currentSt] || []).includes(newSt)) {
      addToast('error', `Cannot change from "${currentSt}" to "${newSt}".`, 'Invalid Transition');
      return;
    }
    if (IRREVERSIBLE.has(newSt)) {
      setPendingConfirm({ order, newStatus: newSt });
    } else {
      handleUpdateOrderStatus(order.id, { status: newSt });
      addToast('success', `Order ${order.id} → ${STATUS_LABELS[newSt] || newSt}`, 'Status Updated');
    }
  };

  const handleMarkCodPaid = (order: any) => {
    setPendingConfirm({ order, newStatus: '_MARK_PAID' });
  };

  const confirmUpdate = () => {
    if (!pendingConfirm) return;
    const { order, newStatus } = pendingConfirm;
    if (newStatus === '_MARK_PAID') {
      handleUpdateOrderStatus(order.id, { payment_status: 'PAID' });
      addToast('success', `COD marked PAID for ${order.id}`, 'Payment Updated');
    } else {
      handleUpdateOrderStatus(order.id, { status: newStatus });
      addToast('success', `Order ${order.id} → ${STATUS_LABELS[newStatus] || newStatus}`, 'Status Updated');
    }
    setPendingConfirm(null);
  };

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
        <div>
          <span className="section-label">Order Operations</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', color: 'var(--cream)', margin: 0 }}>Order Management</h1>
        </div>
        <button
          onClick={() => fetchAdminOrders(orderFulfillmentFilter, orderPaymentFilter)}
          disabled={adminOrdersLoading}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(201,168,76,0.35)', background: 'rgba(201,168,76,0.08)', color: 'var(--gold)' }}
        >
          {adminOrdersLoading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={15} />}
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px', marginBottom: '26px' }}>
        {[
          { label: 'Total Orders', value: kpis.total, color: '#c9a84c' },
          { label: 'Processing', value: kpis.pending, color: '#3498db' },
          { label: 'In Transit', value: kpis.transit, color: '#f39c12' },
          { label: 'Delivered', value: kpis.delivered, color: '#2ecc71' },
          { label: 'Cancelled', value: kpis.cancelled, color: '#e74c3c' },
          { label: 'Net Revenue', value: `₹${kpis.revenue.toLocaleString('en-IN')}`, color: '#c9a84c', small: true },
        ].map((k) => (
          <div key={k.label} className="glass-panel" style={{ padding: '14px 16px', borderRadius: '10px', borderTop: `2px solid ${k.color}`, border: `1px solid ${k.color}22` }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--grey-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '7px' }}>{k.label}</div>
            <div style={{ fontSize: k.small ? '1rem' : '1.55rem', fontWeight: 700, color: k.color, fontFamily: 'var(--font-display)' }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '18px 22px', marginBottom: '18px', border: '1px solid var(--glass-border)' }}>
        {/* Fulfillment */}
        <div style={{ marginBottom: '14px' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, display: 'block', marginBottom: '9px' }}>Fulfillment Status</span>
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
            {FULFILLMENT_STATUSES.map((st) => {
              const isActive = orderFulfillmentFilter === st;
              const badge = FULFILLMENT_COLORS[st];
              return (
                <button key={st} type="button"
                  onClick={() => { setOrderFulfillmentFilter(st); fetchAdminOrders(st, orderPaymentFilter); }}
                  style={{ padding: '5px 13px', borderRadius: '20px', fontSize: '0.77rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: isActive ? (badge?.bg || 'rgba(201,168,76,0.2)') : 'rgba(255,255,255,0.04)', color: isActive ? (badge?.color || 'var(--gold)') : 'var(--beige)', border: isActive ? `1px solid ${badge?.color || 'var(--gold)'}60` : '1px solid rgba(255,255,255,0.1)' }}>
                  {STATUS_LABELS[st] || st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment */}
        <div style={{ marginBottom: '14px' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, display: 'block', marginBottom: '9px' }}>Payment Status</span>
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
            {PAYMENT_STATUSES.map((ps) => {
              const isActive = orderPaymentFilter === ps;
              const badge = PAYMENT_COLORS[ps];
              return (
                <button key={ps} type="button"
                  onClick={() => { setOrderPaymentFilter(ps); fetchAdminOrders(orderFulfillmentFilter, ps); }}
                  style={{ padding: '5px 13px', borderRadius: '20px', fontSize: '0.77rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: isActive ? (badge?.bg || 'rgba(201,168,76,0.15)') : 'rgba(255,255,255,0.04)', color: isActive ? (badge?.color || 'var(--gold)') : 'var(--beige)', border: isActive ? `1px solid ${badge?.color || 'var(--gold)'}60` : '1px solid rgba(255,255,255,0.1)' }}>
                  {ps}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search + Date range */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--grey-light)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Search by Order ID, customer name or phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', paddingLeft: '34px', paddingRight: searchQuery ? '32px' : '10px', paddingTop: '8px', paddingBottom: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: 'var(--cream)', fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box' }} />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--grey-light)', cursor: 'pointer' }}>
                <X size={13} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)', whiteSpace: 'nowrap' }}>From:</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              style={{ padding: '8px 9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: 'var(--cream)', fontSize: '0.8rem', outline: 'none', colorScheme: 'dark' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)', whiteSpace: 'nowrap' }}>To:</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              style={{ padding: '8px 9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: 'var(--cream)', fontSize: '0.8rem', outline: 'none', colorScheme: 'dark' }} />
          </div>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }}
              style={{ padding: '8px 11px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: '6px', color: '#e74c3c', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results info */}
      <div style={{ marginBottom: '10px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--grey-light)' }}>
          {adminOrdersLoading ? 'Loading...' : `Showing ${filteredOrders.length} of ${adminOrders.length} orders`}
        </span>
      </div>

      {/* Orders Table */}
      <div className="glass-panel" style={{ padding: '0', border: '1px solid var(--glass-border)', overflowX: 'auto', borderRadius: '10px' }}>
        {adminOrdersLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--beige)' }}>
            <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 14px auto', display: 'block' }} />
            <p style={{ margin: 0 }}>Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <Package size={40} color="var(--grey-light)" style={{ margin: '0 auto 14px auto', display: 'block' }} />
            <p style={{ color: 'var(--grey-light)', margin: 0 }}>
              {adminOrders.length === 0 ? 'No orders found.' : 'No orders match the current filters.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {['Order ID & Date', 'Customer', 'Items & Qty', 'Payment Method', 'Payment Status', 'Fulfillment Status', 'Total', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '13px 15px', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--gold)', background: 'rgba(201,168,76,0.05)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((ord: any, idx: number) => {
                const isCod = ord.paymentMethod === 'Cash on Delivery' || ord.paymentMethod === 'COD';
                const currentPs = ord.payment_status || 'PENDING';
                const currentSt = ord.status || 'Processing';
                const allowedNext = ALLOWED_TRANSITIONS[currentSt] || [];
                const fBadge = FULFILLMENT_COLORS[currentSt] || { bg: 'rgba(255,255,255,0.06)', color: 'var(--cream)' };
                const pBadge = PAYMENT_COLORS[currentPs] || { bg: 'rgba(255,255,255,0.06)', color: 'var(--cream)' };
                const isFinal = currentSt === 'Delivered' || currentSt === 'Cancelled';

                return (
                  <tr key={ord.id}
                    style={{ borderBottom: idx < filteredOrders.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.022)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Order ID & Date */}
                    <td style={{ padding: '13px 15px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, color: 'var(--gold)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{ord.id}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--grey-light)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Calendar size={10} />{ord.date}
                      </div>
                    </td>

                    {/* Customer */}
                    <td style={{ padding: '13px 15px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 600, color: 'var(--cream)' }}>{ord.shippingAddress?.name || '—'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--beige)', marginTop: '2px' }}>{ord.shippingAddress?.phone}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--grey-light)' }}>{ord.shippingAddress?.city}, {ord.shippingAddress?.state}</div>
                    </td>

                    {/* Items */}
                    <td style={{ padding: '13px 15px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '175px' }}>
                        {ord.items?.slice(0, 2).map((it: any, i: number) => (
                          <div key={i} style={{ fontSize: '0.77rem', color: 'var(--cream)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.product?.name || 'Product'}</span>
                            <span style={{ color: 'var(--gold)', fontWeight: 700, flexShrink: 0 }}>×{it.quantity}</span>
                          </div>
                        ))}
                        {ord.items?.length > 2 && <div style={{ fontSize: '0.7rem', color: 'var(--grey-light)' }}>+{ord.items.length - 2} more</div>}
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td style={{ padding: '13px 15px', verticalAlign: 'middle' }}>
                      <span style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '0.8rem' }}>{ord.paymentMethod || '—'}</span>
                    </td>

                    {/* Payment Status */}
                    <td style={{ padding: '13px 15px', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: pBadge.bg, color: pBadge.color, border: `1px solid ${pBadge.color}50` }}>
                        {currentPs}
                      </span>
                      {isCod && currentPs === 'PENDING' && (
                        <button type="button" onClick={() => handleMarkCodPaid(ord)}
                          style={{ display: 'block', marginTop: '5px', padding: '2px 9px', fontSize: '0.67rem', background: 'rgba(46,204,113,0.12)', border: '1px solid #2ecc7155', color: '#2ecc71', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          Mark Paid (COD)
                        </button>
                      )}
                    </td>

                    {/* Fulfillment Status */}
                    <td style={{ padding: '13px 15px', verticalAlign: 'middle' }}>
                      <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: fBadge.bg, color: fBadge.color, border: `1px solid ${fBadge.color}50`, marginBottom: isFinal ? 0 : '5px' }}>
                        {STATUS_LABELS[currentSt] || currentSt}
                      </span>
                      {!isFinal && allowedNext.length > 0 && (
                        <select value="" onChange={(e) => { if (e.target.value) handleQuickChange(ord, e.target.value); }}
                          style={{ display: 'block', width: '100%', padding: '4px 7px', background: 'rgba(0,0,0,0.35)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '4px', fontSize: '0.73rem', cursor: 'pointer', outline: 'none' }}>
                          <option value="">→ Change to...</option>
                          {allowedNext.map((st) => (
                            <option key={st} value={st}>{STATUS_LABELS[st] || st}</option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Total */}
                    <td style={{ padding: '13px 15px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.92rem' }}>₹{ord.total?.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--grey-light)', marginTop: '2px' }}>
                        {ord.items?.reduce((s: number, i: any) => s + i.quantity, 0)} item(s)
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '13px 15px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <button onClick={() => setViewingOrder(ord)}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '5px 11px', borderRadius: '5px', fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--gold)', whiteSpace: 'nowrap' }}>
                          <Eye size={12} /> View Order
                        </button>
                        <a href={`http://localhost:8000/api/v1/orders/${ord.id}/invoice`} target="_blank" rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '5px 11px', borderRadius: '5px', fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--cream)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                          <FileText size={12} /> Invoice
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Detail Modal */}
      {viewingOrder && (
        <OrderDetailModal
          order={viewingOrder}
          onClose={() => setViewingOrder(null)}
          onUpdateStatus={handleUpdateOrderStatus}
          addToast={addToast}
        />
      )}

      {/* Quick Confirm Dialog */}
      {pendingConfirm && (
        <QuickConfirmDialog
          orderId={pendingConfirm.order.id}
          newStatus={pendingConfirm.newStatus}
          onConfirm={confirmUpdate}
          onCancel={() => setPendingConfirm(null)}
        />
      )}
    </>
  );
};

export default OrderManagement;
