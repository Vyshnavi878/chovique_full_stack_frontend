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
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { Pagination } from '../../components/ui/Pagination';

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
  onRefresh: () => void;
}> = ({ order, onClose, onUpdateStatus, addToast, onRefresh }) => {
  const [confirmPayload, setConfirmPayload] = useState<{ status?: string; payment_status?: string } | null>(null);
  const [confirmMsg, setConfirmMsg] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const isCod = order.paymentMethod === 'Cash on Delivery' || order.paymentMethod === 'COD';
  const currentSt = order.status || 'Processing';
  const currentPs = order.payment_status || 'PENDING';
  const allowedNext = ALLOWED_TRANSITIONS[currentSt] || [];

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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '12px', border: '1px solid var(--gold)', background: 'rgba(18,10,5,0.96)', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Order Details</span>
            <h2 style={{ fontFamily: 'monospace', fontSize: '1.4rem', color: 'var(--cream)', margin: 0 }}>{order.id}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--beige)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--grey-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Customer Info</div>
            <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '0.9rem' }}>{order.shippingAddress?.name || 'Customer'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--beige)' }}>{order.shippingAddress?.phone}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--beige)' }}>{order.shippingAddress?.email || order.user_email}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--grey-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Shipping Address</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--cream)' }}>
              {order.shippingAddress?.address}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode || order.shippingAddress?.pincode}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '10px' }}>Order Items</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {order.items?.map((it: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--cream)', fontWeight: 600 }}>{it.product?.name || 'Product'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>Qty: {it.quantity} × ₹{it.price}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.9rem' }}>₹{(it.quantity * it.price).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--grey-light)', marginBottom: '4px' }}>
              Status: <StatusBadge status={currentSt} map={FULFILLMENT_COLORS} />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>
              Payment: <StatusBadge status={currentPs} map={PAYMENT_COLORS} />
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>Total Amount</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>₹{order.total?.toLocaleString()}</div>
          </div>
        </div>

        {allowedNext.length > 0 && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '10px' }}>
              Update Fulfillment Status:
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {allowedNext.map((st) => (
                <button
                  key={st}
                  disabled={isUpdating}
                  onClick={() => initiateStatusChange(st)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: st === 'Cancelled' ? 'rgba(231,76,60,0.15)' : 'rgba(201,168,76,0.15)',
                    color: st === 'Cancelled' ? '#e74c3c' : 'var(--gold)',
                    border: st === 'Cancelled' ? '1px solid rgba(231,76,60,0.4)' : '1px solid var(--gold)',
                  }}
                >
                  Mark as {STATUS_LABELS[st] || st}
                </button>
              ))}
              {isCod && currentPs === 'PENDING' && (
                <button
                  disabled={isUpdating}
                  onClick={initiateCodPaid}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: 'rgba(46,204,113,0.15)',
                    color: '#2ecc71',
                    border: '1px solid rgba(46,204,113,0.4)',
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
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ orderId, newStatus, onConfirm, onCancel }) => (
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
          onClick={onCancel}
          style={{ padding: '9px 20px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--cream)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          style={{ padding: '9px 20px', background: 'var(--gold)', border: 'none', color: '#000', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
        >
          Confirm
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
    } finally {
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

      <div className="glass-panel" style={{ padding: '18px 22px', marginBottom: '18px', border: '1px solid var(--glass-border)' }}>
        <div style={{ marginBottom: '14px' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, display: 'block', marginBottom: '9px' }}>Fulfillment Status</span>
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

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--grey-light)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Search by Order ID, customer name or phone..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              style={{ width: '100%', paddingLeft: '34px', paddingRight: searchQuery ? '32px' : '10px', paddingTop: '8px', paddingBottom: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: 'var(--cream)', fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box' }} />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setPage(1); }} style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--grey-light)', cursor: 'pointer' }}>
                <X size={13} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)', whiteSpace: 'nowrap' }}>From:</span>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              style={{ padding: '8px 9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: 'var(--cream)', fontSize: '0.8rem', outline: 'none', colorScheme: 'dark' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)', whiteSpace: 'nowrap' }}>To:</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              style={{ padding: '8px 9px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: 'var(--cream)', fontSize: '0.8rem', outline: 'none', colorScheme: 'dark' }} />
          </div>
          {(dateFrom || dateTo || searchQuery || fulfillmentFilter !== 'ALL' || paymentFilter !== 'ALL') && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); setSearchQuery(''); setFulfillmentFilter('ALL'); setPaymentFilter('ALL'); setPage(1); }}
              style={{ padding: '8px 11px', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: '6px', color: '#e74c3c', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>
              Reset Filters
            </button>
          )}
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
                    <td style={{ padding: '13px 15px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, color: 'var(--gold)', fontFamily: 'monospace', fontSize: '0.78rem' }}>{ord.id}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--grey-light)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Calendar size={10} />{ordDate}
                      </div>
                    </td>
                    <td style={{ padding: '13px 15px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 600, color: 'var(--cream)' }}>{ord.shippingAddress?.name || ord.name || '—'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--beige)', marginTop: '2px' }}>{ord.shippingAddress?.phone}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--grey-light)' }}>{ord.shippingAddress?.city}{ord.shippingAddress?.state ? `, ${ord.shippingAddress?.state}` : ''}</div>
                    </td>
                    <td style={{ padding: '13px 15px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '175px' }}>
                        {ord.items?.slice(0, 2).map((it: any, i: number) => (
                          <div key={i} style={{ fontSize: '0.77rem', color: 'var(--cream)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', flexShrink: 0 }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.product?.name || 'Product'}</span>
                            <span style={{ color: 'var(--gold)', fontWeight: 700, flexShrink: 0 }}>×{it.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '13px 15px', verticalAlign: 'middle' }}>
                      <span style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '0.8rem' }}>{ord.paymentMethod || '—'}</span>
                    </td>
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
                    <td style={{ padding: '13px 15px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.92rem' }}>₹{ord.total?.toLocaleString('en-IN')}</div>
                    </td>
                    <td style={{ padding: '13px 15px', verticalAlign: 'middle' }}>
                      <button onClick={() => setViewingOrder(ord)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '5px 11px', borderRadius: '5px', fontSize: '0.73rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: 'var(--gold)', whiteSpace: 'nowrap' }}>
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
          onConfirm={confirmUpdate}
          onCancel={() => setPendingConfirm(null)}
        />
      )}
    </>
  );
};

export default OrderManagement;
