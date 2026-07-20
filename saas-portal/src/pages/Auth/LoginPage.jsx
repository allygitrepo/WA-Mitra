import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight, Eye, EyeOff, X, Key, CheckCircle2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import useAuthStore from '../../store/useAuthStore';
import useThemeStore from '../../store/useThemeStore';
import { authService } from '../../api/services';
import './Auth.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP & New Pass
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        const res = await authService.googleLogin({ accessToken: tokenResponse.access_token });
        setAuth(res.data.user, res.data.token, res.data.refreshToken);
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'Google Login failed');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google Login failed')
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.login({ email, password });
      setAuth(res.data.user, res.data.token, res.data.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    try {
      await authService.forgotPassword({ email: forgotEmail });
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    try {
      await authService.resetPassword({
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: newPassword
      });
      setForgotSuccess('Password reset successful! You can now login.');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotEmail('');
        setForgotOtp('');
        setNewPassword('');
        setForgotSuccess('');
      }, 3000);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Invalid OTP or reset failed');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card compact glass">
        <div className="auth-header">
          <Link to="/">
            <img
              src={(useThemeStore.getState().theme === 'dark' || (useThemeStore.getState().theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
                ? '/Logo_Dark.png'
                : '/Logo_Light.png'}
              alt="WA-Mitra"
              style={{ height: '50px', marginBottom: '16px' }}
            />
          </Link>
          <p>Login to your developer portal</p>
        </div>

        {error && <div className="auth-error-msg compact">{error}</div>}

        <form className="auth-form compact" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={16} />
              <input
                type="email"
                className="auth-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label>Password</label>

            </div>
            <div className="input-wrapper">
              <Lock className="input-icon" size={16} />
              <input
                type={showPassword ? "text" : "password"}
                className="auth-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>

            </div>
          </div>

          <button type="submit" className="btn-auth compact" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'} <LogIn size={18} />
          </button>
        </form>
        <button
          type="button"
          className="forgot-link"
          onClick={() => {
            if (email) setForgotEmail(email);
            setShowForgotModal(true);
          }}
          style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'none', padding: 0 }}
        >
          Forgot Password?
        </button>
        <div className="auth-divider compact">Or continue with</div>

        <div className="google-btn-container" style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
          <button
            type="button"
            className="social-btn"
            onClick={() => handleGoogleLogin()}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <img src="/sign_in_with_google.webp" alt="Google" style={{ height: '42px', borderRadius: '4px' }} />
          </button>
        </div>

        <div className="auth-footer compact">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay">
          <div className="modal-content glass animate-fade-in" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Key size={20} className="text-primary" />
                <h3 className="modal-title">Reset Password</h3>
              </div>
              <button className="close-btn" onClick={() => setShowForgotModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {forgotSuccess ? (
                <div className="success-state" style={{ textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle2 size={48} className="text-primary" style={{ marginBottom: '16px' }} />
                  <p>{forgotSuccess}</p>
                </div>
              ) : (
                <>
                  {forgotError && <div className="auth-error-msg compact">{forgotError}</div>}

                  {forgotStep === 1 ? (
                    <form onSubmit={handleSendForgotOtp}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Enter your email address and we'll send you an OTP to reset your password.
                      </p>
                      <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                          <Mail className="input-icon" size={16} />
                          <input
                            type="email"
                            className="auth-input"
                            placeholder="name@company.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }} disabled={forgotLoading}>
                        {forgotLoading ? 'Sending...' : 'Send OTP'} <ArrowRight size={18} />
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPassword}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        We've sent an OTP to <strong>{forgotEmail}</strong>. Please enter it below along with your new password.
                      </p>
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label>OTP Code</label>
                        <input
                          type="text"
                          className="auth-input"
                          style={{ paddingLeft: '14px' }}
                          placeholder="6-digit code"
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>New Password</label>
                        <div className="input-wrapper">
                          <Lock className="input-icon" size={16} />
                          <input
                            type="password"
                            className="auth-input"
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '20px', justifyContent: 'center' }} disabled={forgotLoading}>
                        {forgotLoading ? 'Resetting...' : 'Update Password'} <CheckCircle2 size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setForgotStep(1)}
                        style={{ width: '100%', marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}
                      >
                        Back to Email
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
