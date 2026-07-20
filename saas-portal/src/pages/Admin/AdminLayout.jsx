import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Box,
  Settings,
  LogOut,
  Search,
  Menu,
  ChevronRight,
  X,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useThemeStore from '../../store/useThemeStore';
import '../Dashboard/Dashboard.css';
import './Admin.css';
import '../Dashboard/Overview.css'; // Reuse common layout styles
import CustomModal from '../../components/CustomModal';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();

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

  React.useEffect(() => {
    let active = true;
    if (window.innerWidth <= 1024) {
      setTimeout(() => {
        if (active) {
          setIsSidebarOpen(false);
        }
      }, 0);
    }
    return () => {
      active = false;
    };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
    navigate('/login');
  };

  const navItems = [
    { name: 'Admin Overview', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'Users', path: '/admin/users', icon: <Users size={20} /> },
    { name: 'Packages', path: '/admin/packages', icon: <Box size={20} /> },
    { name: 'Payments', path: '/admin/payments', icon: <CreditCard size={20} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="dashboard-root">
      {isSidebarOpen && window.innerWidth <= 1024 && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <img
            src={(theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))
              ? '/Logo_Dark.png'
              : '/Logo_Light.png'}
            alt="WA-Mitra Admin"
            style={{ height: '50px' }}
          />
          <button className="sidebar-toggle-mobile" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">System Administration</div>
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

          <button onClick={() => setIsLogoutModalOpen(true)} className="nav-item text-error mt-auto">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

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
                placeholder="Search users or packages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="header-right">
            <div className="user-profile">
              <div className="user-info text-right">
                <span className="user-name">{user?.username}</span>
                <span className="user-role text-accent" style={{ fontSize: '10px', display: 'block' }}>Administrator</span>
              </div>
              <div className="user-avatar glass">
                <ShieldCheck size={20} />
              </div>
            </div>
          </div>
        </header>

        <div className="content-area">
          <Outlet context={{ searchQuery }} />
        </div>
      </main>
      <CustomModal
        isOpen={isLogoutModalOpen}
        type="confirm"
        title="Logout Confirmation"
        message="Are you sure you want to log out of your session?"
        okText="Logout"
        cancelText="Cancel"
        onConfirm={handleLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
};

export default AdminLayout;
