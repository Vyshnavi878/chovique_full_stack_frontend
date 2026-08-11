import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  Loader2,
  FileText,
  Eye,
  Edit2,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  ShoppingBag,
  Clock,
  Lock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { SystemUser } from '../../types';

interface CustomerDirectoryProps {
  systemUsers: SystemUser[];
  adminOrders: any[];
  addToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
  onRefreshUsers?: () => void;
}

// ─── Validation Helpers ───────────────────────────────────────────────────────

const validateFullName = (name: string): string | null => {
  if (!name || !name.trim()) return 'Full Name is required and cannot be empty.';
  if (name.trim().length < 2) return 'Full Name must be at least 2 characters long.';
  return null;
};

const validateEmail = (email: string): string | null => {
  if (!email || !email.trim()) return 'Email is required.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return 'Please enter a valid email address.';
  return null;
};

const validatePhone = (phone: string): string | null => {
  if (!phone || !phone.trim()) return 'Phone number is required.';
  // Supports Indian (+91 9876543210, 9876543210, 09876543210) & International formats
  const phoneRegex = /^(\+91[\-\s]?)?[0]?[6-9]\d{9}$|^\+?[0-9\s\-()]{7,15}$/;
  if (!phoneRegex.test(phone.trim())) {
    return 'Please enter a valid phone number (e.g. +91 9876543210 or 9876543210).';
  }
  return null;
};

