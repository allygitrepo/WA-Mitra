import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Smartphone,
  MessageSquare,
  IndianRupee,
  Calendar,
  Layers,
  Save,
  Shield,
  Globe,
  Ban
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import API from '../../api/axiosConfig';
import toast from 'react-hot-toast';
import CustomModal from '../../components/CustomModal';
import '../Dashboard/Dashboard.css';
import '../Dashboard/Overview.css';
import './Admin.css';

const AdminPackages = () => {
  const { searchQuery } = useOutletContext();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const initialFormState = {
    name: '',
    price: '',
    duration: 30,
    isOneTime: false,
    instanceLimit: 1,
    messageLimit: 1000,
    dailyMessageLimit: 100,
    canSendMedia: true,
    isActive: true,
    isPublic: true
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await API.get('/admin/packages');
      setPackages(res.data.packages || []);
    } catch (err) {
      console.error("Fetch Packages Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Saving plan details...");
    try {
      if (editingId) {
        await API.put(`/admin/packages/${editingId}`, formData);
        toast.success("Package updated successfully!", { id: loadingToast });
      } else {
        await API.post('/admin/packages', formData);
        toast.success("New package published successfully!", { id: loadingToast });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(initialFormState);
      fetchPackages();
    } catch (err) {
      toast.error("Failed to save package details", { id: loadingToast });
    }
  };

  const handleEdit = (pkg) => {
    setFormData(pkg);
    setEditingId(pkg.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const executeDelete = async (id) => {
    const loadingToast = toast.loading("Deleting service package...");
    try {
      await API.delete(`/admin/packages/${id}`);
      fetchPackages();
      toast.success("Package deleted successfully.", { id: loadingToast });
    } catch (err) {
      toast.error("Failed to delete package", { id: loadingToast });
    }
  };

  const handleDelete = (id) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Service Package?',
      message: 'Are you sure you want to delete this subscription plan? Users currently enrolled under this package may be affected or lose access to specific boundaries. This action is irreversible.',
      onConfirm: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        executeDelete(id);
      },
      onCancel: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const filteredPackages = packages.filter(p =>
    p.name.toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  return (
    <div className="admin-packages-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Service Packages</h1>
          <p className="page-subtitle">Define limits and pricing for your subscription plans.</p>
        </div>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={18} /> New Package
          </button>
        )}
      </div>

      {showForm && (
        <div className="package-form-modern glass animate-slide-down mb-32 p-8">
          <div className="form-header-modern mb-8">
            <h2 className="text-xl font-bold">{editingId ? 'Edit Package' : 'Create New Package'}</h2>
            <button className="close-btn" onClick={() => { setShowForm(false); setEditingId(null); setFormData(initialFormState); }}>
              <X size={26} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Section: Basic Information */}
            <div className="form-section mb-16">
              <div className="section-title">BASIC INFORMATION</div>
              <div className="form-grid-three">
                <div className="form-field-modern">
                  <label>Package Name *</label>
                  <input
                    type="text"
                    placeholder="Enter name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-field-modern">
                  <label>Amount (₹) *</label>
                  <div className="input-with-label">
                    <span className="left-label">₹</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-field-modern">
                  <label>Duration (Days) *</label>
                  <div className="input-with-label">
                    <input
                      type="number"
                      placeholder="30"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value === '' ? '' : parseInt(e.target.value) })}
                    />
                    <span className="right-label">Days</span>
                  </div>
                  <span className="field-hint">-1 for Lifetime</span>
                </div>
              </div>
            </div>
            <br></br>

            {/* Section: Platform Settings */}
            <div className="form-section mb-16">
              <div className="section-title">PLATFORM SETTINGS</div>
              <div className="form-grid-three">
                <div className="form-field-modern">
                  <label>Instance Limit</label>
                  <input
                    type="number"
                    value={formData.instanceLimit}
                    onChange={(e) => setFormData({ ...formData, instanceLimit: parseInt(e.target.value) })}
                  />
                  <span className="field-hint">-1 for Unlimited</span>
                </div>
                <div className="form-field-modern">
                  <label>Monthly Message Limit</label>
                  <input
                    type="number"
                    value={formData.messageLimit}
                    onChange={(e) => setFormData({ ...formData, messageLimit: parseInt(e.target.value) })}
                  />
                  <span className="field-hint">-1 for Unlimited</span>
                </div>
                <div className="form-field-modern">
                  <label>Daily Message Limit</label>
                  <input
                    type="number"
                    value={formData.dailyMessageLimit}
                    onChange={(e) => setFormData({ ...formData, dailyMessageLimit: parseInt(e.target.value) })}
                  />
                  <span className="field-hint">-1 for Unlimited</span>
                </div>
              </div>
            </div>
            <br></br>
            <br></br>
            {/* Section: Feature Permissions & Status */}
            <div className="form-section mb-12">
              <div className="section-title">FEATURE PERMISSIONS & STATUS</div>
              <div className="toggles-row-container" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '16px', alignItems: 'center' }}>
                <div
                  className={`feature-toggle-card-small ${formData.isOneTime ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, isOneTime: !formData.isOneTime })}
                >
                  <div className={`custom-switch-small ${formData.isOneTime ? 'on' : ''}`}></div>
                  <div className="feature-info">
                    <div className="feature-name-small">One-Time</div>
                    <div className="feature-desc-small">Single purchase</div>
                  </div>
                </div>

                <div
                  className={`feature-toggle-card-small ${formData.canSendMedia ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, canSendMedia: !formData.canSendMedia })}
                >
                  <div className={`custom-switch-small ${formData.canSendMedia ? 'on' : ''}`}></div>
                  <div className="feature-info">
                    <div className="feature-name-small">Media</div>
                    <div className="feature-desc-small">Send files</div>
                  </div>
                </div>

                <div
                  className={`feature-toggle-card-small ${formData.isPublic ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
                >
                  <div className={`custom-switch-small ${formData.isPublic ? 'on' : ''}`}></div>
                  <div className="feature-info">
                    <div className="feature-name-small">Public Plan</div>
                    <div className="feature-desc-small">Visible on landing</div>
                  </div>
                </div>

                <div
                  className={`feature-toggle-card-small ${formData.isActive ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                >
                  <div className={`custom-switch-small ${formData.isActive ? 'on' : ''}`}></div>
                  <div className="feature-info">
                    <div className="feature-name-small">Active Plan</div>
                    <div className="feature-desc-small">Published</div>
                  </div>
                </div>

                <div className="flex items-center gap-5 ml-auto pl-6 border-l border-white/10" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', marginLeft: '180px' }}>
                  <button
                    type="submit"
                    className="btn-primary shadow-glow"
                    style={{
                      width: '160px',
                      height: '44px',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      marginRight: '16px'
                    }}
                  >
                    {editingId ? 'Update' : 'Publish Plan'}
                  </button>
                  <button
                    type="button"
                    className="btn-outline-pill"
                    onClick={() => { setShowForm(false); setEditingId(null); setFormData(initialFormState); }}
                    style={{ width: '160px', height: '44px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
      <div className="glass mt-4 overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Package Details</th>
              <th>Pricing</th>
              <th>Restrictions</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="text-center py-20">Loading plans...</td></tr>
            ) : filteredPackages.map(pkg => (
              <tr key={pkg.id} className={!pkg.isActive ? 'inactive-row' : ''}>
                <td>
                  <div className="font-bold text-lg">{pkg.name}</div>
                </td>
                <td>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 font-bold text-base">
                      <Layers size={14} className="text-muted" />
                      <span>₹{pkg.price}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Calendar size={14} />
                      <span>{pkg.isOneTime ? 'One-Time' : pkg.duration === -1 ? 'Lifetime' : `${pkg.duration} Days`}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex flex-col gap-2">
                    <div className="view-limits-trigger">
                      <div className="flex items-center gap-4">
                        <Shield size={14} className="text-primary" />
                        <span className="text-sm font-semibold cursor-pointer hover:text-primary transition-colors">  View Limits</span>
                      </div>
                      <div className="limits-tooltip glass">
                        <div className="tooltip-item">
                          <span>Instances:</span>
                          <strong>{pkg.instanceLimit}</strong>
                        </div>
                        <div className="tooltip-item">
                          <span>Messages:</span>
                          <strong>{pkg.messageLimit.toLocaleString()}</strong>
                        </div>
                        <div className="tooltip-item">
                          <span>Daily Cap:</span>
                          <strong>{pkg.dailyMessageLimit}</strong>
                        </div>
                        <div className="tooltip-item">
                          <span>Media:</span>
                          <strong>{pkg.canSendMedia ? 'YES' : 'NO'}</strong>
                        </div>
                      </div>
                    </div>

                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span className={`status-pill ${pkg.isActive ? 'enabled' : 'disabled'}`}>
                      {pkg.isActive ? 'Enabled' : 'Disabled'}
                    </span>
                    <span className={`status-pill ${pkg.isPublic ? 'enabled' : 'disabled'}`} style={{ fontSize: '0.7rem' }}>
                      {pkg.isPublic ? '🌐 Public' : '🔒 Private'}
                    </span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                    <button className="icon-btn-action ban" title="Deactivate">
                      <Ban size={16} />
                    </button>
                    <button className="icon-btn-action edit" onClick={() => handleEdit(pkg)} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button className="icon-btn-action delete" onClick={() => handleDelete(pkg.id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <CustomModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
        okText="Delete Package"
        cancelText="Keep Package"
      />
    </div>
  );
};

export default AdminPackages;
