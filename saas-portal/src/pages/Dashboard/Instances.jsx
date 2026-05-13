import React, { useState, useEffect } from 'react';
import {
  Plus,
  MoreVertical,
  QrCode,
  Power,
  Trash2,
  MessageSquare,
  Search,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { instanceService } from '../../api/services';
import './Instances.css';

const Instances = () => {
  const { searchQuery } = useOutletContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All Status');

  useEffect(() => {
    fetchInstances();
    const interval = setInterval(fetchInstances, 5000); // Auto refresh status
    return () => clearInterval(interval);
  }, []);

  const fetchInstances = async () => {
    try {
      const res = await instanceService.getInstances();
      setInstances(res.data.instances || []);
    } catch (err) {
      console.error("Fetch Instances Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    if (e) e.preventDefault();
    setCreating(true);
    try {
      const res = await instanceService.createInstance({ name: newName });
      const newKey = res.data.instance.instanceKey;
      
      // Immediately start the session so the QR code appears
      await instanceService.initiateSession(newKey);
      
      fetchInstances();
      setStatusFilter('All Status'); // Ensure the new instance is visible
      setNewName('');
      setShowAddModal(false);
    } catch (err) {
      console.error("Create & Link Error:", err);
      alert("Failed to create and initiate instance");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (key) => {
    if (!window.confirm("Are you sure you want to delete this instance? All session data will be lost.")) return;
    try {
      await instanceService.deleteInstance(key);
      fetchInstances();
    } catch (err) {
      alert("Failed to delete instance");
    }
  };

  const handleInitiate = async (key) => {
    try {
      await instanceService.initiateSession(key);
      fetchInstances();
    } catch (err) {
      alert("Failed to initiate session");
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
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> New Instance
          </button>
        </div>
      </div>


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
              <h3 className="inst-name">{inst.name}</h3>
              <p className="inst-phone">{inst.phone || 'Scan QR to Link'}</p>
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
                  <button className="btn-action-icon text-error" title="Disconnect" onClick={() => handleInitiate(inst.instanceKey)}>
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
    </div>
  );
};

export default Instances;
