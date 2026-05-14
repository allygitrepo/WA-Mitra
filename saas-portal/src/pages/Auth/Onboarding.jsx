import React from 'react';
import Packages from '../../components/Packages';
import useAuthStore from '../../store/useAuthStore';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Onboarding = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="onboarding-page glass">
      <div className="onboarding-header">
        <div className="container flex justify-between items-center py-6">
          <img src="/Logo_Dark.png" alt="WA-Mitra" style={{ height: '40px' }} />
          <div className="flex items-center gap-4">
            <span className="text-muted">Logged in as <strong>{user?.username}</strong></span>
            <button className="btn-secondary flex items-center gap-2" onClick={handleLogout}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="onboarding-content">
        <div className="container">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold">Welcome to WA-Mitra</h1>
            <p className="text-xl text-muted mt-4">To get started, please select a subscription plan. You can choose a free trial or a premium plan.</p>
          </div>
          
          <div className="onboarding-packages-wrap">
            <Packages />
          </div>
        </div>
      </div>

      <div className="onboarding-footer text-center py-12 border-t border-border">
        <p className="text-muted">Secure payments powered by Razorpay. 24/7 support available.</p>
      </div>
    </div>
  );
};

export default Onboarding;