const validateAddress = (address: string): string | null => {
  if (!address || !address.trim()) return 'Address is required.';
  if (address.trim().length < 5) return 'Address must be at least 5 characters long.';
  return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const CustomerDirectory: React.FC<CustomerDirectoryProps> = ({
  systemUsers,
  adminOrders,
  addToast,
  onRefreshUsers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Inspector & detail loading states
  const [customerDetails, setCustomerDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'coins' | 'tickets'>('profile');

  // Edit Modal State
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'toggle_status' | 'delete';
    customer: any;
    title: string;
    message: string;
  } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Filter customers list
  const customersList = useMemo(() => {
    return systemUsers.filter((u) => u.role === 'customer');
  }, [systemUsers]);

  const filteredCustomers = useMemo(() => {
    let list = customersList;

    if (statusFilter === 'ACTIVE') {
      list = list.filter((c: any) => c.is_active !== false);
    } else if (statusFilter === 'INACTIVE') {
      list = list.filter((c: any) => c.is_active === false);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [customersList, statusFilter, searchQuery]);

  // Automatically select the first customer when list changes
  useEffect(() => {
    if (filteredCustomers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(filteredCustomers[0].id);
    }
  }, [filteredCustomers, selectedCustomerId]);

  // Fetch full details when selected customer changes
  useEffect(() => {
    if (!selectedCustomerId) return;
    setLoadingDetails(true);
    adminService
      .getCustomerDetails(selectedCustomerId)
      .then((details) => {
        setCustomerDetails(details);
      })
      .catch((err) => {
        console.error('Failed to load customer details:', err);
        setCustomerDetails(null);
      })
      .finally(() => {
        setLoadingDetails(false);
      });
  }, [selectedCustomerId]);

  const handleSelectCustomer = (cust: SystemUser) => {
    setSelectedCustomerId(cust.id);
  };

  // Open Edit Profile Modal
  const openEditModal = (cust: any, details?: any) => {
    const p = details?.user?.profile || {};
    const addr = p.address
      ? [p.address.street, p.address.city, p.address.state, p.address.zip].filter(Boolean).join(', ')
      : '';

    setEditingCustomer(cust);
    setEditForm({
      full_name: cust.name || '',
      email: cust.email || '',
      phone: p.phone || cust.phone || '',
      address: addr || '12, Luxury Lane, Bangalore',
      is_active: cust.is_active !== false,
    });
    setFormErrors({});
  };

  // Save Edit Profile with Validation
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const nameErr = validateFullName(editForm.full_name);
    if (nameErr) errors.full_name = nameErr;

    const emailErr = validateEmail(editForm.email);
    if (emailErr) errors.email = emailErr;

    const phoneErr = validatePhone(editForm.phone);
    if (phoneErr) errors.phone = phoneErr;

    const addrErr = validateAddress(editForm.address);
    if (addrErr) errors.address = addrErr;

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      addToast('error', 'Please fix all inline validation errors before saving.', 'Validation Error');
      return;
    }

    setIsSaving(true);
    try {
      const updatedDetails = await adminService.updateCustomer(editingCustomer.id, {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        is_active: editForm.is_active,
      });

      setCustomerDetails(updatedDetails);
      addToast('success', `Customer profile for "${editForm.full_name.trim()}" updated successfully!`, 'Profile Updated');
      setEditingCustomer(null);
      if (onRefreshUsers) onRefreshUsers();
    } catch (err: any) {
      addToast('error', err?.detail || err?.message || 'Failed to update customer profile.', 'Error');
    } finally {
      setIsSaving(false);
    }
  };

  // Initiate Toggle Active/Ban confirmation
  const initiateToggleStatus = (cust: any) => {
    const isCurrentlyActive = cust.is_active !== false;
    setConfirmDialog({
      type: 'toggle_status',
      customer: cust,
      title: isCurrentlyActive ? 'Deactivate Customer Account' : 'Activate Customer Account',
      message: isCurrentlyActive
        ? `Are you sure you want to deactivate ${cust.name}'s account? They will not be able to log in or place orders.`
        : `Are you sure you want to reactivate ${cust.name}'s account?`,
    });
  };

  // Initiate Delete Customer confirmation
  const initiateDeleteCustomer = (cust: any) => {
    setConfirmDialog({
      type: 'delete',
      customer: cust,
      title: 'Delete Customer Account',
      message: `WARNING: Are you sure you want to permanently delete customer "${cust.name}" (${cust.email})? This action CANNOT be undone.`,
    });
  };

  // Execute confirmed action
  const executeConfirmAction = async () => {
    if (!confirmDialog) return;
    setIsConfirming(true);
    const { type, customer } = confirmDialog;

    try {
      if (type === 'toggle_status') {
        const newStatus = !(customer.is_active !== false);
        const updated = await adminService.updateCustomer(customer.id, { is_active: newStatus });
        setCustomerDetails(updated);
        addToast(
          'success',
          `Customer ${customer.name} is now ${newStatus ? 'Active' : 'Inactive'}.`,
          'Status Changed'
        );
      } else if (type === 'delete') {
        await adminService.deleteCustomer(customer.id);
        addToast('success', `Customer ${customer.name} deleted permanently.`, 'Customer Deleted');
        setSelectedCustomerId(null);
      }
      if (onRefreshUsers) onRefreshUsers();
      setConfirmDialog(null);
    } catch (err: any) {
      addToast('error', err?.detail || err?.message || 'Action failed.', 'Error');
    } finally {
      setIsConfirming(false);
    }
  };

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalCust = customersList.length;
    const activeCust = customersList.filter((c: any) => c.is_active !== false).length;
    const totalOrdersCount = adminOrders.length;
    const totalRevenue = adminOrders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return { totalCust, activeCust, totalOrdersCount, totalRevenue };
  }, [customersList, adminOrders]);

  const selectedCust = useMemo(() => {
    return customersList.find((c) => c.id === selectedCustomerId) || null;
  }, [customersList, selectedCustomerId]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefreshUsers) {
        await onRefreshUsers();
      }
      if (selectedCustomerId) {
        setLoadingDetails(true);
        const details = await adminService.getCustomerDetails(selectedCustomerId);
        setCustomerDetails(details);
        setLoadingDetails(false);
      }
      addToast('info', 'Customer directory & profiles refreshed.', 'Refreshed');
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      {/* ── Section Header ─────────────────────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <span className="section-label">Access &amp; Customers</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', color: 'var(--cream)', margin: 0 }}>
            Customer Directory
          </h1>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 16px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              border: '1px solid rgba(201,168,76,0.35)',
              background: 'rgba(201,168,76,0.08)',
              color: 'var(--gold)',
              opacity: isRefreshing ? 0.7 : 1,
            }}
          >
            <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Directory'}
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Customers', value: summaryMetrics.totalCust, color: '#c9a84c' },
          { label: 'Active Accounts', value: summaryMetrics.activeCust, color: '#2ecc71' },
          { label: 'Total Orders Placed', value: summaryMetrics.totalOrdersCount, color: '#3498db' },
          { label: 'Lifetime Customer Spend', value: `₹${summaryMetrics.totalRevenue.toLocaleString('en-IN')}`, color: '#c9a84c', isCurrency: true },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="glass-panel"
            style={{ padding: '16px 18px', border: `1px solid ${kpi.color}25`, borderRadius: '10px', borderTop: `2px solid ${kpi.color}` }}
          >
            <div style={{ fontSize: '0.68rem', color: 'var(--grey-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: kpi.isCurrency ? '1.15rem' : '1.6rem', fontWeight: 700, color: kpi.color, fontFamily: 'var(--font-display)' }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Split View ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'flex-start' }}>

        {/* ── LEFT PANEL: Directory List & Search ──────────────────── */}
        <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
          
          {/* Search bar & Status filter pills */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--grey-light)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '36px',
                  paddingRight: searchQuery ? '36px' : '12px',
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px',
                  color: 'var(--cream)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--grey-light)', cursor: 'pointer', padding: '2px' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: statusFilter === st ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.04)',
                    color: statusFilter === st ? 'var(--gold)' : 'var(--beige)',
                    border: statusFilter === st ? '1px solid rgba(201,168,76,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {st === 'ALL' ? 'All Customers' : st === 'ACTIVE' ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div style={{ fontSize: '0.78rem', color: 'var(--grey-light)', marginBottom: '14px' }}>
            Showing {filteredCustomers.length} of {customersList.length} customer profiles
          </div>

          {/* List of Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '680px', overflowY: 'auto', paddingRight: '4px' }}>
            {filteredCustomers.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--grey-light)' }}>
                <User size={36} color="var(--grey-light)" style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>No matching customers found.</p>
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = selectedCustomerId === cust.id;
                const custOrders = adminOrders.filter(
                  (o) =>
                    o.user_id === cust.id ||
                    (o.shippingAddress?.name && o.shippingAddress.name.toLowerCase() === cust.name.toLowerCase())
                );
                const totalSpent = custOrders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + (o.total || 0), 0);
                const isActive = cust.is_active !== false;

                const initials = cust.name
                  ? cust.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase()
                  : 'CU';

                return (
                  <div
                    key={cust.id}
                    onClick={() => handleSelectCustomer(cust)}
                    style={{
                      padding: '16px 18px',
                      background: isSelected ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.03)',
                      border: isSelected ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.07)',
                      borderRadius: '9px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      {/* Avatar */}
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #2b1810 0%, #100a06 100%)',
                          color: 'var(--gold)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          border: '1px solid rgba(201,168,76,0.4)',
                          flexShrink: 0,
                        }}
                      >
                        {initials}
                      </div>

                      {/* Name & Contact Info */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ margin: 0, color: 'var(--cream)', fontSize: '0.95rem', fontWeight: 600 }}>
                            {cust.name}
                          </h4>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              background: isActive ? 'rgba(46,204,113,0.15)' : 'rgba(231,76,60,0.15)',
                              color: isActive ? '#2ecc71' : '#e74c3c',
                              border: `1px solid ${isActive ? '#2ecc71' : '#e74c3c'}40`,
                            }}
                          >
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--grey-light)', marginTop: '2px' }}>
                          {cust.email}
                        </div>
                      </div>
                    </div>

                    {/* Spend & Orders summary */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
                        ₹{totalSpent.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--grey-light)', marginTop: '2px' }}>
                        {custOrders.length} order{custOrders.length === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL: Customer Inspector & Details ─────────────── */}
        <div>
          {loadingDetails ? (
            <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', display: 'block', color: 'var(--gold)' }} />
              <p style={{ color: 'var(--beige)', margin: 0 }}>Loading customer profile...</p>
            </div>
          ) : selectedCust ? (
            <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
              
              {/* Header profile card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #c9a84c 0%, #8a7028 100%)',
                      color: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.1rem',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {selectedCust.name
                      ? selectedCust.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()
                      : 'CU'}
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--cream)', margin: 0 }}>
                      {selectedCust.name}
                    </h2>
                    <div style={{ fontSize: '0.78rem', color: 'var(--grey-light)', marginTop: '2px' }}>
                      Customer since {customerDetails?.joined_date || 'Aug 2024'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => openEditModal(selectedCust, customerDetails)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '7px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: 'rgba(201,168,76,0.12)',
                      border: '1px solid rgba(201,168,76,0.3)',
                      color: 'var(--gold)',
                    }}
                  >
                    <Edit2 size={13} /> Edit Profile
                  </button>
                  <button
                    onClick={() => initiateToggleStatus(selectedCust)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: selectedCust.is_active !== false ? 'rgba(231,76,60,0.1)' : 'rgba(46,204,113,0.1)',
                      border: selectedCust.is_active !== false ? '1px solid rgba(231,76,60,0.3)' : '1px solid rgba(46,204,113,0.3)',
                      color: selectedCust.is_active !== false ? '#e74c3c' : '#2ecc71',
                    }}
                  >
                    {selectedCust.is_active !== false ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => initiateDeleteCustomer(selectedCust)}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      background: 'rgba(231,76,60,0.15)',
                      border: '1px solid rgba(231,76,60,0.4)',
                      color: '#e74c3c',
                    }}
                    title="Delete customer account"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Inspector Quick Stats Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--grey-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Total Orders</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--cream)', fontFamily: 'var(--font-display)' }}>
                    {customerDetails?.total_orders || 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--grey-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Total Spent</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
                    ₹{(customerDetails?.total_spent || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--grey-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Reward Coins</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f39c12', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Award size={16} color="#f39c12" /> {customerDetails?.reward_coins || 0}
                  </div>
                </div>
              </div>

              {/* Inspector Navigation Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px', gap: '4px' }}>
                {[
                  { id: 'profile', label: 'Profile Info', icon: User },
                  { id: 'orders', label: `Order History (${customerDetails?.recent_orders?.length || 0})`, icon: ShoppingBag },
                  { id: 'coins', label: 'Reward Coins', icon: Award },
                  { id: 'tickets', label: `Support (${customerDetails?.support_tickets?.length || 0})`, icon: HelpCircle },
                ].map((t) => {
                  const IconComp = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '10px 14px',
                        background: 'none',
                        border: 'none',
                        borderBottom: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                        color: isActive ? 'var(--gold)' : 'var(--beige)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <IconComp size={14} /> {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: Profile Info */}
              {activeTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                    <User size={16} color="var(--gold)" />
                    <div>
                      <span style={{ color: 'var(--grey-light)', fontSize: '0.72rem', display: 'block' }}>Full Name</span>
                      <strong style={{ color: 'var(--cream)' }}>{selectedCust.name}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                    <Mail size={16} color="var(--gold)" />
                    <div>
                      <span style={{ color: 'var(--grey-light)', fontSize: '0.72rem', display: 'block' }}>Email Address</span>
                      <strong style={{ color: 'var(--cream)' }}>{selectedCust.email}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                    <Phone size={16} color="var(--gold)" />
                    <div>
                      <span style={{ color: 'var(--grey-light)', fontSize: '0.72rem', display: 'block' }}>Phone Number</span>
                      <strong style={{ color: 'var(--cream)' }}>
                        {customerDetails?.user?.profile?.phone || selectedCust.phone || 'Not provided'}
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                    <MapPin size={16} color="var(--gold)" />
                    <div>
                      <span style={{ color: 'var(--grey-light)', fontSize: '0.72rem', display: 'block' }}>Delivery Address</span>
                      <strong style={{ color: 'var(--cream)' }}>
                        {customerDetails?.user?.profile?.address?.street
                          ? `${customerDetails.user.profile.address.street}, ${customerDetails.user.profile.address.city}, ${customerDetails.user.profile.address.state} ${customerDetails.user.profile.address.zip}`
                          : '12, Luxury Lane, Indiranagar, Bangalore, Karnataka 560038'}
                      </strong>
                    </div>
                  </div>

                  {/* Password Security Notice */}
                  <div style={{ padding: '14px', background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '6px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Lock size={18} color="var(--gold)" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: '0.78rem', color: 'var(--beige)', lineHeight: 1.5 }}>
                      <strong>Security Policy:</strong> Admins cannot modify customer passwords directly. Customers must use the automated self-service Password Reset flow.
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Order History */}
              {activeTab === 'orders' && (
                <div>
                  {!customerDetails?.recent_orders || customerDetails.recent_orders.length === 0 ? (
                    <p style={{ color: 'var(--grey-light)', padding: '20px', textAlign: 'center', margin: 0, fontSize: '0.85rem' }}>
                      No orders placed by this customer yet.
                    </p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--gold)', textAlign: 'left' }}>
                            <th style={{ padding: '8px' }}>Order ID</th>
                            <th style={{ padding: '8px' }}>Date</th>
                            <th style={{ padding: '8px' }}>Amount</th>
                            <th style={{ padding: '8px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerDetails.recent_orders.map((ord: any) => (
                            <tr key={ord.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '10px 8px', color: 'var(--gold)', fontWeight: 700, fontFamily: 'monospace' }}>
                                {ord.id}
                              </td>
                              <td style={{ padding: '10px 8px', color: 'var(--beige)' }}>{ord.date}</td>
                              <td style={{ padding: '10px 8px', color: 'var(--cream)', fontWeight: 700 }}>₹{ord.total?.toLocaleString('en-IN')}</td>
                              <td style={{ padding: '10px 8px' }}>
                                <span style={{
                                  padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700,
                                  background: ord.status === 'Delivered' ? 'rgba(46,204,113,0.15)' : ord.status === 'Cancelled' ? 'rgba(231,76,60,0.15)' : 'rgba(201,168,76,0.15)',
                                  color: ord.status === 'Delivered' ? '#2ecc71' : ord.status === 'Cancelled' ? '#e74c3c' : 'var(--gold)',
                                }}>
                                  {ord.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Reward Coins */}
              {activeTab === 'coins' && (
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <Award size={32} color="#f39c12" />
                    <div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f39c12', fontFamily: 'var(--font-display)' }}>
                        {customerDetails?.reward_coins || 0} CHOVIQUE Coins
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--grey-light)' }}>
                        Redeemable Value: ₹{((customerDetails?.reward_coins || 0) / 10).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--beige)', lineHeight: 1.6, margin: 0 }}>
                    Reward coins are earned on eligible purchases (1 coin per ₹10 spent). Customers can redeem up to 20% of order totals using coins.
                  </p>
                </div>
              )}

              {/* Tab 4: Support History */}
              {activeTab === 'tickets' && (
                <div>
                  {!customerDetails?.support_tickets || customerDetails.support_tickets.length === 0 ? (
                    <p style={{ color: 'var(--grey-light)', padding: '20px', textAlign: 'center', margin: 0, fontSize: '0.85rem' }}>
                      No support tickets created by this customer.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {customerDetails.support_tickets.map((ticket: any) => (
                        <div key={ticket.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold)' }}>{ticket.category}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--grey-light)' }}>{ticket.date}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--cream)', margin: 0 }}>{ticket.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <User size={40} color="var(--grey-light)" style={{ margin: '0 auto 16px', display: 'block' }} />
              <p style={{ color: 'var(--beige)', margin: 0, fontSize: '0.9rem' }}>Select a customer from the left directory to inspect profile and history.</p>
            </div>
          )}
        </div>

      </div>

      {/* ── EDIT PROFILE MODAL (With Strict Validation) ─────────────── */}
      {editingCustomer && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setEditingCustomer(null); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', backdropFilter: 'blur(6px)',
          }}
        >
          <div
            style={{
              background: '#0e0a06',
              border: '1px solid rgba(201,168,76,0.35)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '520px',
              padding: '30px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '2px', display: 'block' }}>Customer Management</span>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--cream)', margin: 0 }}>Edit Customer Profile</h3>
              </div>
              <button onClick={() => setEditingCustomer(null)} style={{ background: 'none', border: 'none', color: 'var(--rose-gold)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold)', marginBottom: '6px' }}>
                  Full Name <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => {
                    setEditForm({ ...editForm, full_name: e.target.value });
                    if (formErrors.full_name) setFormErrors({ ...formErrors, full_name: '' });
                  }}
                  placeholder="e.g. Vyshnavi Gampa"
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: formErrors.full_name ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '6px', color: 'var(--cream)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {formErrors.full_name && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.full_name}</span>}
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold)', marginBottom: '6px' }}>
                  Email Address <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => {
                    setEditForm({ ...editForm, email: e.target.value });
                    if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                  }}
                  placeholder="e.g. vyshnavi@gmail.com"
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: formErrors.email ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '6px', color: 'var(--cream)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {formErrors.email && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.email}</span>}
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold)', marginBottom: '6px' }}>
                  Phone Number <span style={{ color: '#e74c3c' }}>*</span> (Accepts +91 or standard phone format)
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => {
                    setEditForm({ ...editForm, phone: e.target.value });
                    if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                  }}
                  placeholder="e.g. +91 9876543210 or 9876543210"
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: formErrors.phone ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '6px', color: 'var(--cream)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
                  }}
                />
                {formErrors.phone && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.phone}</span>}
              </div>

              {/* Address */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold)', marginBottom: '6px' }}>
                  Delivery Address <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  value={editForm.address}
                  onChange={(e) => {
                    setEditForm({ ...editForm, address: e.target.value });
                    if (formErrors.address) setFormErrors({ ...formErrors, address: '' });
                  }}
                  placeholder="Street, City, State, ZIP code"
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: formErrors.address ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '6px', color: 'var(--cream)', fontSize: '0.85rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  }}
                />
                {formErrors.address && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.address}</span>}
              </div>

              {/* Password notice */}
              <div style={{ fontSize: '0.74rem', color: 'var(--grey-light)', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                <Lock size={13} color="var(--gold)" /> Direct password edit disabled for admin security.
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  style={{ padding: '9px 18px', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'var(--cream)', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{ padding: '9px 20px', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer', background: 'var(--gradient-gold)', border: 'none', color: '#000', fontWeight: 700 }}
                >
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONFIRMATION MODAL FOR DESTRUCTIVE ACTIONS ─────────────── */}
      {confirmDialog && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9500,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', backdropFilter: 'blur(6px)',
          }}
        >
          <div
            style={{
              background: '#0e0a06',
              border: '1px solid rgba(231,76,60,0.4)',
              borderRadius: '12px',
              padding: '34px',
              maxWidth: '440px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <AlertTriangle size={42} color="#e74c3c" style={{ margin: '0 auto 16px', display: 'block' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--cream)', marginBottom: '12px' }}>
              {confirmDialog.title}
            </h3>
            <p style={{ color: 'var(--beige)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '24px' }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmDialog(null)}
                style={{ padding: '9px 20px', borderRadius: '6px', fontSize: '0.83rem', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'var(--cream)', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmAction}
                disabled={isConfirming}
                style={{ padding: '9px 20px', borderRadius: '6px', fontSize: '0.83rem', cursor: 'pointer', background: '#e74c3c', border: 'none', color: '#fff', fontWeight: 700 }}
              >
                {isConfirming ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerDirectory;
