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
    if (password.length < 6) {
      setStrengthScore(1);
      setStrengthText('Weak');
      return;
    }

    let score = 1;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    setStrengthScore(score);

    if (score === 2) setStrengthText('Fair');
    else if (score === 3) setStrengthText('Good');
    else if (score === 4) setStrengthText('Strong & Secure');
  }, [password]);

  const getStrengthColor = () => {
    if (strengthScore === 1) return '#e74c3c';
    if (strengthScore === 2) return '#f39c12';
    if (strengthScore === 3) return '#f1c40f';
    if (strengthScore === 4) return '#2ecc71';
    return 'rgba(255,255,255,0.1)';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
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
    <div
      className="auth-page-container"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        background: 'radial-gradient(circle at center, rgba(59,30,8,0.5) 0%, rgba(10,10,10,0.95) 100%)',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '40px',
          border: '1px solid var(--glass-border)',
          background: 'rgba(26, 13, 0, 0.75)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(201, 168, 76, 0.15)',
              border: '1px solid var(--gold)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold)',
              marginBottom: '16px',
            }}
          >
            <ShieldCheck size={28} />
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem',
              color: 'var(--cream)',
              margin: '0 0 8px 0',
            }}
          >
            Set Account Password
          </h1>
          <p style={{ color: 'var(--grey-light)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
            Welcome to Chovique! Create a password to enable direct email & password sign-ins in addition to Google.
          </p>

          {user && (
            <div
              style={{
                marginTop: '12px',
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '20px',
                display: 'inline-block',
                fontSize: '0.8rem',
                color: 'var(--gold)',
              }}
            >
              Logged in as <strong>{user.email}</strong>
            </div>
          )}
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={48} style={{ color: '#2ecc71', margin: '0 auto 16px' }} />
            <h3 style={{ color: 'var(--cream)', fontSize: '1.2rem', marginBottom: '8px' }}>
              Password Set Successfully!
            </h3>
            <p style={{ color: 'var(--grey-light)', fontSize: '0.85rem' }}>
              Redirecting you to your account...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(231, 76, 60, 0.15)',
                  border: '1px solid #e74c3c',
                  color: '#e74c3c',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            <div>
              <Input
                label="New Password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPasswordState(e.target.value)}
                required
              />

              {password.length > 0 && (
                <div style={{ marginTop: '8px' }}>
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
                  <span style={{ fontSize: '0.75rem', color: getStrengthColor(), marginTop: '4px', display: 'block' }}>
                    Password Strength: {strengthText}
                  </span>
                </div>
              )}
            </div>

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPasswordState(e.target.value)}
              required
            />

            <Button variant="gold" size="lg" type="submit" glow disabled={isLoading}>
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
                padding: '6px',
              }}
            >
              Skip for now (I will use Google Login)
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
