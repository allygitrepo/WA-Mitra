import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Smartphone,
  Settings,
  LogOut,
  Bell,
  Search,
  User,
  ChevronRight,
  Menu,
  Send,
  Key,
  Book,
  BarChart3,
  X
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import ThemeToggle from '../../components/ThemeToggle';
import './Dashboard.css';

import useThemeStore from '../../store/useThemeStore';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle responsive sidebar on resize
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on mobile after navigation
  React.useEffect(() => {
    if (window.innerWidth <= 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Instances', path: '/dashboard/instances', icon: <Smartphone size={20} /> },
    { name: 'Send Message', path: '/dashboard/messaging', icon: <Send size={20} /> },
    { name: 'API Tokens', path: '/dashboard/tokens', icon: <Key size={20} /> },
    { name: 'Reports', path: '/dashboard/reports', icon: <BarChart3 size={20} /> },
    { name: 'Docs', path: '/dashboard/docs', icon: <Book size={20} /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="dashboard-root">
      {/* Mobile Overlay */}
      {isSidebarOpen && window.innerWidth <= 1024 && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <img
            src={(theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
              ? '/Logo_Dark.png'
              : '/Logo_Light.png'}
            alt="WA-Mitra"
            style={{ height: '50px' }}
          />
          <button className="sidebar-toggle-mobile" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.name}</span>
              {location.pathname === item.path && <ChevronRight size={16} className="active-arrow" />}
            </Link>
          ))}
        </nav>

      </aside>

      {/* Main Content */}
      <main className="main-wrap">
        <header className="main-header glass">
          <div className="header-left">
            <button className="sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={20} />
            </button>
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="header-right">
            <div className="user-profile">
              <div className="user-info">
                <span className="user-name">{user?.username}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="content-area">
          <Outlet context={{ searchQuery }} />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
