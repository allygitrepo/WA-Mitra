
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell } from 'lucide-react';
import Packages from '../../components/Packages';
import useAuthStore from '../../store/useAuthStore';
import useThemeStore from '../../store/useThemeStore';
import ThemeToggle from '../../components/ThemeToggle';
import './Dashboard.css';

const SelectPlan = () => {
  const { user, logout } = useAuthStore();
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'J';

  return (
    <div className="select-plan-overlay">
      {/* 72px Top Navigation */}
      <header className="sp-top-nav">
        <div className="sp-nav-container">
          <div className="sp-brand">
            <img 
              src={isDark ? '/Logo_Dark.png' : '/Logo_Light.png'} 
              alt="WA-Mitra" 
              className="sp-logo" 
            />
          </div>
          <div className="sp-nav-actions">
            <ThemeToggle />
            <button className="sp-icon-btn" title="Notifications">
              <Bell size={18} />
            </button>
            <div className="sp-user-pill">
              <div className="sp-avatar">{userInitial}</div>
              <span className="sp-username">{user?.username || 'User'}</span>
              <button className="sp-logout-icon" onClick={handleLogout} title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="sp-main-body">
        {/* Welcome Section - Left Aligned, Max 700px */}
        <section className="sp-welcome-section">
          <h1 className="sp-welcome-title">
            Welcome back, <span className="sp-username-highlight">{user?.username || 'Jenil'} 👋</span>
          </h1>
          <p className="sp-welcome-subtitle">
            Choose a plan to activate your WA-Mitra account.
          </p>
        </section>

        {/* Pricing Cards Grid */}
        <div className="sp-plans-wrapper">
          <Packages hideHeader={true} />
        </div>
      </main>
    </div>
  );
};

export default SelectPlan;
