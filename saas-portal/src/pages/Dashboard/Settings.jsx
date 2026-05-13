import React, { useState } from 'react';
import { 
  User, 
  Palette,
  Save,
  Sun,
  Moon,
  Monitor,
  Edit2,
  LogOut,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useThemeStore from '../../store/useThemeStore';
import './Settings.css';

const Settings = () => {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="settings-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and visual preferences.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-nav glass">
          <button 
            className={`s-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> <span>Profile</span>
          </button>
          <button 
            className={`s-nav-item ${activeTab === 'theme' ? 'active' : ''}`}
            onClick={() => setActiveTab('theme')}
          >
            <Palette size={18} /> <span>Appearance</span>
          </button>
          
          <div style={{marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)'}}>
            <button className="s-nav-item text-error" onClick={handleLogout}>
              <LogOut size={18} /> <span>Logout Session</span>
            </button>
          </div>
        </div>

        <div className="settings-content">
          {activeTab === 'profile' ? (
            <div className="settings-card glass animate-fade-in">
              <div className="card-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                  <h3>Profile Information</h3>
                  <p>Update your personal details and how others see you.</p>
                </div>
                <button 
                  className={`btn-edit ${isEditing ? 'active' : ''}`} 
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <><X size={16} /> Cancel</> : <><Edit2 size={16} /> Edit Profile</>}
                </button>
              </div>
              
              <div className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Username</label>
                    <input 
                      type="text" 
                      className="auth-input" 
                      style={{paddingLeft: '14px'}} 
                      defaultValue={user?.username} 
                      readOnly={!isEditing} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      className="auth-input" 
                      style={{paddingLeft: '14px'}} 
                      defaultValue={user?.email} 
                      readOnly 
                    />
                    <span style={{fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px'}}>Email cannot be changed</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Organization</label>
                    <input 
                      type="text" 
                      className="auth-input" 
                      style={{paddingLeft: '14px'}} 
                      defaultValue={user?.orgName} 
                      readOnly={!isEditing} 
                      placeholder="Not set"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input 
                      type="text" 
                      className="auth-input" 
                      style={{paddingLeft: '14px'}} 
                      defaultValue={user?.phone} 
                      readOnly={!isEditing} 
                      placeholder="Not set"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="form-actions animate-fade-in">
                    <button className="btn-primary" onClick={() => setIsEditing(false)}>
                      <Save size={18} /> Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="settings-card glass animate-fade-in">
              <div className="card-header">
                <h3>Theme Settings</h3>
                <p>Customize how the dashboard looks on your device.</p>
              </div>

              <div className="theme-selection-grid">
                <div 
                  className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <div className="theme-preview light">
                    <div className="preview-header"></div>
                    <div className="preview-sidebar"></div>
                    <div className="preview-content"></div>
                  </div>
                  <div className="theme-info">
                    <Sun size={16} />
                    <span>Light Mode</span>
                  </div>
                </div>

                <div 
                  className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <div className="theme-preview dark">
                    <div className="preview-header"></div>
                    <div className="preview-sidebar"></div>
                    <div className="preview-content"></div>
                  </div>
                  <div className="theme-info">
                    <Moon size={16} />
                    <span>Dark Mode</span>
                  </div>
                </div>

                <div 
                  className={`theme-option ${theme === 'system' ? 'active' : ''}`}
                  onClick={() => setTheme('system')}
                >
                  <div className="theme-preview system">
                    <div className="preview-header"></div>
                    <div className="preview-sidebar"></div>
                    <div className="preview-content"></div>
                  </div>
                  <div className="theme-info">
                    <Monitor size={16} />
                    <span>System Default</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
