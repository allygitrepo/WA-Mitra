import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  Power,
  Trash2,
  MessageSquare,
  AlertCircle,
  X
} from 'lucide-react';
import { useOutletContext, Link } from 'react-router-dom';
import { instanceService } from '../../api/services';
import useAuthStore from '../../store/useAuthStore';
import API from '../../api/axiosConfig';
import toast from 'react-hot-toast';
import CustomModal from '../../components/CustomModal';
import { io } from 'socket.io-client';
import './Instances.css';

const Instances = () => {
  const { searchQuery } = useOutletContext();
  const { user } = useAuthStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [currentPackage, setCurrentPackage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    onCancel: () => { }
  });
  const toastedErrorsRef = useRef({});

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [instRes, pkgsRes] = await Promise.all([
        instanceService.getInstances(),
        API.get('/plans/all')
      ]);
      setInstances(instRes.data.instances || []);
      const pkgs = pkgsRes.data.packages || [];
      const pkg = pkgs.find(p => p.id === user?.packageId) || user?.package;
      setCurrentPackage(pkg);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchInstances = useCallback(async () => {
    try {
      const res = await instanceService.getInstances();
      const fetched = res.data.instances || [];

      // Toast duplicate phone number / connection errors
      fetched.forEach(inst => {
        if (inst.error && toastedErrorsRef.current[inst.instanceKey] !== inst.error) {
          toast.error(`${inst.name}: ${inst.error}`);
          toastedErrorsRef.current[inst.instanceKey] = inst.error;
        } else if (!inst.error && toastedErrorsRef.current[inst.instanceKey]) {
          delete toastedErrorsRef.current[inst.instanceKey];
        }
      });

      setInstances(fetched);
    } catch (err) {
      console.error("Fetch Instances Error:", err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (active) {
        fetchData();
      }
    }, 0);
    const interval = setInterval(fetchInstances, 5000); // Auto refresh status
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fetchData, fetchInstances]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_BASE_URL.split('/wa-mitra')[0];
    const socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('Instances socket connected:', socket.id);
      instances.forEach(inst => {
        socket.emit('join_room', inst.instanceKey);
      });
    });

    const updateInstance = (instanceKey, updates) => {
      setInstances(prev => prev.map(inst => {
        if (inst.instanceKey === instanceKey) {
          return { ...inst, ...updates };
        }
        return inst;
      }));
    };

    socket.on('qr', (data) => {
      console.log('Socket qr event:', data);
      updateInstance(data.instanceKey, {
        liveStatus: 'qr_ready',
        qr: data.qr,
        error: null
      });
    });

    socket.on('connected', (data) => {
      console.log('Socket connected event:', data);
      updateInstance(data.instanceKey, {
        liveStatus: 'connected',
        qr: null,
        pushName: data.pushName,
        phone: data.phone,
        profilePic: data.profilePic,
        error: null
      });
    });

    socket.on('disconnected', (data) => {
      console.log('Socket disconnected event:', data);
      updateInstance(data.instanceKey, {
        liveStatus: 'disconnected',
        qr: null,
        error: data.error || null
      });
    });

    socket.on('loading', (data) => {
      console.log('Socket loading event:', data);
      updateInstance(data.instanceKey, {
        liveStatus: 'connecting',
        qr: null
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [instances.length]);

  const isLimitReached = currentPackage &&
    currentPackage.instanceLimit !== -1 &&
    instances.length >= currentPackage.instanceLimit;

  const handleCreate = async (e) => {
    if (e) e.preventDefault();
    setCreating(true);
    const loadingToast = toast.loading("Creating instance...");
    try {
      const res = await instanceService.createInstance({ name: newName });
      const newKey = res.data.instance.instanceKey;

      // Immediately start the session so the QR code appears
      await instanceService.initiateSession(newKey);

      fetchInstances();
      setStatusFilter('All Status'); // Ensure the new instance is visible
      setNewName('');
      setShowAddModal(false);
      toast.success("Instance created and initialized!", { id: loadingToast });
    } catch (err) {
      console.error("Create & Link Error:", err);
      toast.error("Failed to create and initiate instance", { id: loadingToast });
    } finally {
      setCreating(false);
    }
  };

  const executeDelete = async (key) => {
    const loadingToast = toast.loading("Deleting WhatsApp instance...");
    try {
      await instanceService.deleteInstance(key);
      fetchInstances();
      toast.success("Instance deleted successfully.", { id: loadingToast });
    } catch {
      toast.error("Failed to delete instance", { id: loadingToast });
    }
  };

  const handleDelete = (key) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete WhatsApp Instance?',
      message: 'Are you sure you want to delete this WhatsApp instance? All active sessions, linked chats, and logs will be permanently removed. This action is irreversible.',
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        executeDelete(key);
      },
      onCancel: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleInitiate = async (key) => {
    const loadingToast = toast.loading("Initializing session...");
    try {
      await instanceService.initiateSession(key);
      fetchInstances();
      toast.success("Session initiated! Ready to link.", { id: loadingToast });
    } catch {
      toast.error("Failed to initiate session", { id: loadingToast });
    }
  };

  // Filter Logic
  const filteredInstances = instances.filter(inst => {
    const matchesSearch =
      (inst.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (inst.instanceKey?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All Status' ||
      inst.liveStatus.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="instances-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">WhatsApp Instances</h1>
          <p className="page-subtitle">Manage your linked WhatsApp accounts and their status.</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'center' }}>
          <div className="custom-dropdown-container" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="custom-dropdown-trigger"
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              <span>{statusFilter}</span>
              <span style={{ fontSize: '10px', opacity: 0.6 }}>▼</span>
            </button>
            {showStatusDropdown && (
              <div
                className="premium-dropdown-list animate-slide-down"
                style={{
                  position: 'absolute',
                  top: '48px',
                  right: 0,
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 100,
                  minWidth: '150px',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                {['All Status', 'Connected', 'Disconnected'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setStatusFilter(status);
                      setShowStatusDropdown(false);
                    }}
                    className={`custom-dropdown-item ${statusFilter === status ? 'active' : ''}`}
                  >
                    <span>{status}</span>
                    {statusFilter === status && <span style={{ color: '#10B981', fontSize: '12px' }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className={`premium-btn-primary ${isLimitReached ? 'disabled' : ''}`}
            onClick={() => !isLimitReached && setShowAddModal(true)}
            disabled={isLimitReached}
            title={isLimitReached ? "Instance limit reached for your current plan" : ""}
            style={{ height: '42px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
          >
            <Plus size={18} /> New Instance
          </button>
        </div>
      </div>

      {isLimitReached && (
        <div className="limit-reached-alert animate-slide-down">
          <AlertCircle size={18} />
          <p>You have reached your instance limit (<strong>{currentPackage.instanceLimit}</strong>). <Link to="/dashboard/plans" className="text-primary font-bold underline">Upgrade your plan</Link> to add more.</p>
        </div>
      )}


      <div className="instances-grid">
        {filteredInstances.length === 0 && !loading && (
          <div className="no-plan-card-premium" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 32px', textAlign: 'center', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '18px', boxShadow: 'var(--shadow-sm)', marginTop: '24px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <MessageSquare size={32} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 8px 0' }}>No WhatsApp Instances</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0', lineHeight: '1.5' }}>
              No instances matching your criteria found. Link a new WhatsApp account to start sending messages.
            </p>
          </div>
        )}
        {filteredInstances.map((inst) => (
          <div key={inst.instanceKey} className="instance-card glass">
            <div className="card-top">
              <div className="status-badge" data-status={inst.liveStatus}>
                <span className="dot"></span>
                {inst.liveStatus}
              </div>
              <button className="icon-btn-sm" onClick={() => handleDelete(inst.instanceKey)}>
                <Trash2 size={18} className="text-error" />
              </button>
            </div>

            <div className="card-middle">
              <h3 className="inst-name" style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '12px' }}>{inst.name}</h3>

              {inst.liveStatus === 'connected' ? (
                <div className="profile-section animate-fade-in">
                  <div className={`profile-avatar ${inst.profilePic ? 'clickable' : ''}`} onClick={() => inst.profilePic && setPreviewImage(inst.profilePic)}>
                    {inst.profilePic ? (
                      <img src={inst.profilePic} alt={inst.pushName} />
                    ) : (
                      <div className="avatar-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'var(--surface-hover)', color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{inst.pushName?.charAt(0) || '?'}</span>
                      </div>
                    )}
                  </div>
                  <div className="profile-info">
                    <span className="push-name">{inst.pushName || 'WhatsApp User'}</span>
                    <span className="inst-phone">+{inst.phone}</span>
                  </div>
                </div>
              ) : (
                <p className="inst-phone" style={{ marginBottom: '12px' }}>{inst.phone || 'Scan QR to Link'}</p>
              )}

              <div className="inst-key-box">
                <code>{inst.instanceKey}</code>
              </div>
            </div>

            {inst.qr ? (
              <div className="qr-box animate-fade-in">
                <img src={inst.qr} alt="Scan me" />
                <p>Scan with WhatsApp</p>
              </div>
            ) : (
              inst.liveStatus === 'qr_ready' && (
                <div className="qr-box expired-qr animate-fade-in" style={{ border: '1px dashed var(--border)', padding: '24px 16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px', background: 'var(--surface-hover)' }}>
                  <AlertCircle size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 12px 0', textTransform: 'none', fontWeight: '500' }}>QR Code Expired</p>
                  <button
                    className="premium-btn-primary"
                    onClick={() => handleInitiate(inst.instanceKey)}
                    style={{ fontSize: '12px', padding: '6px 14px', height: 'auto', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Regenerate QR
                  </button>
                </div>
              )
            )}

            <div className="card-bottom">
              <div className="inst-meta">
                <MessageSquare size={14} />
                <span>{inst.messageCount || 0} sent</span>
              </div>
              <div className="card-actions">
                {(inst.liveStatus === 'disconnected' || (inst.liveStatus === 'qr_ready' && !inst.qr)) && (
                  <button className="btn-action-icon" title="Initialize" onClick={() => handleInitiate(inst.instanceKey)}>
                    <Power size={18} />
                  </button>
                )}
                {inst.liveStatus === 'connected' && (
                  <button className="btn-action-icon text-error" title="Disconnect & Remove" onClick={() => handleDelete(inst.instanceKey)}>
                    <Power size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Mockup */}
      {showAddModal && (
        <div className="modal-overlay">
          <form className="modal-content animate-fade-in" onSubmit={handleCreate}>
            <div className="modal-header">
              <h3>Create New Instance</h3>
              <button type="button" className="close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Instance Name</label>
                <input
                  type="text"
                  className="auth-input"
                  style={{ paddingLeft: '14px' }}
                  placeholder="e.g. Marketing Line, Customer Support"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <p className="modal-hint">A unique instance key will be generated automatically.</p>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border)' }}>
              <button type="button" className="premium-btn-outline" onClick={() => setShowAddModal(false)} style={{ width: '120px', height: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>Cancel</button>
              <button type="submit" className="premium-btn-primary" disabled={creating} style={{ width: '150px', height: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginLeft: '12px' }}>
                {creating ? 'Creating...' : 'Create & Link'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && createPortal(
        <div className="image-preview-overlay animate-fade-in" onClick={() => setPreviewImage(null)}>
          <button className="preview-close" onClick={() => setPreviewImage(null)}>
            <X size={24} />
          </button>
          <img src={previewImage} alt="Profile Preview" className="preview-image" onClick={e => e.stopPropagation()} />
        </div>,
        document.body
      )}

      <CustomModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
        okText="Delete Instance"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Instances;
