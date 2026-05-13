import React, { useState, useEffect } from 'react';
import {
  Send,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Users,
  MessageSquare
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { instanceService, messageService } from '../../api/services';
import './Overview.css';

const Overview = () => {
  const { searchQuery } = useOutletContext();
  const [instances, setInstances] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [instRes, logsRes] = await Promise.all([
        instanceService.getInstances(),
        messageService.getLogs()
      ]);
      setInstances(instRes.data.instances || []);
      setLogs(logsRes.data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalMessages = instances.reduce((acc, curr) => acc + (curr.messageCount || 0), 0);
  const activeSessions = instances.filter(i => i.liveStatus === 'connected').length;

  const stats = [
    { label: 'Total Messages Sent', value: totalMessages.toLocaleString(), change: '+0%', icon: <Send size={24} />, color: '#00A884' },
    { label: 'Active Sessions', value: activeSessions, change: '+0%', icon: <Activity size={24} />, color: 'var(--primary)' },
    { label: 'Total Instances', value: instances.length, change: '+0%', icon: <Smartphone size={24} />, color: '#6366f1' },
  ];

  const filteredLogs = logs.filter(log =>
    (log.recipient?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (log.instance?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <div className="overview-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening with your instances.</p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card glass">
            <div className="stat-header">
              <div className="stat-icon" style={{ color: stat.color, background: `${stat.color}10` }}>
                {stat.icon}
              </div>
            </div>
            <div className="stat-body">
              <span className="stat-label">{stat.label}</span>
              <h3 className="stat-value">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="overview-content-grid">
        <div className="content-card glass">
          <div className="card-header">
            <h3>Recent Activity</h3>
            <button className="text-btn" onClick={() => window.location.href = '/dashboard/reports'}>View All</button>
          </div>
          <div className="activity-list">
            {filteredLogs.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                {searchQuery ? "No matching activity found." : "No recent activity found."}
              </p>
            ) : (
              filteredLogs.map((log) => (
                <ActivityItem
                  key={log.id}
                  icon={log.status === 'sent' ? <CheckCircle2 size={16} color="#10b981" /> : <AlertCircle size={16} color="#ef4444" />}
                  title={log.status === 'sent' ? "Message Sent Successfully" : "Failed to Send"}
                  desc={`To ${log.recipient} from ${log.instance?.name || 'Instance'}`}
                  time={formatTime(log.createdAt)}
                />
              ))
            )}
          </div>
        </div>

        <div className="content-card glass">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions-grid">
            <button className="q-action-btn" onClick={() => window.location.href = '/dashboard/messaging'}>
              <Send size={20} />
              <span>Send Message</span>
            </button>
            <button className="q-action-btn" onClick={() => window.location.href = '/dashboard/instances'}>
              <Smartphone size={20} />
              <span>Manage Instances</span>
            </button>
            <button className="q-action-btn" onClick={() => window.location.href = '/dashboard/tokens'}>
              <Activity size={20} />
              <span>API Tokens</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityItem = ({ icon, title, desc, time }) => (
  <div className="activity-item">
    <div className="activity-icon-wrap">{icon}</div>
    <div className="activity-info">
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
    <span className="activity-time">{time}</span>
  </div>
);

export default Overview;
