import { useState, useEffect, Fragment } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Smartphone,
  Settings,
  LogOut,
  Search,
  ChevronRight,
  Menu,
  Send,
  Key,
  Book,
  BarChart3,
  Layers,
  X,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { authService } from '../../api/services';
import ThemeToggle from '../../components/ThemeToggle';
import './Dashboard.css';
import useThemeStore from '../../store/useThemeStore';
import CustomModal from '../../components/CustomModal';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMessagingExpanded, setIsMessagingExpanded] = useState(false);

  // Sync messaging expanded state with route path
  useEffect(() => {
    if (location.pathname.startsWith('/dashboard/messaging')) {
      setIsMessagingExpanded(true);
    } else {
      setIsMessagingExpanded(false);
    }
  }, [location.pathname]);

  // Handle responsive sidebar on resize
  useEffect(() => {
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
  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (active && window.innerWidth <= 1024) {
        setIsSidebarOpen(false);
      }
    }, 0);
    return () => {
      active = false;
    };
  }, [location.pathname]);

  // Fetch latest user profile on mount to sync subscription details
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileRes = await authService.getProfile();
        if (profileRes.data.user) {
          useAuthStore.getState().updateUser(profileRes.data.user);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Instances', path: '/dashboard/instances', icon: <Smartphone size={20} /> },
    { name: 'Send Message', path: '/dashboard/messaging', icon: <Send size={20} /> },
    { name: 'Auto Replies', path: '/dashboard/auto-replies', icon: <MessageSquare size={20} /> },
    { name: 'API Tokens', path: '/dashboard/tokens', icon: <Key size={20} /> },
    { name: 'Reports', path: '/dashboard/reports', icon: <BarChart3 size={20} /> },
    { name: 'Plans', path: '/dashboard/plans', icon: <Layers size={20} /> },
    { name: 'API Docs', path: '/dashboard/docs', icon: <Book size={20} /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="dashboard-root">
      {/* Mobile Overlay */}
      {isSidebarOpen && window.innerWidth <= 1024 && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Account Suspension Overlay */}
      {user?.status === 'suspended' && (
        <div className="suspension-overlay glass animate-fade-in">
          <div className="suspension-card glass animate-slide-up">
            <div className="suspension-icon">
              <ShieldAlert size={48} />
            </div>
            <h2>Account Suspended</h2>
            <p>Your access to WA-Mitra has been temporarily suspended by the administrator.</p>
            <div className="suspension-meta">
              <span>Reason: {user?.suspendReason || 'Policy violation or pending payment'}</span>
            </div>
            <button className="btn-primary mt-6" onClick={handleLogout}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
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
          {navItems.map((item) => {
            if (item.name === 'Send Message') {
              const isMessagingActive = location.pathname.startsWith('/dashboard/messaging');
              const searchParams = new URLSearchParams(location.search);
              const activeType = isMessagingActive ? (searchParams.get('type') || 'contact') : '';

              return (
                <Fragment key={item.path}>
                  <Link
                    to="/dashboard/messaging?type=contact"
                    className={`nav-item ${isMessagingActive ? 'active' : ''}`}
                    style={{ justifyContent: 'space-between' }}
                    onClick={(e) => {
                      if (isMessagingActive) {
                        e.preventDefault();
                        setIsMessagingExpanded(!isMessagingExpanded);
                      } else {
                        setIsMessagingExpanded(true);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.icon}
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight
                      size={16}
                      style={{
                        transform: isMessagingExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        marginLeft: 'auto'
                      }}
                    />
                  </Link>
                  {isMessagingExpanded && (
                    <div className="sidebar-submenu">
                      <Link
                        to="/dashboard/messaging?type=contact"
                        className={`submenu-item ${activeType === 'contact' ? 'active' : ''}`}
                      >
                        Contact
                      </Link>
                      <Link
                        to="/dashboard/messaging?type=bulk"
                        className={`submenu-item ${activeType === 'bulk' ? 'active' : ''}`}
                      >
                        Bulk messaging
                      </Link>
                      <Link
                        to="/dashboard/messaging?type=group"
                        className={`submenu-item ${activeType === 'group' ? 'active' : ''}`}
                      >
                        Group messaging
                      </Link>
                      <Link
                        to="/dashboard/messaging?type=schedule"
                        className={`submenu-item ${activeType === 'schedule' ? 'active' : ''}`}
                      >
                        Message Scheduling
                      </Link>
                      <Link
                        to="/dashboard/messaging?type=cycling"
                        className={`submenu-item ${activeType === 'cycling' ? 'active' : ''}`}
                      >
                        Message cycling
                      </Link>
                      <Link
                        to="/dashboard/messaging?type=campaigns"
                        className={`submenu-item ${activeType === 'campaigns' ? 'active' : ''}`}
                      >
                        Campaigns History
                      </Link>
                    </div>
                  )}
                </Fragment>
              );
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.name}</span>
                {location.pathname === item.path && <ChevronRight size={16} className="active-arrow" />}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={() => setIsLogoutModalOpen(true)}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
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

export default DashboardLayout;
