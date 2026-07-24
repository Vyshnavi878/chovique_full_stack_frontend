import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../app/providers';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';

export const RegisterPage: React.FC = () => {
  const { verifyOtp } = useApp();
  const navigate = useNavigate();

  // Step state: 'DETAILS' -> 'OTP'
  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS');

  // Credentials State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // OTP Verification State
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const [successInfo, setSuccessInfo] = useState('');

  // UI State
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 30-Second Countdown Timer for OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (step === 'OTP' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timeLeft]);



  // Password Strength calculation
  const [strengthScore, setStrengthScore] = useState(0);
  const [strengthText, setStrengthText] = useState('');

  useEffect(() => {
    if (password.length === 0) {
      setStrengthScore(0);
      setStrengthText('');
      return;
    }
    if (password.length < 5) {
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
    else if (score === 4) setStrengthText('Strong & Luxurious');
  }, [password]);

  const getStrengthColor = () => {
    if (strengthScore === 1) return '#e74c3c';
    if (strengthScore === 2) return '#f39c12';
    if (strengthScore === 3) return '#f1c40f';
    if (strengthScore === 4) return '#2ecc71';
    return 'rgba(255,255,255,0.1)';
  };

  // Phase 1 Submit: Validate & Send OTP via SMTP
  const handleSendOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessInfo('');

    if (name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (confirmPassword !== password) {
      setError('Passwords do not match.');
      return;
    }
    if (!termsAccepted) {
      setError('You must accept the Terms and Conditions.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.sendOtp({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });
      setStep('OTP');
      setTimeLeft(response.expires_in || 30);
      setSuccessInfo(`6-digit OTP sent to ${email.trim()}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Phase 2 Submit: Verify 6-digit OTP
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessInfo('');

    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Please enter a valid 6-digit numerical OTP code.');
      return;
    }
    if (timeLeft === 0) {
      setError('OTP has expired (30s duration). Please click "Resend OTP" below.');
      return;
    }

    setIsLoading(true);
    const result = await verifyOtp(email.trim(), otp.trim(), name.trim(), password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Invalid or expired OTP. Please try again.');
      return;
    }

    navigate('/');
  };

  // Resend OTP Action
  const handleResendOtp = async () => {
    setError('');
    setSuccessInfo('');
    setIsResending(true);
    try {
      const response = await authService.resendOtp(email.trim());
      setTimeLeft(response.expires_in || 30);
      setOtp('');
      setSuccessInfo(`Fresh OTP code sent to ${email.trim()}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend OTP.';
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Back Link */}
        {step === 'OTP' ? (
          <button
            type="button"
            onClick={() => {
              setStep('DETAILS');
              setError('');
              setSuccessInfo('');
            }}
            className="back-to-store-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} />
            Edit Registration Details
          </button>
        ) : (
          <Link to="/" className="back-to-store-link">
            <ArrowLeft size={16} />
            Back to Store
          </Link>
        )}

        {/* Header */}
        <div className="auth-header">
          <h2 className="auth-title">
            {step === 'DETAILS' ? 'Create Account' : 'Email Verification'}
          </h2>
          <p className="auth-subtitle">
            {step === 'DETAILS'
              ? 'Join the Chovique Circle'
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        {/* Global Error Banner */}
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
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{error}</span>
          </div>
        )}

        {/* Global Info/Success Banner */}
        {successInfo && (
          <div
            style={{
              background: 'rgba(46, 204, 113, 0.1)',
              border: '1px solid #2ecc71',
              color: '#2ecc71',
              borderRadius: '4px',
              padding: '10px 14px',
              fontSize: '0.85rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CheckCircle2 size={16} />
            <span>{successInfo}</span>
          </div>
        )}

        {/* STEP 1: Registration Details Form */}
        {step === 'DETAILS' && (
          <form onSubmit={handleSendOtpSubmit} noValidate>
            <Input
              label="Full Name"
              placeholder="Your Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              required
              autoComplete="name"
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError('');
              }}
              required
              autoComplete="new-password"
            />

            {/* Password Strength UI */}
            {password.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'var(--beige)',
                    marginBottom: '6px',
                  }}
                >
                  <span>Password Strength</span>
                  <span style={{ color: getStrengthColor(), fontWeight: 600 }}>{strengthText}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="strength-bar-segment"
                      style={{
                        background: idx < strengthScore ? getStrengthColor() : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="form-checkbox-row" style={{ justifyContent: 'flex-start' }}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <span style={{ fontSize: '0.82rem' }}>
                  I accept the <a href="#" style={{ color: 'var(--gold)' }}>Terms of Service</a> &{' '}
                  <a href="#" style={{ color: 'var(--gold)' }}>Privacy Policy</a>
                </span>
              </label>
            </div>

            <Button
              variant="gold"
              fullWidth
              size="lg"
              type="submit"
              glow
              disabled={isLoading}
              style={{ gap: '10px' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Sending Verification OTP...
                </>
              ) : (
                <>
                  <Mail size={18} />
                  Submit & Send OTP
                </>
              )}
            </Button>
          </form>
        )}

        {/* STEP 2: Inline 6-Digit OTP Verification Form */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtpSubmit} noValidate>
            <div
              style={{
                background: 'rgba(201, 168, 76, 0.08)',
                border: '1px solid var(--gold)',
                borderRadius: '6px',
                padding: '12px 16px',
                marginBottom: '20px',
                fontSize: '0.85rem',
                color: 'var(--beige)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={18} style={{ color: 'var(--gold)' }} />
                <span>Verification code sent to <strong>{email}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('DETAILS');
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold)',
                  fontSize: '0.8rem',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                }}
              >
                Change
              </button>
            </div>

            {/* 6-Digit OTP Input */}
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  color: 'var(--beige)',
                  marginBottom: '8px',
                  fontWeight: 500,
                }}
              >
                Enter 6-Digit OTP Code
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(cleaned);
                    if (error) setError('');
                  }}
                  placeholder="• • • • • •"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '1.5rem',
                    letterSpacing: '12px',
                    textAlign: 'center',
                    fontWeight: 700,
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: timeLeft > 0 ? '1px solid var(--gold)' : '1px solid #e74c3c',
                    borderRadius: '6px',
                    color: 'var(--gold)',
                    outline: 'none',
                    boxShadow: '0 0 10px rgba(201, 168, 76, 0.15)',
                  }}
                />
              </div>
            </div>

            {/* 30-Second Countdown & Resend Option */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                fontSize: '0.85rem',
              }}
            >
              {timeLeft > 0 ? (
                <div style={{ color: '#E5C158', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <KeyRound size={16} />
                  <span>OTP expires in <strong>{timeLeft}s</strong></span>
                </div>
              ) : (
                <div style={{ color: '#e74c3c', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚠️ OTP Expired (0s)</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={timeLeft > 0 || isResending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: timeLeft === 0 ? 'var(--gold)' : 'var(--grey-light)',
                  cursor: timeLeft === 0 && !isResending ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: timeLeft > 0 ? 0.5 : 1,
                  textDecoration: timeLeft === 0 ? 'underline' : 'none',
                }}
              >
                {isResending ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Resending...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    Resend OTP
                  </>
                )}
              </button>
            </div>

            <Button
              variant="gold"
              fullWidth
              size="lg"
              type="submit"
              glow
              disabled={isLoading || otp.length < 6 || timeLeft === 0}
              style={{ gap: '10px' }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Verifying OTP...
                </>
              ) : (
                'Verify & Complete Registration'
              )}
            </Button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--grey-light)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--gold)', fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
