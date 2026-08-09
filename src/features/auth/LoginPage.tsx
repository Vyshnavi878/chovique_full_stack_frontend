import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useApp } from '../../app/providers';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';

export const LoginPage: React.FC = () => {
  const { login, googleLogin } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // After login, redirect back to where the user came from (e.g. /checkout)
  const from = (location.state as { from?: string })?.from || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!email.trim()) {
      setError('Please enter your email address.');
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

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Login failed. Please check your credentials.');
      return;
    }

    // Redirect based on the role returned directly from the login response
    if (result.role === 'admin') {
      navigate('/admin');
    } else if (result.role === 'superadmin') {
      navigate('/superadmin');
    } else {
      // Redirect to where the user originally wanted to go, or home
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Back Link */}
        <Link to="/" className="back-to-store-link">
          <ArrowLeft size={16} />
          Back
        </Link>

        {/* Header */}
        <div className="auth-header">
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to Chovique</p>
        </div>

        {isGoogleLoading && (
          <div
            style={{
              padding: '14px 18px',
              background: 'rgba(201, 168, 76, 0.15)',
              border: '1px solid var(--gold)',
              borderRadius: '8px',
              color: 'var(--gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '20px',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Authenticating with Google... Redirecting, please wait.</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div
              role="alert"
              style={{
                background: 'rgba(231, 76, 60, 0.1)',
                border: '1px solid #e74c3c',
                color: '#e74c3c',
                borderRadius: '4px',
                padding: '10px',
                fontSize: '0.85rem',
                marginBottom: '20px',
              }}
            >
              {error}
            </div>
          )}

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
            autoComplete="current-password"
          />

          <div className="form-checkbox-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember Me</span>
            </label>
            <Link to="/forgot-password" style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>
              Forgot Password?
            </Link>
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
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="auth-divider" style={{ margin: '24px 0' }}>Or continue with</div>

        <div className="social-login-group">
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  setIsGoogleLoading(true);
                  setError('');
                  try {
                    const result = await googleLogin(credentialResponse.credential);
                    if (result.success) {
                      if (result.user && result.user.has_password === false) {
                        navigate('/set-password', { state: { from } });
                      } else if (result.role === 'admin') {
                        navigate('/admin');
                      } else if (result.role === 'superadmin') {
                        navigate('/superadmin');
                      } else {
                        navigate(from, { replace: true });
                      }
                    } else {
                      setError(result.error || 'Google Sign-In failed.');
                    }
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : 'Google Sign-In failed.';
                    setError(msg);
                  } finally {
                    setIsGoogleLoading(false);
                  }
                }
              }}
              onError={() => {
                setError(`Google Sign-In failed: Origin (${window.location.origin}) is not authorized in Google Cloud Console for this Client ID.`);
              }}
              theme="filled_black"
              shape="rectangular"
              size="large"
              text="continue_with"
            />
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--grey-light)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--gold)', fontWeight: 600 }}>
            Register Now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
