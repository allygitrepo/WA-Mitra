import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Building, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { authService } from '../../api/services';
import useAuthStore from '../../store/useAuthStore';
import useThemeStore from '../../store/useThemeStore';
import './Auth.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    orgName: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    setError('');
    try {
      await authService.register(formData);
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (err) {
      const serverError = err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Failed to create account';
      setError(serverError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card compact register-card glass">
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
          <p>Join the enterprise WhatsApp gateway</p>
        </div>

        {error && <div className="auth-error-msg compact">{error}</div>}

        <form className="auth-form compact" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Username</label>
              <div className="input-wrapper">
                <User className="input-icon" size={16} />
                <input
                  type="text"
                  name="username"
                  className="auth-input"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <div className="input-wrapper">
                <Phone className="input-icon" size={16} />
                <input
                  type="text"
                  name="phone"
                  className="auth-input"
                  placeholder="+91..."
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={16} />
                <input
                  type="email"
                  name="email"
                  className="auth-input"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label>Organization</label>
              <div className="input-wrapper">
                <Building className="input-icon" size={16} />
                <input
                  type="text"
                  name="orgName"
                  className="auth-input"
                  placeholder="Company Name"
                  value={formData.orgName}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
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
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={16} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className="auth-input"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-auth compact" disabled={loading}>
            {loading ? 'Processing...' : 'Get Started'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-divider compact">Or join with</div>

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
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
