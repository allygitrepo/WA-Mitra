import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';
import useAuthStore from '../store/useAuthStore';
import Navbar from '../components/Navbar';
import './Auth.css';

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const storedEmail = localStorage.getItem('verify_email');
    if (!storedEmail) {
      navigate('/register');
    } else {
      setEmail(storedEmail);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authService.verifyOtp({ email, otp });
      setAuth(res.data.user, res.data.token);
      localStorage.removeItem('verify_email');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-container animate-fade-in">
        <div className="auth-card glass">
          <div className="auth-icon-header">
            <ShieldCheck size={48} color="var(--primary)" />
          </div>
          <h2>Verify Your Email</h2>
          <p className="auth-subtitle">We've sent a 6-digit code to <strong>{email}</strong>.</p>
          
          {error && <div className="auth-error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Enter OTP</label>
              <input 
                type="text" 
                className="otp-input"
                placeholder="000000" 
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required 
              />
            </div>
            
            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Continue'} <ArrowRight size={20} />
            </button>
          </form>
          
          <p className="auth-footer">
            Didn't receive the code? <button className="text-btn">Resend OTP</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
