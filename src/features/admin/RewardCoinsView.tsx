import React, { useState, useEffect } from 'react';
import { Check, Search, ChevronDown, User, AlertCircle, RefreshCw } from 'lucide-react';
import { walletService, RewardSettings } from '../../services/walletService';
import { adminService } from '../../services/adminService';

interface CustomerOption {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  reward_coins: number;
}

interface RecentAdjustment {
  id: string;
  date: string;
  customer_name: string;
  customer_email?: string;
  coins: number;
  reason: string;
  performed_by: string;
}

const DEFAULT_SETTINGS: RewardSettings = {
  reward_system_enabled: true,
  spend_per_coin: 10,
  coins_per_rupee: 10,
  max_redemption_percentage: 20,
};

const INITIAL_HISTORY: RecentAdjustment[] = [
  {
    id: '1',
    date: '2025-08-11',
    customer_name: 'Vyahnavi Gampa',
    coins: 100,
    reason: 'Customer goodwill',
    performed_by: 'Admin',
  },
  {
    id: '2',
    date: '2025-08-10',
    customer_name: 'Rahul Sharma',
    coins: -50,
    reason: 'Order cancellation',
    performed_by: 'Admin',
  },
  {
    id: '3',
    date: '2025-08-08',
    customer_name: 'Priya Mehta',
    coins: 50,
    reason: 'Promo bonus',
    performed_by: 'Admin',
  },
];

