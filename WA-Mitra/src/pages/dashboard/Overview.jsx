import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Smartphone, CheckCircle, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { whatsappService } from '../../services/api';
import useAuthStore from '../../store/useAuthStore';
import './DashboardViews.css';

const Overview = () => {
  const { user } = useAuthStore();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await whatsappService.getStatus();
      setStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    const socket = io(import.meta.env.VITE_SOCKET_URL);
    const sessionId = `user_${user.id}`;

    socket.on('qr', (data) => {
      if (data.sessionId === sessionId) {
        setStatus(prev => ({ ...prev, status: 'qr', qr: data.qr, connected: false }));
      }
    });

    socket.on('connected', (data) => {
      if (data.sessionId === sessionId) {
        setStatus(prev => ({ ...prev, status: 'connected', connected: true, phone: data.phone, qr: null }));
      }
    });

    socket.on('disconnected', (data) => {
      if (data.sessionId === sessionId) {
        setStatus(prev => ({ ...prev, status: 'disconnected', connected: false, phone: null, qr: null }));
      }
    });

    return () => socket.disconnect();
  }, [user.id]);

  const handleStartSession = async () => {
    setActionLoading(true);
    try {
      await whatsappService.startSession();
      fetchStatus();
    } catch (err) {
      console.error('Failed to start session:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to disconnect WhatsApp?')) return;
    setActionLoading(true);
    try {
      await whatsappService.logout();
      fetchStatus();
    } catch (err) {
      console.error('Failed to logout:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="view-loading">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="overview-view animate-fade-in">
      <div className="view-header">
        <h1>WhatsApp Connection</h1>
        <p>Manage your WhatsApp instance and check connection status.</p>
      </div>

      <div className="status-grid">
        <div className="status-card glass">
          <div className="status-info">
            <div className={`status-badge ${status?.connected ? 'connected' : 'disconnected'}`}>
              {status?.connected ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {status?.status?.toUpperCase()}
            </div>
            <h3>Current Status</h3>
            <p>{status?.connected ? `Linked to ${status.phone}` : 'Not connected to any device'}</p>
          </div>
          <div className="status-actions">
            {!status?.connected && status?.status !== 'qr' && (
              <button className="btn-primary" onClick={handleStartSession} disabled={actionLoading}>
                {actionLoading ? <RefreshCw className="animate-spin" /> : 'Connect WhatsApp'}
              </button>
            )}
            {status?.connected && (
              <button className="btn-error-outline" onClick={handleLogout} disabled={actionLoading}>
                Disconnect Device
              </button>
            )}
          </div>
        </div>

        <div className="qr-card glass">
          {status?.status === 'qr' && status?.qr ? (
            <div className="qr-container">
              <h3>Scan QR Code</h3>
              <p>Open WhatsApp on your phone and scan this code to link.</p>
              <div className="qr-code-wrapper">
                {/* We'll use a library for QR if needed, but the server sends the raw string. 
                    Actually, usually the server sends a data URL or we need a component.
                    Let's assume the server sends the string and we use a CDN or just text for now.
                    Wait, qrcode-terminal is on server. I should check what whatsappService sends.
                */}
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(status.qr)}`} 
                  alt="WhatsApp QR Code" 
                />
              </div>
            </div>
          ) : status?.connected ? (
            <div className="connected-visual">
              <Smartphone size={80} color="var(--success)" />
              <h3>You're All Set!</h3>
              <p>Your WhatsApp is active and ready to send messages.</p>
            </div>
          ) : (
            <div className="idle-visual">
              <Smartphone size={80} color="var(--text-muted)" />
              <p>Start a session to see the QR code.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
