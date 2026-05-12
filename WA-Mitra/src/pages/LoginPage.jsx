import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';
import useAuthStore from '../store/useAuthStore';
import Navbar from '../components/Navbar';
import './Auth.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await authService.login({ email, password });
      setAuth(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-container animate-fade-in">
        <div className="auth-card glass">
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Login to manage your WhatsApp gateway.</p>
          
          {error && <div className="auth-error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-icon">
                <Mail size={20} />
                <input 
                  type="email" 
                  placeholder="name@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Password</label>
              <div className="input-icon">
                <Lock size={20} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
            
            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'} <ArrowRight size={20} />
            </button>
          </form>
          
          <div className="auth-divider">
            <span>OR</span>
          </div>
          
          <button className="btn-secondary google-btn">
             Login with Google
          </button>
          
          <p className="auth-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
