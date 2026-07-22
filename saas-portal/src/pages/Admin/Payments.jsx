import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import API from '../../api/axiosConfig';
import './Admin.css';

const AdminPayments = () => {
  const { searchQuery } = useOutletContext();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await API.get('/admin/payments');
        setPayments(res.data.payments);
        setLoading(false);
      } catch (err) {
        console.error("Payments Fetch Error:", err);
      }
    };
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(p =>
    p.razorpayOrderId?.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    p.user?.username?.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    p.user?.email?.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    p.package?.name?.toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredPayments.slice(indexOfFirstRow, indexOfLastRow);

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
  }, [searchQuery]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#10b981';
      case 'active': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'failed': return '#ef4444';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="admin-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Transaction History</h1>
          <p className="page-subtitle">Monitor all portal revenue and subscription payments.</p>
        </div>
      </div>

      <div className="premium-table-card animate-fade-in">
        <div className="premium-table-wrapper">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Plan</th>
                <th>Order ID</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-20">Loading payments...</td></tr>
              ) : currentRows.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-20">No payments found.</td></tr>
              ) : currentRows.map((payment) => (
                <tr key={payment.id}>
                  <td className="text-sm font-medium">
                    {new Date(payment.createdAt).toLocaleDateString('en-GB')}
                  </td>
                  <td>
                    <div className="flex-row-center-gap-16">
                      <div className="premium-avatar">
                        {payment.user?.username ? payment.user.username.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="flex-col-left">
                        <div className="premium-username">{payment.user?.username || 'Unknown'}</div>
                        <div className="premium-email">{payment.user?.email || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="premium-package-badge">
                      {payment.package?.name || 'Free'}
                    </span>
                  </td>
                  <td>
                    <code className="subtable-code-key">
                      {payment.razorpayOrderId || 'N/A'}
                    </code>
                  </td>
                  <td>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                      <span style={{ marginRight: '4px', color: 'var(--text-secondary)' }}>₹</span>
                      <span>{payment.amount?.toLocaleString()}</span>
                    </div>
                  </td>
                  <td>
                    <div className={`premium-role-badge ${payment.status?.toLowerCase() === 'completed' || payment.status?.toLowerCase() === 'active' ? 'business-owner' : payment.status?.toLowerCase() === 'failed' ? 'suspended-badge' : 'admin'}`} style={{ height: '26px', padding: '0 12px', borderRadius: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                        {payment.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
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
            <span>Showing {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredPayments.length)} of {filteredPayments.length} transactions</span>
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
    </div>
  );
};

export default AdminPayments;
