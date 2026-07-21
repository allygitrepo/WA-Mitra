import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  MessageSquare,
  Calendar,
  Trash2,
  Briefcase,
  Plus,
  Package,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X as CloseIcon,
  Shield,
  User,
  Edit2
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import API from '../../api/axiosConfig';
import toast from 'react-hot-toast';
import '../Dashboard/Dashboard.css';
import '../Dashboard/Overview.css';
import './Admin.css';
import CustomDateInput from '../../components/CustomDateInput';

const AdminUsers = () => {
  const { searchQuery } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [assigningUser, setAssigningUser] = useState(null);
  const [extendingUser, setExtendingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [suspendingUser, setSuspendingUser] = useState(null);
  const [expandedUserIds, setExpandedUserIds] = useState({});
  const [activeView, setActiveView] = useState('list'); // 'list' or 'usage'
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin',
    packageId: ''
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchUsers = async () => {
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error("Fetch Users Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const res = await API.get('/admin/packages');
      setPackages(res.data.packages || []);
    } catch (err) {
      console.error("Fetch Packages Error:", err);
    }
  };

  const handleStatusChange = async (userId, currentStatus, reason = null) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const loadingToast = toast.loading("Updating user status...");
    try {
      await API.post('/admin/users/status', { userId, status: newStatus, reason });
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus, suspendReason: reason } : u));
      toast.success(`User status updated to ${newStatus}!`, { id: loadingToast });
    } catch {
      toast.error("Failed to update user status", { id: loadingToast });
    }
  };

  const handleToggleStatus = (user) => {
    if (user.status === 'active') {
      setSuspendingUser(user);
    } else {
      handleStatusChange(user.id, 'suspended');
    }
  };

  const handleDeleteUser = async (userId) => {
    const loadingToast = toast.loading("Deleting user and cleaning up data...");
    try {
      await API.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
      toast.success("User deleted successfully!", { id: loadingToast });
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to delete user";
      toast.error(errMsg, { id: loadingToast });
    }
  };

  const handleAssignPackage = async (userId, packageId) => {
    const loadingToast = toast.loading("Assigning package...");
    try {
      await API.post('/admin/users/assign-package', { userId, packageId });
      setAssigningUser(null);
      fetchUsers();
      toast.success("Package assigned successfully!", { id: loadingToast });
    } catch {
      toast.error("Failed to assign package", { id: loadingToast });
    }
  };

  const handleExtendExpiry = async (userId, expiresAt) => {
    const loadingToast = toast.loading("Updating expiration date...");
    try {
      await API.post('/admin/users/extend-expiry', { userId, expiresAt });
      setExtendingUser(null);
      fetchUsers();
      toast.success("Expiration date updated successfully!", { id: loadingToast });
    } catch {
      toast.error("Failed to update expiration date", { id: loadingToast });
    }
  };

  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (active) {
        fetchUsers();
        fetchPackages();
      }
    }, 0);
    return () => {
      active = false;
    };
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading("Creating admin account...");
    try {
      await API.post('/admin/users', formData);
      setShowForm(false);
      setFormData({ username: '', email: '', password: '', role: 'admin', packageId: '' });
      fetchUsers();
      toast.success("Admin created successfully!", { id: loadingToast });
    } catch {
      toast.error("Failed to create admin account", { id: loadingToast });
    }
  };

  const filteredUsers = users.filter(u => {
    if (u.role === 'user' && !u.isVerified) return false;

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch = u.username.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      u.email.toLowerCase().includes((searchQuery || '').toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredUsers.slice(indexOfFirstRow, indexOfLastRow);

  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (active) {
        setCurrentPage(1);
      }
    }, 0);
    return () => {
      active = false;
    };
  }, [roleFilter, searchQuery]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB');
  };

  return (
    <div className="admin-users-container animate-fade-in">
      {assigningUser && (
        <AssignPackageModal
          user={assigningUser}
          onClose={() => setAssigningUser(null)}
          packages={packages}
          handleAssignPackage={handleAssignPackage}
        />
      )}

      {extendingUser && (
        <ExtendExpiryModal
          user={extendingUser}
          onClose={() => setExtendingUser(null)}
          handleExtendExpiry={handleExtendExpiry}
        />
      )}

      {suspendingUser && (
        <SuspendUserModal
          user={suspendingUser}
          onClose={() => setSuspendingUser(null)}
          handleStatusChange={handleStatusChange}
        />
      )}

      {deletingUser && (
        <DeleteUserModal
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          handleDeleteUser={handleDeleteUser}
        />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Monitor system users, their quotas, and active status.</p>
        </div>
        {!showForm && (
          <button className="premium-add-btn" onClick={() => setShowForm(true)}>
            <Plus size={18} /> Add User
          </button>
        )}
      </div>

      {showForm && (
        <div className="package-form-modern glass animate-slide-down mb-12 p-8">
          <div className="form-header-modern mb-8">
            <h2 className="text-xl font-bold">Add New Portal Admin</h2>
            <button className="close-btn" onClick={() => setShowForm(false)}>
              <CloseIcon size={24} />
            </button>
          </div>

          <form onSubmit={handleCreateUser}>
            <div className="form-section mb-10">
              <div className="section-title">ADMIN ACCOUNT DETAILS</div>
              <div className="form-grid-three">
                <div className="form-field-modern">
                  <label>Username *</label>
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-field-modern">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-field-modern">
                  <label>Initial Password *</label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="form-footer-modern" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', flexWrap: 'nowrap', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
              <button type="submit" className="premium-btn-primary" style={{ width: '160px', height: '44px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                Create Admin
              </button>
              <button type="button" className="premium-btn-outline" onClick={() => setShowForm(false)} style={{ width: '160px', height: '44px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="users-filter-bar mt-4">
        <div className="filter-tabs-modern">
          <button
            className={`filter-tab-text ${roleFilter === 'all' && activeView === 'list' ? 'active' : ''}`}
            onClick={() => { setActiveView('list'); setRoleFilter('all'); }}
          >
            All Users
          </button>
          <button
            className={`filter-tab-text ${roleFilter === 'user' && activeView === 'list' ? 'active' : ''}`}
            onClick={() => { setActiveView('list'); setRoleFilter('user'); }}
          >
            Business Owners
          </button>
          <button
            className={`filter-tab-text ${roleFilter === 'admin' && activeView === 'list' ? 'active' : ''}`}
            onClick={() => { setActiveView('list'); setRoleFilter('admin'); }}
          >
            Portal Admins
          </button>
          <button
            className={`filter-tab-text ${activeView === 'usage' ? 'active' : ''}`}
            onClick={() => {
              setActiveView('usage');
            }}
          >
            Usage Analytics
          </button>
        </div>
      </div>

      {activeView === 'list' ? (
        <div className="premium-table-card animate-fade-in">
          <div className="premium-table-wrapper">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Registered</th>
                  <th>Package</th>
                  <th>Access</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-10">Loading users...</td></tr>
                ) : currentRows.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-10">No users found.</td></tr>
                ) : (
                  currentRows.map(user => {
                    return (
                      <React.Fragment key={user.id}>
                        <tr 
                          className={expandedUserIds[user.id] ? 'user-expanded-row' : ''}
                        >
                          <td>
                            <div className="flex-row-center-gap-16">
                              <div className="premium-avatar">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-col-left">
                                <div className="premium-username">{user.username}</div>
                                <div className="premium-email">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className={`premium-role-badge ${user.role === 'admin' ? 'portal-admin' : 'business-owner'}`}>
                              {user.role === 'admin' ? <Shield size={12} /> : <Briefcase size={12} />}
                              <span>{user.role === 'admin' ? 'Portal Admin' : 'Business Owner'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="text-sm font-medium">
                              {formatDate(user.createdAt)}
                            </div>
                          </td>
                          <td>
                            <div className="flex-col-left">
                              <div className="flex-row-center-gap-8">
                                <span className="premium-package-badge">
                                  {user.package?.name || 'Free'}
                                </span>
                                {user.payments?.[0]?.paymentMethod === 'manual_admin' && (
                                  <span className="user-manual-assigned-badge">
                                    Manual
                                  </span>
                                )}
                              </div>
                              <div className="premium-expiry">
                                Expires: {user.expiresAt ? formatDate(user.expiresAt) : 'Never'}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center">
                              <div className="flex-col-left" style={{ gap: '4px' }}>
                                <div className="flex items-center">
                                  <label className="premium-switch">
                                    <input
                                      type="checkbox"
                                      checked={user.status === 'active'}
                                      onChange={() => handleToggleStatus(user)}
                                      disabled={user.role === 'admin'}
                                    />
                                    <span className="premium-slider"></span>
                                  </label>
                                  <span className={`premium-switch-label ${user.status === 'active' ? 'active' : 'suspended'}`}>
                                    {user.status === 'active' ? 'Active' : 'Suspended'}
                                  </span>
                                </div>
                                {user.status === 'suspended' && user.suspendReason && (
                                  <div 
                                    className="user-suspend-reason" 
                                    style={{ 
                                      fontSize: '11px', 
                                      color: '#ef4444', 
                                      maxWidth: '180px', 
                                      whiteSpace: 'nowrap', 
                                      overflow: 'hidden', 
                                      textOverflow: 'ellipsis' 
                                    }} 
                                    title={user.suspendReason}
                                  >
                                    Reason: {user.suspendReason}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="flex-row-center-gap-8">
                              {user.role !== 'admin' && (
                                <>
                                  <button
                                    className="premium-action-btn hover-indigo"
                                    title="Assign Package"
                                    onClick={() => setAssigningUser(user)}
                                  >
                                    <Package size={16} />
                                  </button>

                                  <button
                                    className="premium-action-btn hover-blue"
                                    title="Extend Expiry Date"
                                    onClick={() => setExtendingUser(user)}
                                  >
                                    <Calendar size={16} />
                                  </button>

                                  <button 
                                    className="premium-action-btn hover-danger" 
                                    title="Delete User"
                                    onClick={() => setDeletingUser(user)}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedUserIds[user.id] && user.role !== 'admin' && (
                          <tr className="user-expanded-row">
                            <td colSpan="6" className="user-expanded-cell">
                              <div className="animate-slide-down user-breakdown-container">
                                <div className="user-breakdown-header">
                                  <Smartphone size={16} className="text-primary" />
                                  <h4 className="user-breakdown-title">
                                    Instances Breakdown for {user.username}
                                  </h4>
                                </div>
                                {user.instances && user.instances.length > 0 ? (
                                  <table className="admin-subtable">
                                    <thead>
                                      <tr>
                                        <th>Instance Name</th>
                                        <th>Instance Key</th>
                                        <th>Phone Number</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Messages Sent</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {user.instances.map(inst => (
                                        <tr key={inst.id}>
                                          <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{inst.name}</td>
                                          <td>
                                            <code className="subtable-code-key">{inst.instanceKey}</code>
                                          </td>
                                          <td>{inst.phone ? `+${inst.phone}` : 'Not Linked'}</td>
                                          <td>
                                            <span className={`user-breakdown-card-status ${inst.status === 'connected' ? 'connected' : 'disconnected'}`}>
                                              <span className="user-breakdown-card-status-dot"></span>
                                              {inst.status}
                                            </span>
                                          </td>
                                          <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-main)' }}>{inst.messageCount || 0}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                ) : (
                                  <div className="admin-empty-state" style={{ padding: '40px 24px', marginTop: '8px' }}>
                                    <div className="admin-empty-state-icon-box" style={{ width: '48px', height: '48px', padding: '12px' }}>
                                      <MessageSquare size={24} />
                                    </div>
                                    <div>
                                      <h4 className="admin-empty-state-title">No WhatsApp Instances</h4>
                                      <p className="admin-empty-state-desc">No WhatsApp instances have been configured or linked for this user yet.</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="premium-pagination">
            <div className="premium-rows-dropdown">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="premium-select"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>

            <div className="premium-pagination-info">
              <span>Showing {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredUsers.length)} of {filteredUsers.length} users</span>
            </div>

            <div className="premium-pagination-controls">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="premium-page-btn"
                title="Previous Page"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="premium-page-btn"
                title="Next Page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="premium-table-card animate-fade-in">
          <div className="premium-table-wrapper">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Business Owner</th>
                  <th>Plan</th>
                  <th>Expires</th>
                  <th>Instances</th>
                  <th>Messages Sent</th>
                  <th>Quota Usage</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.role === 'user' && u.isVerified).filter(u => 
                  u.username.toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                  u.email.toLowerCase().includes((searchQuery || '').toLowerCase())
                ).length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-muted">
                      No business owners found.
                    </td>
                  </tr>
                ) : (
                  users
                    .filter(u => u.role === 'user' && u.isVerified)
                    .filter(u => 
                      u.username.toLowerCase().includes((searchQuery || '').toLowerCase()) || 
                      u.email.toLowerCase().includes((searchQuery || '').toLowerCase())
                    )
                    .map(u => {
                      const uInstances = u.instances || [];
                      const connectedInstances = uInstances.filter(inst => inst.status === 'connected');
                      const uMessages = uInstances.reduce((sum, inst) => sum + (inst.messageCount || 0), 0) || 0;
                      const isExpanded = !!expandedUserIds[u.id];
                      
                      return (
                        <React.Fragment key={u.id}>
                          <tr className={isExpanded ? 'user-expanded-row' : ''}>
                            <td>
                              <div className="flex-row-center-gap-16">
                                <div className="premium-avatar">
                                  {u.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-col-left">
                                  <div className="premium-username">{u.username}</div>
                                  <div className="premium-email">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="premium-package-badge">
                                {u.package?.name || 'Free'}
                              </span>
                            </td>
                            <td>
                              <div className="text-sm font-medium">
                                {u.expiresAt ? formatDate(u.expiresAt) : 'Never'}
                              </div>
                            </td>
                            <td>
                              <div className="text-sm font-semibold flex-center-gap-6">
                                <Smartphone size={14} className="text-primary" />
                                <span>{connectedInstances.length} Instance{connectedInstances.length !== 1 ? 's' : ''}</span>
                              </div>
                            </td>
                            <td>
                              <div className="text-sm font-semibold flex-center-gap-6">
                                <MessageSquare size={14} className="text-primary" />
                                <span>{uMessages} Dispatched</span>
                              </div>
                            </td>
                            <td style={{ minWidth: '180px' }}>
                              {u.package ? (
                                <div className="flex-col-gap-2">
                                  <div className="progress-bar-bg" style={{ margin: '0' }}>
                                    <div 
                                      className="progress-bar-fill" 
                                      style={{ 
                                        width: u.package.messageLimit === -1 ? '100%' : `${Math.min(100, (uMessages / u.package.messageLimit) * 100)}%` 
                                      }}
                                    ></div>
                                  </div>
                                  <div className="text-[10px] text-muted text-right">
                                    {u.package.messageLimit === -1 ? 'Unlimited' : `${Math.min(100, Math.round((uMessages / u.package.messageLimit) * 100))}% used`}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted text-xs">—</span>
                              )}
                            </td>
                            <td>
                              <button
                                className="premium-action-btn"
                                style={{ background: isExpanded ? 'rgba(0, 168, 132, 0.1)' : 'transparent', color: isExpanded ? 'var(--primary)' : 'var(--text-muted)' }}
                                title={isExpanded ? "Collapse Details" : "Expand Details"}
                                onClick={() => setExpandedUserIds(prev => ({ ...prev, [u.id]: !prev[u.id] }))}
                              >
                                <ChevronDown 
                                  size={16} 
                                  style={{ 
                                    transform: isExpanded ? 'rotate(180deg)' : 'none',
                                    transition: 'transform 0.2s ease'
                                  }}
                                />
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="user-expanded-row">
                              <td colSpan="7" className="user-expanded-cell">
                                <div className="animate-slide-down user-breakdown-container">
                                  <div className="user-breakdown-header">
                                    <Smartphone size={16} className="text-primary" />
                                    <h4 className="user-breakdown-title">
                                      WhatsApp Instances Details for {u.username}
                                    </h4>
                                  </div>

                                  {connectedInstances.length > 0 ? (
                                    <table className="admin-subtable">
                                      <thead>
                                        <tr>
                                          <th>Instance Name</th>
                                          <th>Instance Key</th>
                                          <th>Phone Number</th>
                                          <th>Status</th>
                                          <th style={{ textAlign: 'right' }}>Messages Sent</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {connectedInstances.map(inst => (
                                          <tr key={inst.id}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{inst.name}</td>
                                            <td>
                                              <code className="subtable-code-key">{inst.instanceKey}</code>
                                            </td>
                                            <td>{inst.phone ? `+${inst.phone}` : 'Not Linked'}</td>
                                            <td>
                                              <span className={`user-breakdown-card-status ${inst.status === 'connected' ? 'connected' : 'disconnected'}`}>
                                                <span className="user-breakdown-card-status-dot"></span>
                                                {inst.status}
                                              </span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-main)' }}>{inst.messageCount || 0}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <div className="admin-empty-state" style={{ padding: '40px 24px', marginTop: '8px' }}>
                                      <div className="admin-empty-state-icon-box" style={{ width: '48px', height: '48px', padding: '12px' }}>
                                        <MessageSquare size={24} />
                                      </div>
                                      <div>
                                        <h4 className="admin-empty-state-title">No Connected Instances</h4>
                                        <p className="admin-empty-state-desc">No active, connected WhatsApp instances found for this user.</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const AssignPackageModal = ({ user, onClose, packages, handleAssignPackage }) => {
  const [selectedPkgId, setSelectedPkgId] = useState(user.packageId || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await handleAssignPackage(user.id, selectedPkgId);
    onClose();
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="assign-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Assign Package</h3>
          <button className="close-btn" onClick={onClose}><CloseIcon size={20} /></button>
        </div>

        <div className="modal-body">
          <p className="text-muted text-sm mb-6">
            Assign a subscription tier to <b>{user.username}</b>. This will override their current restrictions.
          </p>

          <div className="form-group-modern">
            <label>Select Package</label>
            <div className="custom-select-wrapper">
              <select
                value={selectedPkgId}
                onChange={(e) => setSelectedPkgId(e.target.value)}
                className="modern-select"
              >
                <option value="">None / Remove Package</option>
                {packages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} - ₹{pkg.price} ({pkg.isOneTime ? 'One-Time' : pkg.duration === -1 ? 'Lifetime' : `${pkg.duration} Days`})
                  </option>
                ))}
              </select>
              <ChevronDown className="select-arrow" size={18} />
            </div>
          </div>
        </div>

        <div className="modal-footer mt-8">
          <button className="premium-btn-outline" onClick={onClose}>Cancel</button>
          <button className="premium-btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ExtendExpiryModal = ({ user, onClose, handleExtendExpiry }) => {
  const getInitialDate = () => {
    if (!user.expiresAt) return '';
    const date = new Date(user.expiresAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getInitialDate());
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await handleExtendExpiry(user.id, selectedDate ? new Date(selectedDate) : null);
    onClose();
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="assign-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Extend Expiry Date</h3>
          <button className="close-btn" onClick={onClose}><CloseIcon size={20} /></button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            <p className="text-muted text-sm mb-6">
              Set or extend the subscription expiry date for <b>{user.username}</b>.
            </p>

            <div className="form-group-modern">
              <label>Expiry Date</label>
              <CustomDateInput
                value={selectedDate}
                onChange={setSelectedDate}
                placeholder="Expiry Date"
              />
              <span className="text-[11px] text-muted mt-2 block">
                Leave blank to set the package as "Never Expires".
              </span>
            </div>
          </div>

          <div className="modal-footer mt-8">
            <button type="button" className="premium-btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="premium-btn-primary" disabled={isSaving}>
              {isSaving ? 'Updating...' : 'Update Expiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SuspendUserModal = ({ user, onClose, handleStatusChange }) => {
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please enter a reason for suspension");
      return;
    }
    setIsSaving(true);
    await handleStatusChange(user.id, 'active', reason);
    onClose();
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="assign-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Suspend User</h3>
          <button className="close-btn" onClick={onClose}><CloseIcon size={20} /></button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            <p className="text-muted text-sm mb-6">
              Please enter the reason for suspending <b>{user.username}</b>.
              Their active WhatsApp instances will be disconnected.
            </p>

            <div className="form-group-modern">
              <label>Reason *</label>
              <textarea
                placeholder="Enter suspension reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  background: 'var(--surface-hover)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px', 
                  color: 'var(--text-main)', 
                  resize: 'vertical',
                  fontSize: '0.9rem' 
                }}
                required
              />
            </div>
          </div>

          <div className="modal-footer mt-8">
            <button type="button" className="premium-btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="premium-btn-primary" disabled={isSaving}>
              {isSaving ? 'Suspending...' : 'Confirm Suspension'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteUserModal = ({ user, onClose, handleDeleteUser }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    await handleDeleteUser(user.id);
    onClose();
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
      <div className="assign-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ color: '#ef4444' }}>Delete User Account</h3>
          <button className="close-btn" onClick={onClose}><CloseIcon size={20} /></button>
        </div>

        <div className="modal-body">
          <p className="text-muted text-sm mb-4">
            Are you sure you want to permanently delete user <b>{user.username}</b> ({user.email})?
          </p>
          <p className="text-sm mb-6" style={{ color: '#ef4444', fontWeight: 600 }}>
            WARNING: This action is irreversible. All of the user's WhatsApp instances, messages, templates, and subscription logs will be permanently deleted.
          </p>
        </div>

        <div className="modal-footer mt-8">
          <button className="premium-btn-outline" onClick={onClose}>Cancel</button>
          <button 
            className="premium-btn-primary" 
            style={{ background: '#ef4444', borderColor: '#ef4444' }}
            onClick={handleConfirm} 
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
