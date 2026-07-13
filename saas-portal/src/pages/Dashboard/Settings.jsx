import React, { useState, useEffect } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import useThemeStore from '../../store/useThemeStore';
import API from '../../api/axiosConfig';
import { authService, instanceService, messageService } from '../../api/services';
import './Settings.css';
import '../Admin/Admin.css';

const Settings = () => {
  const { user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [packages, setPackages] = useState([]);
  const [loadingPkg, setLoadingPkg] = useState(false);
  const [usage, setUsage] = useState({ instances: 0, messages: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'subscription') {
      fetchSubscriptionData();
    }
  }, [activeTab]);

  const fetchSubscriptionData = async () => {
    try {
      setLoadingPkg(true);
      const [pkgsRes, instRes, logsRes, profileRes] = await Promise.all([
        API.get('/plans/all'),
        instanceService.getInstances(),
        messageService.getLogs(),
        authService.getProfile()
      ]);

      setPackages(pkgsRes.data.packages || []);

      // Update store with latest user data (including expiresAt)
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
  };

  const currentPackage = packages.find(p => p.id === user?.packageId) || user?.package;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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
          <button
            className={`s-nav-item ${activeTab === 'subscription' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscription')}
          >
            <Box size={18} /> <span>Subscription</span>
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'profile' ? (
            <div className="settings-card glass animate-fade-in">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                      style={{ paddingLeft: '14px' }}
                      defaultValue={user?.username}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
                      defaultValue={user?.email}
                      readOnly
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Email cannot be changed</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Organization</label>
                    <input
                      type="text"
                      className="auth-input"
                      style={{ paddingLeft: '14px' }}
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
                      style={{ paddingLeft: '14px' }}
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
          ) : activeTab === 'subscription' ? (
            <div className="settings-card glass animate-fade-in">
              <div className="card-header">
                <h3>Your Subscription</h3>
                <p>Manage your current plan and system limits.</p>
              </div>
              <div className="subscription-content p-6">
                {loadingPkg ? (
                  <div className="flex flex-col items-center justify-center p-12">
                    <Loader2 size={32} className="animate-spin text-primary" />
                    <p className="mt-4 text-muted">Fetching subscription details...</p>
                  </div>
                ) : currentPackage ? (
                  <div className="current-plan-card glass animate-pulse-slow">
                    <div className="plan-badge">CURRENT PLAN</div>
                    <h2>{currentPackage.name}</h2>
                    <p className="opacity-60">{`Subscription valid until ${currentPackage.duration === -1 ? 'Lifetime' : formatDate(user?.expiresAt)}`}</p>

                    <div className="plan-stats-grid mt-6">
                      <div className="plan-stat">
                        <Smartphone size={20} className="text-primary" />
                        <div>
                          <span className="label">Instances</span>
                          <span className="value">{currentPackage.instanceLimit === -1 ? 'Unlimited' : `${usage.instances} / ${currentPackage.instanceLimit}`}</span>
                        </div>
                      </div>
                      <div className="plan-stat">
                        <MessageSquare size={20} className="text-primary" />
                        <div>
                          <span className="label">Message Quota</span>
                          <span className="value">{currentPackage.messageLimit === -1 ? 'Unlimited' : `${usage.messages.toLocaleString()} / ${currentPackage.messageLimit.toLocaleString()}`}</span>
                        </div>
                      </div>
                      <div className="plan-stat">
                        <Zap size={20} className="text-primary" />
                        <div>
                          <span className="label">Status</span>
                          <span className="value text-success">Active</span>
                        </div>
                      </div>
                    </div>

                    <div className="usage-progress-bars mt-8">
                      {currentPackage.messageLimit !== -1 && (
                        <div className="usage-item mb-6">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted">Message Quota Usage</span>
                            <span className="font-bold">{usage.messages.toLocaleString()} / {currentPackage.messageLimit.toLocaleString()}</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${Math.min(100, (usage.messages / currentPackage.messageLimit) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {currentPackage.instanceLimit !== -1 && (
                        <div className="usage-item">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted">Instance Connection Usage</span>
                            <span className="font-bold">{usage.instances} / {currentPackage.instanceLimit}</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${Math.min(100, (usage.instances / currentPackage.instanceLimit) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <br />
                    <br />
                    {/* <button className="btn-primary w-full mt-8" onClick={() => navigate('/dashboard/plans')}>
                      Upgrade My Plan
                    </button> */}
                  </div>
                ) : (
                  <div className="no-plan-card glass p-8 text-center">
                    <AlertCircle size={48} className="mx-auto text-muted mb-4" />
                    <h3>No Active Plan</h3>
                    <p className="text-muted mt-2">You haven't subscribed to any plan yet. Subscribe now to start using the gateway.</p>
                    <button className="btn-primary mx-auto mt-6" onClick={() => navigate('/dashboard/plans')}>
                      Browse Plans
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="settings-card glass animate-fade-in">
              {/* ... theme settings ... */}
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
