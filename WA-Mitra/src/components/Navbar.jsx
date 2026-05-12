import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, User, MessageSquare } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar glass">
      <div className="container navbar-content">
        <Link to="/" className="logo-container">
          <img src="/logo.png" alt="WA-Mitra Logo" className="logo-img" />
          <span className="logo-text">WA-Mitra</span>
        </Link>
        
        <div className="nav-links">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link">
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </Link>
              <div className="user-profile">
                <User size={20} />
                <span>{user?.username}</span>
                <button onClick={handleLogout} className="logout-btn" title="Logout">
                  <LogOut size={20} />
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-btn">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
