import React, { useState } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  KeyRound,
  Check,
  X,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useApp } from '../../app/providers';

export const ChangePasswordView: React.FC = () => {
  const { logout } = useApp();

  // Form Fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Visibility Toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status & Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Password Validation Checklist Checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(newPassword);
  const isMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid =
    currentPassword.length > 0 &&
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    isMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!isFormValid) {
      setErrorMsg('Please ensure all password security requirements are met.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await adminService.changeAdminPassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccessMsg(res.message || 'Password changed successfully! Logging out for security...');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Security policy requirement: Invalidate session & prompt re-login
      setTimeout(() => {
        logout();
      }, 2500);
    } catch (err: any) {
      console.error('Failed to change admin password:', err);
      setErrorMsg(err?.detail || err?.message || 'Failed to change password. Please verify current password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', paddingBottom: '48px', color: '#f5efe6' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '28px' }}>
        <span style={{ color: 'rgba(201, 168, 76, 0.85)', fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
          — SECURITY &amp; CREDENTIALS
        </span>
        <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '2.4rem', color: '#f5efe6', fontWeight: 700, margin: 0 }}>
          Change Password
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '6px 0 0 0' }}>
          Update your account password securely using strong encryption policies
        </p>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div
          style={{
            marginBottom: '24px',
            padding: '16px 20px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid rgba(46, 204, 113, 0.3)',
            background: 'rgba(46, 204, 113, 0.12)',
            color: '#2ecc71',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div
          style={{
            marginBottom: '24px',
            padding: '16px 20px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid rgba(231, 76, 60, 0.3)',
            background: 'rgba(231, 76, 60, 0.12)',
            color: '#e74c3c',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '28px' }}>
        {/* Main Change Password Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'rgba(20, 16, 13, 0.85)',
            border: '1px solid rgba(201, 168, 76, 0.2)',
            borderRadius: '14px',
            padding: '32px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
          }}
        >
          <h3 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.15rem', color: '#f5efe6', margin: '0 0 24px 0', borderBottom: '1px solid rgba(201, 168, 76, 0.15)', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={18} color="#c9a84c" />
            Update Password Credentials
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Current Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#c9a84c', fontWeight: 600, marginBottom: '8px' }}>
                Current Password <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    background: 'rgba(10, 8, 6, 0.8)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    color: '#f5efe6',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <Lock size={18} color="rgba(201, 168, 76, 0.7)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}
                  aria-label="Toggle Current Password Visibility"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#c9a84c', fontWeight: 600, marginBottom: '8px' }}>
                New Password <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    background: 'rgba(10, 8, 6, 0.8)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    color: '#f5efe6',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <Lock size={18} color="rgba(201, 168, 76, 0.7)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}
                  aria-label="Toggle New Password Visibility"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#c9a84c', fontWeight: 600, marginBottom: '8px' }}>
                Confirm New Password <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    background: 'rgba(10, 8, 6, 0.8)',
                    border: confirmPassword && !isMatch ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '8px',
                    color: '#f5efe6',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <Lock size={18} color="rgba(201, 168, 76, 0.7)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 0 }}
                  aria-label="Toggle Confirm Password Visibility"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword.length > 0 && !isMatch && (
                <span style={{ fontSize: '0.78rem', color: '#e74c3c', marginTop: '4px', display: 'block' }}>
                  Passwords do not match.
                </span>
              )}
            </div>

            {/* Submit Button */}
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                style={{
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 50%, #c9a84c 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#0f0c0a',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(201, 168, 76, 0.3)',
                  opacity: isSubmitting || !isFormValid ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Updating Password...
                  </>
                ) : (
                  <>
                    <KeyRound size={18} /> Update Password
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Live Password Rules Checklist */}
        <div
          style={{
            background: 'rgba(20, 16, 13, 0.85)',
            border: '1px solid rgba(201, 168, 76, 0.2)',
            borderRadius: '14px',
            padding: '24px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            height: 'fit-content',
          }}
        >
          <h4 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.05rem', color: '#f5efe6', margin: '0 0 16px 0', borderBottom: '1px solid rgba(201, 168, 76, 0.15)', paddingBottom: '10px' }}>
            Password Policy
          </h4>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: hasMinLength ? '#2ecc71' : 'rgba(255,255,255,0.5)' }}>
              {hasMinLength ? <Check size={16} color="#2ecc71" /> : <X size={16} color="rgba(255,255,255,0.3)" />}
              <span>At least 8 characters</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: hasUppercase ? '#2ecc71' : 'rgba(255,255,255,0.5)' }}>
              {hasUppercase ? <Check size={16} color="#2ecc71" /> : <X size={16} color="rgba(255,255,255,0.3)" />}
              <span>One uppercase letter (A-Z)</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: hasLowercase ? '#2ecc71' : 'rgba(255,255,255,0.5)' }}>
              {hasLowercase ? <Check size={16} color="#2ecc71" /> : <X size={16} color="rgba(255,255,255,0.3)" />}
              <span>One lowercase letter (a-z)</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: hasNumber ? '#2ecc71' : 'rgba(255,255,255,0.5)' }}>
              {hasNumber ? <Check size={16} color="#2ecc71" /> : <X size={16} color="rgba(255,255,255,0.3)" />}
              <span>One number (0-9)</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: hasSpecial ? '#2ecc71' : 'rgba(255,255,255,0.5)' }}>
              {hasSpecial ? <Check size={16} color="#2ecc71" /> : <X size={16} color="rgba(255,255,255,0.3)" />}
              <span>One special character (!@#$...)</span>
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: isMatch ? '#2ecc71' : 'rgba(255,255,255,0.5)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', marginTop: '4px' }}>
              {isMatch ? <Check size={16} color="#2ecc71" /> : <X size={16} color="rgba(255,255,255,0.3)" />}
              <span>Passwords match</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordView;
