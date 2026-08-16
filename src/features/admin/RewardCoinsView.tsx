import React, { useState, useEffect } from 'react';
import { Check, Plus, AlertCircle, Edit2, ShieldCheck, Coins, Award, Percent } from 'lucide-react';
import { walletService, RewardSettings } from '../../services/walletService';
import { Button } from '../../components/ui/Button';

const DEFAULT_SETTINGS: RewardSettings = {
  reward_system_enabled: true,
  spend_per_coin: 10,
  coins_per_rupee: 10,
  max_redemption_percentage: 20,
};

export const RewardCoinsView: React.FC = () => {
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Settings State
  const [settings, setSettings] = useState<RewardSettings>(DEFAULT_SETTINGS);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);

  // Fetch Settings
  useEffect(() => {
    loadRewardSettings();
  }, []);

  const loadRewardSettings = async () => {
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
  };

  // Save Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await walletService.updateRewardSettings(settings);
      showNotification('success', 'Reward System rules saved successfully!');
      setShowRuleForm(false);
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to save reward settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', paddingBottom: '48px', color: '#f5efe6' }}>
      {/* Header & Breadcrumb section */}
      {showRuleForm ? (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--beige)', marginBottom: '10px' }}>
            <span style={{ cursor: 'pointer', color: 'var(--gold)' }} onClick={() => setShowRuleForm(false)}>
              Reward Coins System
            </span>
            <span>&gt;</span>
            <span style={{ color: 'var(--cream)' }}>Configure Earning &amp; Redemption Rules</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '2.4rem', color: '#f5efe6', fontWeight: 700, margin: 0 }}>
            Configure Earning &amp; Redemption Rules
          </h1>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <span style={{ color: 'rgba(201, 168, 76, 0.85)', fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              — LOYALTY PROGRAM
            </span>
            <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '2.4rem', color: '#f5efe6', fontWeight: 700, margin: 0 }}>
              Reward Coins System
            </h1>
          </div>
          <Button
            variant="gold"
            glow
            onClick={() => setShowRuleForm(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 600 }}
          >
            <Plus size={18} />
            ADD REWARD RULE
          </Button>
        </div>
      )}

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

      {/* Main View Mode */}
      {!showRuleForm ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Active Rules Summary Panel */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ color: '#c9a84c', fontSize: '1.25rem', fontFamily: 'var(--font-display, serif)', fontWeight: 600, margin: 0 }}>
                  Active Reward Rules
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  Current rules for automated reward coin generation and checkout redemption limits
                </p>
              </div>
              <Button
                variant="glass"
                onClick={() => setShowRuleForm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '8px 16px' }}
              >
                <Edit2 size={14} /> Edit Rules
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              {/* Card 1: System Status */}
              <div style={{ background: 'rgba(10, 8, 6, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <ShieldCheck size={20} color="#c9a84c" />
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>System Status</span>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: settings.reward_system_enabled ? '#2ecc71' : '#e74c3c' }}>
                  {settings.reward_system_enabled ? 'Active & Enabled' : 'Disabled'}
                </div>
              </div>

              {/* Card 2: Earning Rate */}
              <div style={{ background: 'rgba(10, 8, 6, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Coins size={20} color="#c9a84c" />
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Earning Rate</span>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f5efe6' }}>
                  1 Coin / ₹{settings.spend_per_coin}
                </div>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: '4px', display: 'block' }}>
                  Customer earns 1 coin per ₹{settings.spend_per_coin} spent
                </span>
              </div>

              {/* Card 3: Redemption Value */}
              <div style={{ background: 'rgba(10, 8, 6, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Award size={20} color="#c9a84c" />
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Redemption Value</span>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f5efe6' }}>
                  {settings.coins_per_rupee} Coins = ₹1
                </div>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: '4px', display: 'block' }}>
                  {settings.coins_per_rupee} coins yield ₹1 discount at checkout
                </span>
              </div>

              {/* Card 4: Max Order Cap */}
              <div style={{ background: 'rgba(10, 8, 6, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Percent size={20} color="#c9a84c" />
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Max Order Cap</span>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f5efe6' }}>
                  {settings.max_redemption_percentage}%
                </div>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: '4px', display: 'block' }}>
                  Max redemption allowed per order
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Configuration Form View */
        <div
          style={{
            background: 'rgba(20, 16, 13, 0.85)',
            border: '1px solid rgba(201, 168, 76, 0.2)',
            borderRadius: '12px',
            padding: '28px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
            maxWidth: '680px',
          }}
        >
          <h2 style={{ color: '#c9a84c', fontSize: '1.25rem', fontFamily: 'var(--font-display, serif)', fontWeight: 600, margin: '0 0 24px 0' }}>
            System Earning &amp; Redemption Rules
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

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowRuleForm(false)}
                style={{
                  padding: '12px 20px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#f5efe6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingSettings}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 50%, #c9a84c 100%)',
                  color: '#0f0c0a',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: isSavingSettings ? 'not-allowed' : 'pointer',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  fontSize: '0.85rem',
                  boxShadow: '0 4px 16px rgba(201,168,76,0.3)',
                  opacity: isSavingSettings ? 0.6 : 1,
                }}
              >
                {isSavingSettings ? 'SAVING RULES...' : 'SAVE REWARD RULES'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