export const RewardCoinsView: React.FC = () => {
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Settings State
  const [settings, setSettings] = useState<RewardSettings>(DEFAULT_SETTINGS);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Customer Adjustment State
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [coinsAdjustment, setCoinsAdjustment] = useState<string>('100');
  const [reason, setReason] = useState<string>('Customer goodwill');
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

  // History State
  const [history, setHistory] = useState<RecentAdjustment[]>(INITIAL_HISTORY);

  // Fetch Settings & History
  useEffect(() => {
    loadRewardData();
    loadCustomers();
  }, []);

  const loadRewardData = async () => {
    try {
      const res = await walletService.getRewardSettings();
      if (res) {
        setSettings({
          reward_system_enabled: res.reward_system_enabled ?? true,
          spend_per_coin: res.spend_per_coin ?? 10,
          coins_per_rupee: res.coins_per_rupee ?? 10,
          max_redemption_percentage: res.max_redemption_percentage ?? 20,
        });
      }
    } catch (err) {
      console.warn('Using default reward settings:', err);
    }

    // Load history
    try {
      const hist = await walletService.getRewardHistory(20);
      if (hist && hist.length > 0) {
        const formatted: RecentAdjustment[] = hist.map((h: any, index: number) => ({
          id: h.id || String(index),
          date: h.date || new Date().toISOString().split('T')[0],
          customer_name: h.customer_name || 'Customer',
          customer_email: h.customer_email || '',
          coins: h.coins || 0,
          reason: h.reason || 'Admin Adjustment',
          performed_by: h.performed_by || 'Admin',
        }));
        setHistory(formatted);
      }
    } catch (err) {
      console.warn('Using default reward history:', err);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await adminService.getCustomers({ limit: 100 });
      if (res && res.customers) {
        const mapped: CustomerOption[] = res.customers.map((c: any) => ({
          id: c.id,
          full_name: c.full_name || 'Unnamed Customer',
          email: c.email || '',
          phone: c.phone || '',
          reward_coins: c.reward_coins || 0,
        }));
        setCustomers(mapped);
      }
    } catch (err) {
      console.warn('Failed to load customers for reward dropdown:', err);
    }
  };

  // Save Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await walletService.updateRewardSettings(settings);
      showNotification('success', 'Reward System rules saved successfully!');
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to save reward settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Coin Adjustment Submit Handler
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      showNotification('error', 'Please select a customer first.');
      return;
    }

    const val = parseInt(coinsAdjustment, 10);
    if (isNaN(val) || val === 0) {
      showNotification('error', 'Please enter a valid non-zero coin adjustment amount.');
      return;
    }

    if (!reason.trim()) {
      showNotification('error', 'Please enter a reason or note for this adjustment.');
      return;
    }

    setIsSubmittingAdjustment(true);
    try {
      await walletService.adminAdjustCoins(selectedCustomer.id, val, reason.trim());
      showNotification('success', `Adjusted ${val > 0 ? `+${val}` : val} coins for ${selectedCustomer.full_name}!`);

      // Add to local history list
      const newEntry: RecentAdjustment = {
        id: String(Date.now()),
        date: new Date().toISOString().split('T')[0],
        customer_name: selectedCustomer.full_name,
        customer_email: selectedCustomer.email,
        coins: val,
        reason: reason.trim(),
        performed_by: 'Admin',
      };
      setHistory((prev) => [newEntry, ...prev]);

      // Reset form
      setCoinsAdjustment('100');
      setReason('Customer goodwill');
      setSelectedCustomer(null);
      setCustomerSearch('');
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to submit coin adjustment.');
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  // Filter Customers for Dropdown
  const filteredCustomers = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  return (
    <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', paddingBottom: '48px', color: '#f5efe6' }}>
      {/* Eyebrow & Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{ color: 'rgba(201, 168, 76, 0.85)', fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
          — LOYALTY PROGRAM
        </span>
        <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '2.4rem', color: '#f5efe6', fontWeight: 700, margin: 0 }}>
          Reward Coins System
        </h1>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          style={{
            marginBottom: '24px',
            padding: '14px 20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: notification.type === 'success' ? '1px solid rgba(46, 204, 113, 0.3)' : '1px solid rgba(231, 76, 60, 0.3)',
            background: notification.type === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
            color: notification.type === 'success' ? '#2ecc71' : '#e74c3c',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          {notification.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '28px', alignItems: 'flex-start', marginBottom: '32px' }}>
        {/* Left Card: System Rules */}
        <div
          style={{
            background: 'rgba(20, 16, 13, 0.85)',
            border: '1px solid rgba(201, 168, 76, 0.2)',
            borderRadius: '12px',
            padding: '28px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <h2 style={{ color: '#c9a84c', fontSize: '1.25rem', fontFamily: 'var(--font-display, serif)', fontWeight: 600, margin: '0 0 24px 0' }}>
            System Earning & Redemption Rules
          </h2>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Enable Reward System Switch */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(10, 8, 6, 0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
              }}
            >
              <span style={{ color: '#f5efe6', fontSize: '0.9rem', fontWeight: 600 }}>Enable Reward System</span>
              <div
                onClick={() => setSettings({ ...settings, reward_system_enabled: !settings.reward_system_enabled })}
                style={{
                  width: '46px',
                  height: '24px',
                  borderRadius: '12px',
                  background: settings.reward_system_enabled ? '#c9a84c' : 'rgba(255,255,255,0.15)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#0f0c0a',
                    position: 'absolute',
                    top: '3px',
                    left: settings.reward_system_enabled ? '25px' : '3px',
                    transition: 'all 0.2s ease',
                  }}
                />
              </div>
            </div>

            {/* Input 1: Spent per 1 coin */}
            <div>
              <label style={{ color: '#c9a84c', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                ₹ Spent per 1 Coin Earned
              </label>
              <input
                type="number"
                min="1"
                value={settings.spend_per_coin}
                onChange={(e) => setSettings({ ...settings, spend_per_coin: parseFloat(e.target.value) || 1 })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(10, 8, 6, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f5efe6',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', marginTop: '6px', margin: '6px 0 0 0' }}>
                Example: 10 means customer earns 1 coin for every ₹10 spent.
              </p>
            </div>

            {/* Input 2: Coins per Rupee */}
            <div>
              <label style={{ color: '#c9a84c', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Coins Needed for ₹1 Discount
              </label>
              <input
                type="number"
                min="1"
                value={settings.coins_per_rupee}
                onChange={(e) => setSettings({ ...settings, coins_per_rupee: parseFloat(e.target.value) || 1 })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(10, 8, 6, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f5efe6',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', marginTop: '6px', margin: '6px 0 0 0' }}>
                Example: 10 coins = ₹1 discount value.
              </p>
            </div>

            {/* Input 3: Max redemption limit */}
            <div>
              <label style={{ color: '#c9a84c', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Maximum Order Redemption Limit (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.max_redemption_percentage}
                onChange={(e) => setSettings({ ...settings, max_redemption_percentage: parseFloat(e.target.value) || 1 })}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(10, 8, 6, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f5efe6',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', marginTop: '6px', margin: '6px 0 0 0' }}>
                Example: coins can pay up to max 20% of order value.
              </p>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isSavingSettings}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 50%, #c9a84c 100%)',
                color: '#0f0c0a',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                fontSize: '0.85rem',
                marginTop: '10px',
                boxShadow: '0 4px 16px rgba(201,168,76,0.3)',
                opacity: isSavingSettings ? 0.6 : 1,
              }}
            >
              {isSavingSettings ? 'SAVING RULES...' : 'SAVE REWARD RULES'}
            </button>
          </form>
        </div>

        {/* Right Card: Manual Customer Coin Adjustment */}
        <div
          style={{
            background: 'rgba(20, 16, 13, 0.85)',
            border: '1px solid rgba(201, 168, 76, 0.2)',
            borderRadius: '12px',
            padding: '28px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <h2 style={{ color: '#c9a84c', fontSize: '1.25rem', fontFamily: 'var(--font-display, serif)', fontWeight: 600, margin: '0 0 24px 0' }}>
            Manual Customer Coin Adjustment
          </h2>

          <form onSubmit={handleAdjustmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Select Customer Custom Dropdown */}
            <div style={{ position: 'relative' }}>
              <label style={{ color: '#c9a84c', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Select Customer
              </label>

              <div
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(10, 8, 6, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: selectedCustomer ? '#f5efe6' : 'rgba(255, 255, 255, 0.45)',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                {selectedCustomer ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <User size={16} color="#c9a84c" />
                    <span style={{ fontWeight: 600, color: '#f5efe6' }}>{selectedCustomer.full_name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>({selectedCustomer.email})</span>
                  </div>
                ) : (
                  <span>Search customer by name, email or phone...</span>
                )}
                <ChevronDown size={18} color="rgba(255,255,255,0.45)" />
              </div>

              {/* Dropdown Panel */}
              {isDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    marginTop: '6px',
                    background: '#14100d',
                    border: '1px solid rgba(201, 168, 76, 0.3)',
                    borderRadius: '8px',
                    boxShadow: '0 12px 36px rgba(0,0,0,0.8)',
                    maxHeight: '240px',
                    overflowY: 'auto',
                  }}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px', background: '#0a0806' }}>
                    <Search size={16} color="rgba(255,255,255,0.45)" />
                    <input
                      type="text"
                      placeholder="Type name, email, phone..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: '#f5efe6', fontSize: '0.85rem', outline: 'none' }}
                      autoFocus
                    />
                  </div>

                  <div>
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => {
                            setSelectedCustomer(cust);
                            setIsDropdownOpen(false);
                          }}
                          style={{
                            padding: '10px 16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,168,76,0.1)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f5efe6' }}>{cust.full_name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>{cust.email} • {cust.phone}</div>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: '#c9a84c', fontWeight: 700 }}>
                            {cust.reward_coins} Coins
                          </span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>
                        No customers found.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedCustomer && (
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#c9a84c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={14} />
                  <span>Selected: <strong>{selectedCustomer.full_name}</strong> (Current Balance: {selectedCustomer.reward_coins} Coins)</span>
                </div>
              )}
            </div>

            {/* Coins Adjustment (+ or -) */}
            <div>
              <label style={{ color: '#c9a84c', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Coins Adjustment (+ or -)
              </label>
              <input
                type="number"
                value={coinsAdjustment}
                onChange={(e) => setCoinsAdjustment(e.target.value)}
                placeholder="e.g., 100 or -50"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(10, 8, 6, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f5efe6',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', marginTop: '6px', margin: '6px 0 0 0' }}>
                Positive for crediting coins (+100), negative for deducting (-50).
              </p>
            </div>

            {/* Reason / Note */}
            <div>
              <label style={{ color: '#c9a84c', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Reason / Note
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Customer goodwill"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(10, 8, 6, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f5efe6',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            {/* Submit Adjustment Button */}
            <button
              type="submit"
              disabled={isSubmittingAdjustment}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 50%, #c9a84c 100%)',
                color: '#0f0c0a',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                fontSize: '0.85rem',
                marginTop: '10px',
                boxShadow: '0 4px 16px rgba(201,168,76,0.3)',
                opacity: isSubmittingAdjustment ? 0.6 : 1,
              }}
            >
              {isSubmittingAdjustment ? 'PROCESSING ADJUSTMENT...' : 'SUBMIT ADJUSTMENT'}
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Card: Recent Coin Adjustments Table */}
      <div
        style={{
          background: 'rgba(20, 16, 13, 0.85)',
          border: '1px solid rgba(201, 168, 76, 0.2)',
          borderRadius: '12px',
          padding: '28px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ color: '#c9a84c', fontSize: '1.25rem', fontFamily: 'var(--font-display, serif)', fontWeight: 600, margin: 0 }}>
            Recent Coin Adjustments
          </h2>
          <div
            onClick={loadRewardData}
            style={{
              color: '#c9a84c',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} /> View All
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#c9a84c', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 16px' }}>Date</th>
                <th style={{ padding: '12px 16px' }}>Customer</th>
                <th style={{ padding: '12px 16px' }}>Coins</th>
                <th style={{ padding: '12px 16px' }}>Reason</th>
                <th style={{ padding: '12px 16px' }}>By</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr
                  key={row.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#f5efe6', fontSize: '0.88rem' }}
                >
                  <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', fontSize: '0.82rem' }}>
                    {row.date}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                    {row.customer_name}
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, fontFamily: 'monospace', color: row.coins >= 0 ? '#2ecc71' : '#e74c3c' }}>
                    {row.coins >= 0 ? `+${row.coins}` : row.coins}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.85)' }}>
                    {row.reason}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem' }}>
                    {row.performed_by}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
