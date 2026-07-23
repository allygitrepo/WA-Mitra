import { useState, useEffect, useCallback } from 'react';
import {
  User,
  Palette,
  Save,
  Sun,
  Moon,
  Monitor,
  Edit2,
  X,
  Box,
  Smartphone,
  MessageSquare,
  Zap,
  Loader2,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import useThemeStore from '../../store/useThemeStore';
import API from '../../api/axiosConfig';
import { authService, instanceService, messageService } from '../../api/services';
import './Settings.css';

const Settings = () => {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    username: '',
    orgName: '',
    phone: ''
  });

  const [packages, setPackages] = useState([]);
  const [loadingPkg, setLoadingPkg] = useState(false);
  const [usage, setUsage] = useState({ instances: 0, messages: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    if (user) {
      setTimeout(() => {
        if (active) {
          setProfileForm({
            username: user.username || '',
            orgName: user.orgName || '',
            phone: user.phone || ''
          });
        }
      }, 0);
    }
    return () => {
      active = false;
    };
  }, [user]);

  const fetchSubscriptionData = useCallback(async () => {
    try {
      setLoadingPkg(true);
      const [pkgsRes, instRes, , profileRes] = await Promise.all([
        API.get('/plans/all'),
        instanceService.getInstances(),
        messageService.getLogs(),
        authService.getProfile()
      ]);

      setPackages(pkgsRes.data.packages || []);

      if (profileRes.data.user) {
        useAuthStore.getState().updateUser(profileRes.data.user);
      }

      const instances = instRes.data.instances || [];
      const totalMessages = instances.reduce((acc, curr) => acc + (curr.messageCount || 0), 0);

      setUsage({
        instances: instances.length,
        messages: totalMessages
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPkg(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (activeTab === 'subscription') {
      setTimeout(() => {
        if (active) {
          fetchSubscriptionData();
        }
      }, 0);
    }
    return () => {
      active = false;
    };
  }, [activeTab, fetchSubscriptionData]);

  const handleSaveProfile = async () => {
    if (!profileForm.username.trim()) {
      toast.error("Username cannot be empty.");
      return;
    }
    setSavingProfile(true);
    const loadingToast = toast.loading("Updating profile...");
    try {
      const res = await API.put('/auth/profile', profileForm);
      updateUser(res.data.user);
      setIsEditing(false);
      toast.success("Profile updated successfully!", { id: loadingToast });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile", { id: loadingToast });
    } finally {
      setSavingProfile(false);
    }
  };

  const currentPackage = packages.find(p => p.id === user?.packageId) || user?.package;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  return (
    <div className="settings-page-wrapper animate-fade-in">
      {/* Page Header */}
      <div className="settings-header">
        <div className="breadcrumb-trail">
          <span>Dashboard</span>
          <ChevronRight size={14} />
          <span className="current">Settings</span>
        </div>
        <h1 className="settings-page-title">Settings</h1>
        <p className="settings-page-subtitle">Manage your profile, appearance and subscription plan.</p>
      </div>

      {/* Main Settings Swiss Grid Layout */}
      <div className="settings-layout">
        {/* Left Vertical Tabs Navigation */}
        <aside className="settings-vertical-tabs">
          <button
            className={`tab-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            <span>Profile</span>
          </button>

          <button
            className={`tab-item ${activeTab === 'theme' ? 'active' : ''}`}
            onClick={() => setActiveTab('theme')}
          >
            <Palette size={18} />
            <span>Appearance</span>
          </button>

          <button
            className={`tab-item ${activeTab === 'subscription' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscription')}
          >
            <Box size={18} />
            <span>Subscription</span>
          </button>
        </aside>

        {/* Right Tab Content Panel */}
        <main className="settings-tab-panel">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="settings-card-container animate-fade-in">
              <div className="profile-header-card">
                <div className="avatar-large-wrapper">
                  <div className="avatar-large">
                    {(user?.username || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="user-name-title">
                      <h2>{user?.username || 'Enterprise User'}</h2>
                      <span className="role-badge">
                        {user?.role === 'admin' ? 'System Administrator' : 'Account Owner'}
                      </span>
                    </div>
                    <span className="user-email-subtitle">{user?.email}</span>
                  </div>
                </div>

                <button
                  className={`btn-secondary-modern ${isEditing ? 'active' : ''}`}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? <><X size={16} /> Cancel</> : <><Edit2 size={16} /> Edit Profile</>}
                </button>
              </div>

              <div className="card-section-divider"></div>

              <div className="settings-form-grid">
                <div className="form-field-group">
                  <label className="form-field-label">Username</label>
                  <input
                    type="text"
                    className="modern-input"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    readOnly={!isEditing}
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-field-label">Email Address</label>
                  <input
                    type="email"
                    className="modern-input read-only"
                    value={user?.email || ''}
                    readOnly
                  />
                  <span className="field-hint">Email address cannot be changed</span>
                </div>

                <div className="form-field-group">
                  <label className="form-field-label">Organization</label>
                  <input
                    type="text"
                    className="modern-input"
                    value={profileForm.orgName}
                    onChange={(e) => setProfileForm({ ...profileForm, orgName: e.target.value })}
                    readOnly={!isEditing}
                    placeholder="Not set"
                  />
                </div>

                <div className="form-field-group">
                  <label className="form-field-label">Phone Number</label>
                  <input
                    type="text"
                    className="modern-input"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    readOnly={!isEditing}
                    placeholder="Not set"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="form-actions-bar animate-fade-in">
                  <button className="btn-primary-modern" onClick={handleSaveProfile} disabled={savingProfile}>
                    <Save size={18} /> Save Changes
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APPEARANCE */}
          {activeTab === 'theme' && (
            <div className="settings-card-container animate-fade-in">
              <div className="panel-title-block">
                <h3>Theme Settings</h3>
                <p>Customize how the dashboard looks on your device.</p>
              </div>

              <div className="theme-options-grid">
                <div
                  className={`theme-card-option ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <div className="theme-preview-box light-preview">
                    <div className="preview-header-bar"></div>
                    <div className="preview-content-lines"></div>
                  </div>
                  <div className="theme-label-row">
                    <Sun size={18} />
                    <span>Light Mode</span>
                  </div>
                </div>

                <div
                  className={`theme-card-option ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <div className="theme-preview-box dark-preview">
                    <div className="preview-header-bar"></div>
                    <div className="preview-content-lines"></div>
                  </div>
                  <div className="theme-label-row">
                    <Moon size={18} />
                    <span>Dark Mode</span>
                  </div>
                </div>

                <div
                  className={`theme-card-option ${theme === 'system' ? 'active' : ''}`}
                  onClick={() => setTheme('system')}
                >
                  <div className="theme-preview-box system-preview">
                    <div className="preview-header-bar"></div>
                    <div className="preview-content-lines"></div>
                  </div>
                  <div className="theme-label-row">
                    <Monitor size={18} />
                    <span>System Default</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUBSCRIPTION */}
          {activeTab === 'subscription' && (
            <div className="settings-card-container animate-fade-in">
              <div className="panel-title-block">
                <h3>Your Subscription</h3>
                <p>Manage your current plan and system limits.</p>
              </div>

              <div className="card-section-divider"></div>

              {loadingPkg ? (
                <div className="loader-center-box">
                  <Loader2 size={32} className="animate-spin text-emerald" />
                  <p>Fetching subscription details...</p>
                </div>
              ) : currentPackage ? (
                <div className="active-subscription-block">
                  <div className="sub-status-header">
                    <div>
                      <span className="sub-badge-active">ACTIVE SUBSCRIPTION</span>
                      <h2 className="sub-plan-name">{currentPackage.name}</h2>
                      <p className="sub-expiry-text">
                        Subscription valid until: <strong>{currentPackage.duration === -1 ? 'Lifetime Access' : formatDate(user?.expiresAt)}</strong>
                      </p>
                    </div>
                    <button className="btn-primary-modern" onClick={() => navigate('/dashboard/plans')}>
                      <Zap size={18} /> Upgrade Plan
                    </button>
                  </div>

                  <div className="plan-metrics-grid">
                    <div className="metric-box">
                      <div className="metric-icon-wrap emerald">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <span className="metric-label">Instances</span>
                        <span className="metric-value">
                          {currentPackage.instanceLimit === -1 ? 'Unlimited' : `${usage.instances} / ${currentPackage.instanceLimit}`}
                        </span>
                      </div>
                    </div>

                    <div className="metric-box">
                      <div className="metric-icon-wrap indigo">
                        <MessageSquare size={20} />
                      </div>
                      <div>
                        <span className="metric-label">Message Quota</span>
                        <span className="metric-value">
                          {currentPackage.messageLimit === -1 ? 'Unlimited' : `${usage.messages.toLocaleString('en-IN')} / ${currentPackage.messageLimit.toLocaleString('en-IN')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-sub-banner">
                  <div className="empty-sub-info">
                    <div className="empty-sub-icon">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h4 className="empty-sub-title">No Active Subscription</h4>
                      <p className="empty-sub-desc">You haven't subscribed to a plan yet. Browse our pricing packages to activate WhatsApp instances and unlimited REST API messaging.</p>
                    </div>
                  </div>
                  <button className="btn-primary-modern" onClick={() => navigate('/dashboard/plans')}>
                    <Zap size={18} /> Browse Pricing Plans
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;
