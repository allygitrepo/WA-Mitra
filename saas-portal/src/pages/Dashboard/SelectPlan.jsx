import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Packages from '../../components/Packages';
import useAuthStore from '../../store/useAuthStore';
import './Dashboard.css';

const SelectPlan = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="select-plan-overlay">
      <div className="select-plan-container">
        <div className="select-plan-header">
          <div className="header-top">
            <div className="brand-wrap">
              <img src="/Logo_Dark.png" alt="WA-Mitra" className="select-plan-logo" />
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <LogOut size={18} /> Logout
            </button>
          </div>
          
          <div className="header-content-main text-center mb-5">
            <h1 className="welcome-text">Welcome to WA-Mitra, <span className="text-primary">{user?.username}</span>!</h1>
            <p className="welcome-sub">Your account is ready. Please select a plan to activate your dashboard.</p>
          </div>
        </div>

        <div className="plans-wrapper">
          <Packages hideHeader={true} />
        </div>

        <div className="select-plan-footer text-center mt-12 pb-12">
          <p className="text-muted text-sm">Need a custom enterprise solution? <span className="text-primary pointer">Contact Sales</span></p>
        </div>
      </div>
    </div>
  );
};

export default SelectPlan;
