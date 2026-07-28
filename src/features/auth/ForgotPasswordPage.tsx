import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, RefreshCw, KeyRound, CheckCircle2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Step: 'EMAIL' -> 'RESET' -> 'SUCCESS'
  const [step, setStep] = useState<'EMAIL' | 'RESET' | 'SUCCESS'>('EMAIL');

  // Input states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI / Feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState('');

  // 30-Second OTP Timer
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (step === 'RESET' && timeLeft > 0) {
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

  // Password Strength score
  const [strengthScore, setStrengthScore] = useState(0);
  const [strengthText, setStrengthText] = useState('');

  useEffect(() => {
    if (newPassword.length === 0) {
      setStrengthScore(0);
      setStrengthText('');
      return;
    }
    if (newPassword.length < 6) {
      setStrengthScore(1);
      setStrengthText('Weak');
      return;
    }

    let score = 1;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    setStrengthScore(score);

    if (score === 2) setStrengthText('Fair');
    else if (score === 3) setStrengthText('Good');
    else if (score === 4) setStrengthText('Strong & Secure');
  }, [newPassword]);

  const getStrengthColor = () => {
    if (strengthScore === 1) return '#e74c3c';
    if (strengthScore === 2) return '#f39c12';
    if (strengthScore === 3) return '#f1c40f';
    if (strengthScore === 4) return '#2ecc71';
    return 'rgba(255,255,255,0.1)';
  };

  // Step 1: Send Forgot Password OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessInfo('');

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(email.trim());
      setSuccessInfo(res.message || 'OTP sent successfully to your email.');
      if (res.dev_otp) {
        setOtp(res.dev_otp);
      }
      setStep('RESET');
      setTimeLeft(30);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send password reset OTP.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (timeLeft > 0 || isResending) return;
    setError('');
    setIsResending(true);
    try {
      const res = await authService.resendForgotOtp(email);
      setSuccessInfo(res.message || 'A new 6-digit OTP code has been sent to your email.');
      if (res.dev_otp) {
        setOtp(res.dev_otp);
      }
      setTimeLeft(30);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend OTP.';
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp.trim() || otp.trim().length < 4) {
      setError('Please enter the verification code sent to your email.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(email, otp.trim(), newPassword, confirmPassword);
      setStep('SUCCESS');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password reset failed. Please check your OTP.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
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
        <Link
          to="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--gold)',
            fontSize: '0.85rem',
            marginBottom: '24px',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={16} /> Back to Login
        </Link>

        {step === 'EMAIL' && (
          <div>
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
                <KeyRound size={28} />
              </div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.8rem',
                  color: 'var(--cream)',
                  margin: '0 0 8px 0',
                }}
              >
                Reset Password
              </h1>
              <p style={{ color: 'var(--grey-light)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                Enter your registered email address and we will send you an OTP code to reset your password.
              </p>
            </div>

            {error && (
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(231, 76, 60, 0.15)',
                  border: '1px solid #e74c3c',
                  color: '#e74c3c',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  marginBottom: '20px',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Input
                label="Registered Email Address"
                type="email"
                placeholder="connoisseur@chovique.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button variant="gold" size="lg" type="submit" glow disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Sending Reset Code...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </Button>
            </form>
          </div>
        )}

        {step === 'RESET' && (
          <div>
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
                <Mail size={28} />
              </div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.8rem',
                  color: 'var(--cream)',
                  margin: '0 0 8px 0',
                }}
              >
                Verification & New Password
              </h1>
              <p style={{ color: 'var(--grey-light)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                Enter the 6-digit OTP code sent to <strong>{email}</strong> and create your new password.
              </p>
            </div>

            {successInfo && (
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(46, 204, 113, 0.15)',
                  border: '1px solid #2ecc71',
                  color: '#2ecc71',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={16} /> {successInfo}
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '12px',
                  background: 'rgba(231, 76, 60, 0.15)',
                  border: '1px solid #e74c3c',
                  color: '#e74c3c',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  marginBottom: '20px',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Input
                label="6-Digit Verification Code (OTP)"
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.trim())}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--grey-light)' }}>
                  {timeLeft > 0 ? `Resend OTP in ${timeLeft}s` : "Didn't get the code?"}
                </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={timeLeft > 0 || isResending}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: timeLeft > 0 || isResending ? 'rgba(255,255,255,0.3)' : 'var(--gold)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: timeLeft > 0 || isResending ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isResending ? (
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Resend Code
                </button>
              </div>

              <div>
                <Input
                  label="New Password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />

                {newPassword.length > 0 && (
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
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button variant="gold" size="lg" type="submit" glow disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password & Sign In'
                )}
              </Button>
            </form>
          </div>
        )}

        {step === 'SUCCESS' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={56} style={{ color: '#2ecc71', margin: '0 auto 20px' }} />
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.8rem',
                color: 'var(--cream)',
                marginBottom: '12px',
              }}
            >
              Password Reset Complete!
            </h1>
            <p style={{ color: 'var(--grey-light)', fontSize: '0.9rem', marginBottom: '28px', lineHeight: 1.5 }}>
              Your password has been successfully updated. You can now log in with your new credentials.
            </p>
            <Button
              variant="gold"
              size="lg"
              glow
              onClick={() => navigate('/login', { replace: true })}
            >
              Proceed to Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
