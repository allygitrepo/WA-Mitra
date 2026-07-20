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
  const [currentPackage, setCurrentPackage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });
  const toastedErrorsRef = useRef({});

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
        <div className="header-actions">
          <select 
            className="filter-select" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            <option>Connected</option>
            <option>Disconnected</option>
          </select>
          <button 
            className={`btn-primary ${isLimitReached ? 'disabled' : ''}`} 
            onClick={() => !isLimitReached && setShowAddModal(true)}
            disabled={isLimitReached}
            title={isLimitReached ? "Instance limit reached for your current plan" : ""}
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
          <div className="empty-state">No instances matching your criteria found.</div>
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

            {inst.qr && (
              <div className="qr-box animate-fade-in">
                <img src={inst.qr} alt="Scan me" />
                <p>Scan with WhatsApp</p>
              </div>
            )}

            <div className="card-bottom">
              <div className="inst-meta">
                <MessageSquare size={14} />
                <span>{inst.messageCount || 0} sent</span>
              </div>
              <div className="card-actions">
                {inst.liveStatus === 'disconnected' && !inst.qr && (
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
          <form className="modal-content glass animate-fade-in" onSubmit={handleCreate}>
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
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={creating}>
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
