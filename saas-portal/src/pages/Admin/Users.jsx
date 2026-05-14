import React, { useState, useEffect } from 'react';
import {
  Search,
  UserX,
  UserCheck,
  Smartphone,
  MessageSquare,
  Mail,
  Building2,
  Calendar,
  MoreVertical,
  ShieldAlert,
  Trash2,
  Shield,
  ShieldCheck,
  Briefcase,
  User as UserIcon,
  Plus,
  Package,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X as CloseIcon
} from 'lucide-react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import API from '../../api/axiosConfig';
import '../Dashboard/Dashboard.css';
import '../Dashboard/Overview.css';
import './Admin.css';

const AdminUsers = () => {
  const { searchQuery } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [assigningUser, setAssigningUser] = useState(null);
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

  useEffect(() => {
    fetchUsers();
    fetchPackages();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/users', formData);
      setShowForm(false);
      setFormData({ username: '', email: '', password: '', role: 'admin', packageId: '' });
      fetchUsers();
    } catch (err) {
      alert("Failed to create admin");
    }
  };

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

  const handleStatusChange = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await API.post('/admin/users/status', { userId, status: newStatus });
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (err) {
      alert("Failed to update user status");
    }
  };

  const handleAssignPackage = async (userId, packageId) => {
    try {
      await API.post('/admin/users/assign-package', { userId, packageId });
      setAssigningUser(null);
      fetchUsers();
    } catch (err) {
      alert("Failed to assign package");
    }
  };

  const filteredUsers = users.filter(u => {
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
    setCurrentPage(1);
  }, [roleFilter, searchQuery]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB');
  };

  const AssignPackageModal = ({ user, onClose }) => {
    const [selectedPkgId, setSelectedPkgId] = useState(user.packageId || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
      setIsSaving(true);
      await handleAssignPackage(user.id, selectedPkgId);
      onClose();
    };

    return (
      <div className="modal-overlay animate-fade-in" onClick={onClose}>
        <div className="assign-modal glass" onClick={e => e.stopPropagation()}>
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
                      {pkg.name} - ₹{pkg.price} ({pkg.isOneTime ? 'One-Time' : `${pkg.duration} Days`})
                    </option>
                  ))}
                </select>
                <ChevronDown className="select-arrow" size={18} />
              </div>
            </div>
          </div>

          <div className="modal-footer mt-8">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-users-container animate-fade-in">
      {assigningUser && (
        <AssignPackageModal
          user={assigningUser}
          onClose={() => setAssigningUser(null)}
        />
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Monitor system users, their quotas, and active status.</p>
        </div>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
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
            <br></br>

            <div className="form-footer-modern mt-8 pt-8 border-t border-white/5" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', flexWrap: 'nowrap' }}>
              <button type="submit" className="btn-primary shadow-glow" style={{ width: '160px', height: '44px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                Create Admin
              </button>
              <button type="button" className="btn-outline-pill" onClick={() => setShowForm(false)} style={{ width: '160px', height: '44px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="users-filter-bar mt-4">
        <div className="filter-tabs-modern">
          <button
            className={`filter-tab-text ${roleFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRoleFilter('all')}
          >
            All Users
          </button>
          <button
            className={`filter-tab-text ${roleFilter === 'user' ? 'active' : ''}`}
            onClick={() => setRoleFilter('user')}
          >
            Business Owners
          </button>
          <button
            className={`filter-tab-text ${roleFilter === 'admin' ? 'active' : ''}`}
            onClick={() => setRoleFilter('admin')}
          >
            Portal Admins
          </button>
        </div>
      </div>

      <div className="glass mt-4 overflow-hidden">
        <table className="admin-table">
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
              currentRows.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className="avatar-circle" style={{
                        backgroundColor: `hsl(${(user.username.length * 40) % 360}, 60%, 55%)`,
                        flexShrink: 0
                      }}>
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="font-bold text-sm" style={{ whiteSpace: 'nowrap' }}>{user.username}</div>
                        <div className="text-[11px] text-muted" style={{ whiteSpace: 'nowrap' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="role-badge">
                      <Briefcase size={12} />
                      <span>{user.role === 'admin' ? 'PORTAL_ADMIN' : 'BUSINESS_OWNER'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm font-medium">
                      {formatDate(user.createdAt)}
                    </div>
                  </td>
                  <td>
                    <div className="pkg-info-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`pkg-tag ${(user.package?.name || 'Free').toLowerCase()}`}>
                          {user.package?.name || 'Free'}
                        </span>
                        {user.payments?.[0]?.paymentMethod === 'manual_admin' && (
                          <span style={{
                            fontSize: '9px',
                            background: 'var(--primary)20',
                            color: 'var(--primary)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Manually Assigned
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted mt-1">
                        Expires: {user.expiresAt ? formatDate(user.expiresAt) : 'Never'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={user.status === 'active'}
                          onChange={() => handleStatusChange(user.id, user.status)}
                          disabled={user.role === 'admin'}
                        />
                        <span className="slider round"></span>
                      </label>
                      <span className={`text-xs font-semibold ${user.status === 'active' ? 'text-success' : 'text-error'}`}>
                        {user.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                      {user.role !== 'admin' && (
                        <>
                          <button
                            className="action-btn-assign"
                            title="Assign Package"
                            onClick={() => setAssigningUser(user)}
                          >
                            <Package size={16} />
                          </button>

                          <button className="action-btn-delete" title="Delete User">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="table-pagination">
          <div className="pagination-rows">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="pagination-select"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>

          <div className="pagination-info">
            <span>{indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredUsers.length)} of {filteredUsers.length}</span>
            <div className="pagination-actions">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="pagination-btn"
                title="Previous Page"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="pagination-btn"
                title="Next Page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
