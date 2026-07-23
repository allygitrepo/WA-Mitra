import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useThemeStore from '../store/useThemeStore';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { theme } = useThemeStore();

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <nav className="landing-nav glass">
      <div className="container nav-content">
        {/* Left: Logo */}
        <Link to="/" className="nav-logo">
          <img
            src={isDark ? '/Logo_Dark.png' : '/Logo_Light.png'}
            alt="WA-Mitra"
            style={{ height: '38px', width: 'auto', display: 'block' }}
          />
        </Link>

        {/* Center/Right Menu Links & Actions */}
        <div className={`nav-menu-wrapper ${isOpen ? 'open' : ''}`}>
          <div className="nav-links">
            <a href="#features" onClick={() => setIsOpen(false)}>Features</a>
            <a href="#pricing" onClick={() => setIsOpen(false)}>Pricing</a>
            <a href="#faq" onClick={() => setIsOpen(false)}>FAQ</a>
            <Link to="/docs" onClick={() => setIsOpen(false)}>API Docs</Link>
          </div>

          <div className="nav-actions">
            <ThemeToggle />
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="nav-btn-outline" onClick={() => setIsOpen(false)}>
                  Sign In
                </Link>
                <Link to="/register" className="nav-btn-primary" onClick={() => setIsOpen(false)}>
                  Get Started <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <Link to="/dashboard" className="nav-btn-primary" onClick={() => setIsOpen(false)}>
                Dashboard <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Hamburger Button */}
        <button className="nav-mobile-toggle" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle Menu">
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
