import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, Building, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';
import Navbar from '../components/Navbar';
import './Auth.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    orgName: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.register(formData);
      // Store email in local storage for the OTP page
      localStorage.setItem('verify_email', formData.email);
      navigate('/verify-otp');
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-container animate-fade-in">
        <div className="auth-card glass">
          <h2>Create Account</h2>
          <p className="auth-subtitle">Join WA-Mitra and start automating.</p>
          
          {error && <div className="auth-error">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <div className="input-icon">
                  <User size={20} />
                  <input 
                    name="username"
                    type="text" 
                    placeholder="John Doe" 
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <div className="input-icon">
                  <Mail size={20} />
                  <input 
                    name="email"
                    type="email" 
                    placeholder="john@example.com" 
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone (Optional)</label>
                <div className="input-icon">
                  <Phone size={20} />
                  <input 
                    name="phone"
                    type="text" 
                    placeholder="+91..." 
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Organization (Optional)</label>
                <div className="input-icon">
                  <Building size={20} />
                  <input 
                    name="orgName"
                    type="text" 
                    placeholder="Company Name" 
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <div className="input-icon">
                  <Lock size={20} />
                  <input 
                    name="password"
                    type="password" 
                    placeholder="••••••••" 
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-icon">
                  <Lock size={20} />
                  <input 
                    name="confirmPassword"
                    type="password" 
                    placeholder="••••••••" 
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
            </div>
            
            <button type="submit" className="btn-primary auth-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Register'} <ArrowRight size={20} />
            </button>
          </form>
          
          <p className="auth-footer">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
