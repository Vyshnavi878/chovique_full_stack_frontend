import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { KeyRound, Loader2, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../../app/providers';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const SetPasswordPage: React.FC = () => {
  const { user, setPassword } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Location state can pass destination 'from'
  const from = (location.state as { from?: string })?.from || '/dashboard';

  const [password, setPasswordState] = useState('');
  const [confirmPassword, setConfirmPasswordState] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password strength score
  const [strengthScore, setStrengthScore] = useState(0);
  const [strengthText, setStrengthText] = useState('');

  useEffect(() => {
    if (password.length === 0) {
      setStrengthScore(0);
      setStrengthText('');
      return;
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const displayScore = score === 0 ? 0 : score <= 2 ? 1 : score === 3 ? 2 : score === 4 ? 3 : 4;
    setStrengthScore(displayScore);

    if (displayScore === 1) setStrengthText('Weak');
    else if (displayScore === 2) setStrengthText('Fair');
    else if (displayScore === 3) setStrengthText('Good');
    else if (displayScore === 4) setStrengthText('Strong & Secure');
  }, [password]);

  const getStrengthColor = () => {
    if (strengthScore === 1) return '#e74c3c';
    if (strengthScore === 2) return '#f39c12';
    if (strengthScore === 3) return '#f1c40f';
    if (strengthScore === 4) return '#2ecc71';
    return 'rgba(255,255,255,0.1)';
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!password) {
      errors.password = 'New Password is required.';
    } else if (password.length < 8) {
      errors.password = 'New Password must be at least 8 characters long.';
    } else if (!/[A-Z]/.test(password)) {
      errors.password = 'New Password must include at least one uppercase letter (A-Z).';
    } else if (!/[a-z]/.test(password)) {
      errors.password = 'New Password must include at least one lowercase letter (a-z).';
    } else if (!/[0-9]/.test(password)) {
      errors.password = 'New Password must include at least one number (0-9).';
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      errors.password = 'New Password must include at least one special character (!@#$%^&*).';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password.';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    const result = await setPassword(password, confirmPassword);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Failed to set password. Please try again.');
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      navigate(from, { replace: true });
    }, 1500);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(201, 168, 76, 0.15)',
              border: '1px solid var(--gold)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold)',
              marginBottom: '14px',
            }}
          >
            {success ? <CheckCircle2 size={26} style={{ color: '#2ecc71' }} /> : <ShieldCheck size={26} />}
          </div>
          <h2 className="auth-title">Set Account Password</h2>
          <p className="auth-subtitle">
            {success
              ? 'Password set successfully!'
              : 'Create a password for your Chovique account'}
          </p>
          {user && !success && (
            <div
              style={{
                marginTop: '10px',
                padding: '5px 12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '20px',
                display: 'inline-block',
                fontSize: '0.8rem',
                color: 'var(--gold)',
              }}
            >
              Signed in as <strong>{user.email}</strong>
            </div>
          )}
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
            <CheckCircle2 size={48} style={{ color: '#2ecc71', margin: '0 auto 16px' }} />
            <h3 style={{ color: 'var(--cream)', fontSize: '1.2rem', marginBottom: '8px' }}>
              Password Set Successfully!
            </h3>
            <p style={{ color: 'var(--grey-light)', fontSize: '0.85rem' }}>
              Redirecting you to your account...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {error && (
              <div
                role="alert"
                style={{
                  background: 'rgba(231, 76, 60, 0.1)',
                  border: '1px solid #e74c3c',
                  color: '#e74c3c',
                  borderRadius: '4px',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  marginBottom: '12px',
                }}
              >
                {error}
              </div>
            )}

            <Input
              label="New Password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              error={fieldErrors.password}
              onChange={(e) => {
                setPasswordState(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: '' }));
                }
                if (error) setError('');
              }}
              required
              autoComplete="new-password"
            />

            {/* Password Strength Meter */}
            <div style={{ marginBottom: '16px', marginTop: '-6px' }}>
              {password.length > 0 && (
                <div style={{ marginBottom: '6px' }}>
                  <div
                    style={{
                      height: '4px',
                      width: '100%',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${(strengthScore / 4) * 100}%`,
                        background: getStrengthColor(),
                        transition: 'all 0.3s ease',
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: '0.73rem',
                      color: getStrengthColor(),
                      marginTop: '4px',
                      display: 'block',
                    }}
                  >
                    Password Strength: {strengthText}
                  </span>
                </div>
              )}
              <p style={{ fontSize: '0.75rem', color: 'var(--grey-light)', margin: 0 }}>
                Must be at least 8 characters with uppercase (A-Z), lowercase (a-z), number (0-9), and special character.
              </p>
            </div>

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              error={fieldErrors.confirmPassword}
              onChange={(e) => {
                setConfirmPasswordState(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }
                if (error) setError('');
              }}
              required
              autoComplete="new-password"
            />

            <Button
              variant="gold"
              fullWidth
              size="lg"
              type="submit"
              glow
              disabled={isLoading}
              style={{ gap: '10px', marginTop: '8px' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Saving Password...
                </>
              ) : (
                <>
                  Set Password & Continue <ArrowRight size={18} />
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => navigate(from, { replace: true })}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--grey-light)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'center',
                textDecoration: 'underline',
                padding: '8px',
                marginTop: '4px',
              }}
            >
              Skip for now (I will use Google Login)
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--grey-light)' }}>
          <KeyRound size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle', color: 'var(--gold)' }} />
          This enables email & password sign-in alongside Google.
        </p>
      </div>
    </div>
  );
};

export default SetPasswordPage;
