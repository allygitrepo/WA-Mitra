import React, { useState, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { authService } from '../../api/services';
import './Auth.css';

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  
  const email = location.state?.email || '';

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const code = otp.join('');
      const res = await authService.verifyOtp({ email, otp: code });
      setAuth(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-icon"></div>
            <span>WA-Mitra</span>
          </div>
          <h2>Verify Email</h2>
          <p>We sent a code to your email address</p>
        </div>

        {error && <div className="auth-error-msg">{error}</div>}

        <form onSubmit={handleVerify}>
          <div className="otp-inputs">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                className="otp-input"
                maxLength="1"
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onFocus={(e) => e.target.select()}
                required
              />
            ))}
          </div>

          <button type="submit" className="btn-auth" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Code'} <ShieldCheck size={18} />
          </button>
        </form>

        <div className="auth-footer">
          Didn't receive a code? <a href="#">Resend Code</a>
        </div>
        
        <div style={{textAlign: 'center', marginTop: '1rem'}}>
          <Link to="/register" style={{display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', color: 'var(--text-muted)'}}>
            <ArrowLeft size={14} /> Back to register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
