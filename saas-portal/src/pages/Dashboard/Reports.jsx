import { useState, useEffect, useCallback } from 'react';
import { Calendar, Smartphone, Download, AlertCircle, BarChart3, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { messageService } from '../../api/services';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Reports.css';
import CustomDateInput from '../../components/CustomDateInput';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expandedInstance, setExpandedInstance] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      const [repRes, logsRes] = await Promise.all([
        messageService.getReports(),
        messageService.getLogs()
      ]);
      setReports(repRes.data.reports || []);
      setLogs(logsRes.data.logs || []);
    } catch (err) {
      console.error("Fetch Reports Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (active) {
        fetchReports();
      }
    }, 0);
    return () => {
      active = false;
    };
  }, [fetchReports]);

  // Filtered reports based on dates
  const filteredReports = reports.filter(item => {
    if (!fromDate && !toDate) return true;
    const reportDate = new Date(item.date);
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      if (reportDate < from) return false;
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      if (reportDate > to) return false;
    }
    return true;
  });

  // Calculate dynamic metrics based on filteredReports
  const totalSent = filteredReports.reduce((sum, item) => item.status === 'sent' ? sum + parseInt(item.count) : sum, 0);
  const totalFailed = filteredReports.reduce((sum, item) => item.status === 'failed' ? sum + parseInt(item.count) : sum, 0);
  const totalMessages = totalSent + totalFailed;
  const deliveryRate = totalMessages > 0 ? ((totalSent / totalMessages) * 100).toFixed(1) : '100.0';

  // Group by date AND instanceId for rendering
  const groupedReports = filteredReports.reduce((acc, curr) => {
    const date = curr.date;
    const instId = curr.instanceId;
    if (!acc[date]) acc[date] = {};
    if (!acc[date][instId]) {
      acc[date][instId] = {
        instance: curr.instance,
        instanceId: instId,
        date: date,
        sent: 0,
        failed: 0
      };
    }
    if (curr.status === 'sent') acc[date][instId].sent += parseInt(curr.count);
    if (curr.status === 'failed') acc[date][instId].failed += parseInt(curr.count);
    return acc;
  }, {});

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 168, 132); // WhatsApp Green
    doc.text('WA-Mitra Message Report', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 30);
    
    if (fromDate || toDate) {
      doc.text(`Period: ${fromDate || 'Start'} to ${toDate || 'End'}`, 14, 37);
    }

    const tableRows = [];
    Object.keys(groupedReports).forEach(date => {
      Object.values(groupedReports[date]).forEach(stat => {
        tableRows.push([
          new Date(stat.date).toLocaleDateString('en-GB'),
          stat.instance?.name || 'Unknown',
          stat.sent,
          stat.failed
        ]);
      });
    });

    autoTable(doc, {
      startY: 45,
      head: [['Date', 'Instance Name', 'Sent Messages', 'Failed Messages']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [0, 168, 132] },
      margin: { top: 45 }
    });

    // Add Detailed logs table
    const detailedRows = [];
    const dateFilteredLogs = logs.filter(log => {
      if (!fromDate && !toDate) return true;
      const logDate = new Date(log.createdAt);
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (logDate < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (logDate > to) return false;
      }
      return true;
    });

    dateFilteredLogs.forEach(log => {
      detailedRows.push([
        new Date(log.createdAt).toLocaleString('en-GB'),
        log.instance?.name || 'Unknown',
        log.recipient,
        log.status === 'sent' ? 'Sent' : 'Failed',
        log.errorMessage || '-'
      ]);
    });

    if (detailedRows.length > 0) {
      const finalY = doc.lastAutoTable.finalY || 45;
      doc.setFontSize(14);
      doc.setTextColor(0, 168, 132);
      doc.text('Detailed Message Log', 14, finalY + 15);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Date & Time', 'Instance Name', 'Recipient Number', 'Status', 'Failure Reason']],
        body: detailedRows,
        theme: 'grid',
        headStyles: { fillColor: [0, 168, 132] },
        margin: { top: 45 }
      });
    }

    doc.save(`WA-Mitra_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="reports-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Message Reports</h1>
          <p className="page-subtitle">Track your message usage across all instances.</p>
        </div>
        <button className="premium-btn-primary" onClick={downloadPDF} disabled={filteredReports.length === 0} style={{ height: '42px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
          <Download size={18} /> Download PDF
        </button>
      </div>

      {/* Dynamic Overview Cards */}
      <div className="reports-overview-grid animate-fade-in">
        <div className="overview-metric-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(0, 168, 132, 0.08)', color: 'var(--primary)' }}>
            <Smartphone size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-title">Total Volume</span>
            <span className="metric-value">{totalMessages}</span>
          </div>
        </div>

        <div className="overview-metric-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)' }}>
            <BarChart3 size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-title">Sent</span>
            <span className="metric-value" style={{ color: 'var(--success)' }}>{totalSent}</span>
          </div>
        </div>

        <div className="overview-metric-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.08)', color: 'var(--error)' }}>
            <AlertCircle size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-title">Failed</span>
            <span className="metric-value" style={{ color: totalFailed > 0 ? 'var(--error)' : 'var(--text-main)' }}>{totalFailed}</span>
          </div>
        </div>

        <div className="overview-metric-card">
          <div className="metric-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
            <RotateCcw size={22} style={{ transform: 'rotate(90deg)' }} />
          </div>
          <div className="metric-info">
            <span className="metric-title">Success Rate</span>
            <span className="metric-value">{deliveryRate}%</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="report-filters glass animate-fade-in">
        <div className="filter-group">
          <CustomDateInput 
            value={fromDate} 
            onChange={setFromDate}
            placeholder="From Date"
            style={{ maxWidth: '180px' }}
          />
          <span className="filter-separator">to</span>
          <CustomDateInput 
            value={toDate} 
            onChange={setToDate}
            placeholder="To Date"
            style={{ maxWidth: '180px' }}
          />
          {(fromDate || toDate) && (
            <button 
              className="btn-icon-text" 
              style={{ marginLeft: 'auto' }}
              onClick={() => { setFromDate(''); setToDate(''); }}
            >
              <RotateCcw size={14} /> Clear Filters
            </button>
          )}
        </div>
      </div>

      <div className="reports-content">
        {loading ? (
          <div className="reports-empty-container animate-fade-in">
            <div className="reports-empty-icon-inner">
              <BarChart3 size={38} />
            </div>
            <h3 className="reports-empty-title">Loading Reports...</h3>
            <p className="reports-empty-description">Fetching deliverability logs from database.</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="reports-empty-container animate-fade-in">
            <div className="reports-empty-icon-inner">
              <BarChart3 size={38} />
            </div>
            <h3 className="reports-empty-title">No Message Reports Found</h3>
            <p className="reports-empty-description" style={{ margin: 0 }}>
              {fromDate || toDate
                ? `No message logs match the selected date range from ${fromDate || 'start'} to ${toDate || 'end'}.`
                : 'Start sending single, bulk, or scheduled WhatsApp messages to track real-time deliverability analytics here.'}
            </p>
          </div>
        ) : (
          Object.keys(groupedReports).map(date => {
            // Calculate day's total
            const daySent = Object.values(groupedReports[date]).reduce((acc, curr) => acc + curr.sent, 0);
            const dayFailed = Object.values(groupedReports[date]).reduce((acc, curr) => acc + curr.failed, 0);
            
            return (
              <div key={date} className="report-group">
                <div className="date-header-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} className="text-primary" />
                    <h3>{new Date(date).toLocaleDateString('en-GB')}</h3>
                  </div>
                  <span className="day-summary-badge">
                    {daySent + dayFailed} total ({daySent} sent, {dayFailed} failed)
                  </span>
                </div>
                <div className="instance-stats-grid">
                  {Object.values(groupedReports[date]).map((stat, i) => {
                    const isExpanded = expandedInstance?.date === date && expandedInstance?.instanceId === stat.instanceId;
                    const instanceFailures = logs.filter(l => 
                      l.status === 'failed' && 
                      l.instanceId === stat.instanceId && 
                      new Date(l.createdAt).toISOString().split('T')[0] === date
                    );

                    return (
                      <div key={i} className="stat-card-wrap">
                        <div 
                          className={`stat-item ${stat.failed > 0 ? 'has-failures pointer' : ''} ${isExpanded ? 'expanded' : ''}`}
                          onClick={() => stat.failed > 0 && setExpandedInstance(isExpanded ? null : { date, instanceId: stat.instanceId })}
                        >
                          <div className="stat-left">
                            <div className="stat-device-icon">
                              <Smartphone size={20} />
                            </div>
                            <div>
                              <h4>{stat.instance?.name || 'Unknown Instance'}</h4>
                              <p>ID: {stat.instanceId || 'Deleted ID'}</p>
                            </div>
                          </div>
                          <div className="stat-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="stat-count">
                              <span className="count-badge sent">{stat.sent}</span>
                              <span className="count-label">Sent</span>
                            </div>
                            {stat.failed > 0 ? (
                              <div className="stat-count">
                                <span className="count-badge failed">{stat.failed}</span>
                                <span className="count-label">Failed</span>
                              </div>
                            ) : null}
                            {stat.failed > 0 && (
                              <div className="stat-chevron">
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {isExpanded && instanceFailures.length > 0 && (
                          <div className="failure-details animate-slide-down">
                            <div className="failure-header">
                              <AlertCircle size={14} className="text-error" />
                              <span>Failure Log details</span>
                            </div>
                            <div className="failure-table-wrapper" data-lenis-prevent>
                              <table className="failure-table">
                                <thead>
                                  <tr>
                                    <th>Recipient</th>
                                    <th>Error details</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {instanceFailures.map((f, idx) => (
                                    <tr key={idx}>
                                      <td className="fail-num">{f.recipient}</td>
                                      <td className="fail-reason">{f.errorMessage || 'Unknown service failure'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Reports;
