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

      <div className="dashboard-card glass p-0 overflow-hidden">
        <div className="table-responsive">
          <table className="admin-table">
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
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>Loading payments...</td></tr>
              ) : currentRows.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>No payments found.</td></tr>
              ) : currentRows.map((payment) => (
                <tr key={payment.id}>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {new Date(payment.createdAt).toLocaleDateString('en-GB')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{payment.user?.username}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{payment.user?.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge-plan" style={{
                      background: 'var(--surface)',
                      padding: '4px 12px',
                      borderRadius: '100px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: '1px solid var(--border)'
                    }}>
                      {payment.package?.name}
                    </span>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'var(--primary)10', padding: '2px 6px', borderRadius: '4px' }}>
                      {payment.razorpayOrderId}
                    </code>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.05rem' }}>
                      ₹{payment.amount?.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background: `${getStatusColor(payment.status)}15`,
                      color: getStatusColor(payment.status)
                    }}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
            <span>{indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredPayments.length)} of {filteredPayments.length}</span>
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

export default AdminPayments;
