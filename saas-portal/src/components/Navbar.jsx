import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useThemeStore from '../store/useThemeStore';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  return (
    <nav className="landing-nav glass">
      <div className="container nav-content">
        <Link to="/" className="nav-logo">
          <img
            src={(useThemeStore.getState().theme === 'dark' || (useThemeStore.getState().theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
              ? '/Logo_Dark.png'
              : '/Logo_Light.png'}
            alt="WA-Mitra"
            style={{ height: '50px', marginBottom: '16px' }}
          />
        </Link>

        <div className={`nav-links ${isOpen ? 'open' : ''}`}>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
          <Link to="/docs">API Docs</Link>
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="nav-btn-outline">Login</Link>
              <Link to="/register" className="nav-btn-primary">Get Started</Link>
            </>
          ) : (
            <Link to="/dashboard" className="nav-btn-primary">Dashboard</Link>
          )}
        </div>

        <button className="nav-mobile-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
