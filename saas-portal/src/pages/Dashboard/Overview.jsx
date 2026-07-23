import { useState, useEffect, useCallback } from 'react';
import {
  Send,
  Activity,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  BarChart3,
  Key,
  Settings,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { instanceService, messageService } from '../../api/services';
import useAuthStore from '../../store/useAuthStore';
import './Overview.css';
import '../Admin/Admin.css';

const Overview = () => {
  const { searchQuery } = useOutletContext();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [instances, setInstances] = useState([]);
  const [logs, setLogs] = useState([]);
  const [totalMessagesSent, setTotalMessagesSent] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [instRes, logsRes] = await Promise.all([
        instanceService.getInstances(),
        messageService.getLogs()
      ]);
      setInstances(instRes.data.instances || []);
      setLogs(logsRes.data.logs || []);
      setTotalMessagesSent(logsRes.data.totalMessagesSent || 0);
    } catch (err) {
      console.error("Overview Fetch Error:", err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (active) {
        fetchData();
      }
    }, 0);
    return () => {
      active = false;
    };
  }, [fetchData]);

  const totalMessages = totalMessagesSent;
  const activeSessions = instances.filter(i => i.liveStatus === 'connected').length;

  const filteredLogs = logs.filter(log =>
    (log.recipient?.toLowerCase() || '').includes((searchQuery || '').toLowerCase()) ||
    (log.instance?.name?.toLowerCase() || '').includes((searchQuery || '').toLowerCase())
  );

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="overview-container animate-fade-in">
      {/* Top Greeting Header */}
      <div className="overview-hero-header">
        <div>
          <h1 className="overview-hero-title">
            Dashboard
          </h1>
          <p className="overview-hero-subtitle">
            Welcome back, <span className="text-primary font-bold">{user?.username || 'User'}</span>!
          </p>
        </div>
        {user?.packageId && (
          <div className="system-status-badge">
            <span className="live-dot"></span> Gateway Operational
          </div>
        )}
      </div>

      {/* Package Reminder Banner if No Plan */}
      {!user?.packageId && (
        <div className="package-reminder-banner glass animate-slide-down mb-6">
          <div className="banner-content">
            <div className="banner-icon-box">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4>No Active Plan Detected</h4>
              <p>Pick a plan to start connecting WhatsApp instances and sending messages seamlessly.</p>
            </div>
          </div>
          <Link to="/dashboard/plans" className="btn-primary-gradient">
            <Zap size={16} /> Choose a Plan
          </Link>
        </div>
      )}

      {/* 3 Metric Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card glass-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper emerald-badge">
              <Send size={22} />
            </div>
            <span className="stat-trend trend-neutral">Real-time</span>
          </div>
          <div className="stat-body">
            <span className="stat-label">Total Messages Sent</span>
            <h3 className="stat-value">{totalMessages.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper indigo-badge">
              <Activity size={22} />
            </div>
            {activeSessions > 0 ? (
              <span className="stat-trend trend-positive">
                <span className="live-pulse-dot"></span> Live Connected
              </span>
            ) : (
              <span className="stat-trend trend-neutral">Standby</span>
            )}
          </div>
          <div className="stat-body">
            <span className="stat-label">Active Connected Sessions</span>
            <h3 className="stat-value">{activeSessions}</h3>
          </div>
        </div>

        <div className="stat-card glass-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper cyan-badge">
              <Smartphone size={22} />
            </div>
            <span className="stat-trend trend-positive">
              <ShieldCheck size={14} /> Ready
            </span>
          </div>
          <div className="stat-body">
            <span className="stat-label">Total Instances Created</span>
            <h3 className="stat-value">{instances.length}</h3>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Recent Activity & Quick Actions */}
      <div className="overview-content-grid">
        {/* Left Column: Recent Activity Log */}
        <div className="content-card glass-card">
          <div className="card-header-styled">
            <div className="card-header-title">
              <BarChart3 size={20} className="text-primary" />
              <h3>Recent Activity</h3>
            </div>
            <button className="view-all-link-btn" onClick={() => navigate('/dashboard/reports')}>
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="activity-list">
            {filteredLogs.length === 0 ? (
              <div className="overview-empty-state">
                <div className="empty-icon-badge">
                  <BarChart3 size={32} />
                </div>
                <h4>No Recent Activity Logged</h4>
                <p>
                  {searchQuery
                    ? `No activity matching "${searchQuery}". Try clearing your search.`
                    : "Sent messages and instance activity logs will automatically appear here."}
                </p>
                <button className="empty-action-btn" onClick={() => navigate('/dashboard/messaging')}>
                  <Send size={15} /> Send First Message
                </button>
              </div>
            ) : (
              filteredLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="activity-item-styled">
                  <div className={`activity-status-box ${log.status === 'sent' ? 'success' : 'failed'}`}>
                    {log.status === 'sent' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  </div>
                  <div className="activity-details">
                    <h4 className="activity-title-text">
                      {log.status === 'sent' ? 'Message Delivered' : 'Failed Delivery'}
                    </h4>
                    <p className="activity-subtext">
                      To <span className="font-semibold text-main">{log.recipient}</span> via {log.instance?.name || 'Gateway Instance'}
                    </p>
                  </div>
                  <span className="activity-time-badge">{formatTime(log.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Quick Action Cards */}
        <div className="content-card glass-card">
          <div className="card-header-styled">
            <div className="card-header-title">
              <Zap size={20} className="text-primary" />
              <h3>Quick Actions</h3>
            </div>
          </div>

          <div className="quick-actions-grid-styled">
            <div className="q-action-card" onClick={() => navigate('/dashboard/messaging')}>
              <div className="q-icon-box emerald-bg">
                <Send size={20} />
              </div>
              <div className="q-action-info">
                <h4>Send Message</h4>
                <p>Blast single or bulk WhatsApp text & media</p>
              </div>
              <ArrowRight size={16} className="q-arrow" />
            </div>

            <div className="q-action-card" onClick={() => navigate('/dashboard/instances')}>
              <div className="q-icon-box indigo-bg">
                <Smartphone size={20} />
              </div>
              <div className="q-action-info">
                <h4>Manage Instances</h4>
                <p>Pair WhatsApp QR code & manage sessions</p>
              </div>
              <ArrowRight size={16} className="q-arrow" />
            </div>

            <div className="q-action-card" onClick={() => navigate('/dashboard/tokens')}>
              <div className="q-icon-box cyan-bg">
                <Key size={20} />
              </div>
              <div className="q-action-info">
                <h4>API Tokens</h4>
                <p>Generate API keys for developer webhooks</p>
              </div>
              <ArrowRight size={16} className="q-arrow" />
            </div>

            <div className="q-action-card" onClick={() => navigate('/dashboard/settings')}>
              <div className="q-icon-box purple-bg">
                <Settings size={20} />
              </div>
              <div className="q-action-info">
                <h4>Account Settings</h4>
                <p>Manage subscription plan & profile</p>
              </div>
              <ArrowRight size={16} className="q-arrow" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
